#!/usr/bin/env bash
set -euo pipefail

CONFIG_FILE="wrangler-action.toml"
TMP_FILE="wrangler.toml"

# Validate required variables
if [ -z "${JWT_SECRET:-}" ] || echo "${JWT_SECRET}" | grep -q '[?%#/\\]'; then
  echo "❌ JWT_SECRET is empty or contains invalid characters (?, %, #, /, \\)."
  exit 1
fi

if ! echo "${DOMAIN:-}" | jq -e 'type == "array"' >/dev/null 2>&1; then
  echo "❌ DOMAIN must be a JSON array (e.g., [\"example.com\"])."
  exit 1
fi

if [ -z "${ADMIN:-}" ]; then
  echo "❌ ADMIN cannot be empty."
  exit 1
fi

if [ -z "${D1_DATABASE_ID:-}" ]; then
  echo "❌ D1_DATABASE_ID cannot be empty."
  exit 1
fi

if [ -z "${KV_NAMESPACE_ID:-}" ]; then
  echo "❌ KV_NAMESPACE_ID cannot be empty."
  exit 1
fi

cp "$CONFIG_FILE" "$TMP_FILE"

if [ -z "${R2_BUCKET_NAME:-}" ]; then
  sed -i '/\[\[r2_buckets\]\]/,/^$/d' "$TMP_FILE"
fi

if [ -z "${PROJECT_LINK:-}" ]; then
  sed -i '/^project_link = /d' "$TMP_FILE"
fi

if [ -z "${CUSTOM_DOMAIN:-}" ]; then
  sed -i '/\[\[routes\]\]/,/^$/d' "$TMP_FILE"
fi

if [ -z "${LINUXDO_CLIENT_ID:-}" ] || [ -z "${LINUXDO_CLIENT_SECRET:-}" ]; then
  sed -i '/^linuxdo_client_id = /,/^linuxdo_switch = /d' "$TMP_FILE"
fi

if [ "$(echo "${CLOUDFLARE_EMAIL:-}" | tr '[:upper:]' '[:lower:]')" = "true" ]; then
  printf '\n[[send_email]]\nname = "email"\n' >> "$TMP_FILE"
fi

envsubst < "$TMP_FILE" > "${TMP_FILE}.tmp" && mv "${TMP_FILE}.tmp" "$TMP_FILE"

echo "✅ Config generated. Starting deployment..."
npx wrangler deploy -c "$TMP_FILE" "$@"
