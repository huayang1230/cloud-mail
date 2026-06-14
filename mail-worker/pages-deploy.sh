#!/bin/bash
set -e

# ── 必填变量校验 ──────────────────────────────────────────────
if [ -z "$JWT_SECRET" ] || echo "$JWT_SECRET" | grep -q '[?%#/\\]'; then
  echo "❌ JWT_SECRET 未设置或包含非法字符 (?, %, #, /, \\)"; exit 1
fi
if ! echo "$DOMAIN" | jq -e 'type == "array"' >/dev/null 2>&1; then
  echo '❌ DOMAIN 必须是 JSON 数组格式，例如 ["example.com"]'; exit 1
fi
if [ -z "$ADMIN" ]; then
  echo "❌ ADMIN 不能为空"; exit 1
fi
if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "❌ CLOUDFLARE_ACCOUNT_ID 不能为空"; exit 1
fi
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN 不能为空"; exit 1
fi

# ── 默认值 ────────────────────────────────────────────────────
NAME="${NAME:-cloud-mail}"
AI_MODEL="${AI_MODEL:-@cf/meta/llama-3.1-8b-instruct}"
ANALYSIS_CACHE="${ANALYSIS_CACHE:-false}"

# ── 生成临时 wrangler 配置 ────────────────────────────────────
CONFIG="wrangler-pages.toml"
cp wrangler-action.toml "$CONFIG"

# 移除未配置的可选块
[ -z "$R2_BUCKET_NAME" ]    && sed -i '/\[\[r2_buckets\]\]/,/^$/d'             "$CONFIG"
[ -z "$CUSTOM_DOMAIN" ]     && sed -i '/\[\[routes\]\]/,/^$/d'                 "$CONFIG"
[ -z "$PROJECT_LINK" ]      && sed -i '/^project_link = /d'                    "$CONFIG"
if [ -z "$LINUXDO_CLIENT_ID" ] || [ -z "$LINUXDO_CLIENT_SECRET" ]; then
  sed -i '/^linuxdo_client_id = /,/^linuxdo_switch = /d' "$CONFIG"
fi

# ── 自动创建 / 查询 KV ────────────────────────────────────────
if [ -n "$KV_NAMESPACE_ID" ]; then
  echo "✅ 使用已提供的 KV Namespace ID"
else
  echo "🔍 查询 KV Namespace..."
  KV_LIST=$(pnpm wrangler kv namespace list 2>&1)
  if echo "$KV_LIST" | jq -e ".[] | select(.title == \"$NAME\")" >/dev/null 2>&1; then
    KV_NAMESPACE_ID=$(echo "$KV_LIST" | jq -r ".[] | select(.title == \"$NAME\") | .id")
    echo "✅ 已存在 KV: $KV_NAMESPACE_ID"
  else
    echo "⚠️ 正在创建 KV Namespace: $NAME ..."
    pnpm wrangler kv namespace create "$NAME"
    KV_LIST=$(pnpm wrangler kv namespace list)
    KV_NAMESPACE_ID=$(echo "$KV_LIST" | jq -r ".[] | select(.title == \"$NAME\") | .id")
    echo "✅ 创建完成: $KV_NAMESPACE_ID"
  fi
fi

# ── 自动创建 / 查询 D1 ────────────────────────────────────────
if [ -n "$D1_DATABASE_ID" ]; then
  echo "✅ 使用已提供的 D1 Database ID"
else
  echo "🔍 查询 D1 Database..."
  DB_LIST=$(pnpm wrangler d1 list --json 2>&1)
  if echo "$DB_LIST" | jq -e ".[] | select(.name == \"$NAME\")" >/dev/null 2>&1; then
    D1_DATABASE_ID=$(echo "$DB_LIST" | jq -r ".[] | select(.name == \"$NAME\") | .uuid")
    echo "✅ 已存在 D1: $D1_DATABASE_ID"
  else
    echo "⚠️ 正在创建 D1 Database: $NAME ..."
    pnpm wrangler d1 create "$NAME"
    DB_LIST=$(pnpm wrangler d1 list --json)
    D1_DATABASE_ID=$(echo "$DB_LIST" | jq -r ".[] | select(.name == \"$NAME\") | .uuid")
    echo "✅ 创建完成: $D1_DATABASE_ID"
  fi
fi

# ── 变量替换 ──────────────────────────────────────────────────
sed -i "s|\${NAME}|${NAME}|g"                           "$CONFIG"
sed -i "s|\${CUSTOM_DOMAIN}|${CUSTOM_DOMAIN}|g"         "$CONFIG"
sed -i "s|\"\${DOMAIN}\"|${DOMAIN}|g"                   "$CONFIG"
sed -i "s|\${ADMIN}|${ADMIN}|g"                         "$CONFIG"
sed -i "s|\${JWT_SECRET}|${JWT_SECRET}|g"               "$CONFIG"
sed -i "s|\${D1_DATABASE_ID}|${D1_DATABASE_ID}|g"       "$CONFIG"
sed -i "s|\${KV_NAMESPACE_ID}|${KV_NAMESPACE_ID}|g"     "$CONFIG"
sed -i "s|\${R2_BUCKET_NAME}|${R2_BUCKET_NAME}|g"       "$CONFIG"
sed -i "s|\${PROJECT_LINK}|${PROJECT_LINK}|g"           "$CONFIG"
sed -i "s|\${ANALYSIS_CACHE}|${ANALYSIS_CACHE}|g"       "$CONFIG"
sed -i "s|\${AI_MODEL}|${AI_MODEL}|g"                   "$CONFIG"
sed -i "s|\${LINUXDO_CLIENT_ID}|${LINUXDO_CLIENT_ID}|g"         "$CONFIG"
sed -i "s|\${LINUXDO_CLIENT_SECRET}|${LINUXDO_CLIENT_SECRET}|g" "$CONFIG"
sed -i "s|\${LINUXDO_CALLBACK_URL}|${LINUXDO_CALLBACK_URL}|g"   "$CONFIG"
sed -i "s|\${LINUXDO_SWITCH}|${LINUXDO_SWITCH}|g"               "$CONFIG"

# ── 部署 ──────────────────────────────────────────────────────
echo "🚀 正在部署到 Cloudflare Workers..."
pnpm wrangler deploy -c "$CONFIG" 2>&1 | tee deploy.log

# ── 初始化数据库（仅首次需要，幂等，重复调用无副作用）────────
echo "⏳ 等待 Worker 就绪..."
sleep 15

WORKER_URL="${CUSTOM_DOMAIN:+https://$CUSTOM_DOMAIN}"
if [ -z "$WORKER_URL" ]; then
  WORKER_URL=$(grep -o "https://[^ ]*\.workers\.dev" deploy.log | head -1)
fi

if [ -n "$WORKER_URL" ]; then
  echo "🛠️ 初始化数据库: $WORKER_URL/api/init/***"
  HTTP_CODE=$(curl -sL -w "%{http_code}" -o /tmp/init_resp.txt "$WORKER_URL/api/init/${JWT_SECRET}")
  RESP=$(cat /tmp/init_resp.txt)
  if [ "$RESP" = "success" ]; then
    echo "✅ 数据库初始化完成"
  else
    echo "⚠️ 初始化返回: HTTP $HTTP_CODE / $RESP（如已初始化可忽略）"
  fi
else
  echo "⚠️ 未能获取 Worker URL，请手动访问 /api/init/<jwt_secret> 完成初始化"
fi

echo "🎉 部署完成！"
