# sparkling-cloud-mail-native

Internal Sparkling Method package for Cloud Mail mobile host integrations.

Generated from `src/cloud-mail-native.d.ts`, this module exposes:

- `cloudMailNative.copyText({ text })`
- `cloudMailNative.openExternalUrl({ url })`
- `cloudMailNative.pickFiles({ maxCount })`
- `cloudMailNative.openFile({ filePath, mimeType })`

Run codegen from this directory with:

```bash
sparkling-method-cli codegen --src src
```

The Lynx app also keeps JS fallbacks for external URLs and media selection.
