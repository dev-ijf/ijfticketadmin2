# ijfticketadminv2main

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/dev-9192s-projects/v0-ijfticketadminv2main-x4)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/projects/tPyqHXnhXDu)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/dev-9192s-projects/v0-ijfticketadminv2main-x4](https://vercel.com/dev-9192s-projects/v0-ijfticketadminv2main-x4)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/projects/tPyqHXnhXDu](https://v0.app/chat/projects/tPyqHXnhXDu)**

## Instalasi dependensi (lokal / fork)

Lockfile resmi proyek ini adalah **`pnpm-lock.yaml`**. Jangan menjalankan `npm install` di atas folder `node_modules` yang sudah diisi **pnpm** — struktur `.pnpm` membuat **npm 11** bisa crash dengan error `Cannot read properties of null (reading 'matches')`.

**Disarankan (pnpm):**

```bash
rm -rf node_modules
pnpm install
```

**Jika harus memakai npm:** hapus `node_modules` sepenuhnya, lalu instal dari awal (file `.npmrc` sudah mengaktifkan `legacy-peer-deps`):

```bash
rm -rf node_modules
npm install
```

Jika npm tetap error, coba npm 10: `npx npm@10 install`.

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
