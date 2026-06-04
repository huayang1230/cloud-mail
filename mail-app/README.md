# Cloud Mail Mobile

Sparkling + ReactLynx iOS / Android app for Cloud Mail. The default API endpoint is `https://mail.yzsaas.net/api`.

## Setup

Use Node.js 24 for Sparkling:

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
pnpm install
```

## Run iOS

iOS requires Xcode, iOS Simulator, CocoaPods, and a Ruby version supported by the project Gemfile.

```bash
export PATH="/opt/homebrew/opt/ruby/bin:$HOME/.gem/ruby/4.0.0/bin:$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
pnpm run run:ios
```

## Run Android

Android requires JDK and Android SDK / emulator setup.

```bash
export PATH="$HOME/.nvm/versions/node/v24.16.0/bin:$PATH"
pnpm run run:android
```

## Useful Commands

```bash
pnpm run doctor
pnpm run build
pnpm run autolink
pnpm run test
```
