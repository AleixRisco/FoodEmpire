# Food Empire (Telegram Mini App)

## Run
```bash
cd apps/web
npm install
npm run dev
```

## Goal
Idle food game: produce food, upgrade stations, manage queues, collect offline earnings.
Mobile-first UI. TypeScript + Next.js App Router.

## Assets
Put UI images in: apps/web/public/ui/

## GitHub Pages
`apps/web` is prepared for static export on GitHub Pages.

What is already configured:
- `output: "export"` in [next.config.ts](/Users/aleixrisco/Desktop/AR%20%7C%20CraftLoop/AR%20%7C%20Telegram%20Projects/Food%20Empire/apps/web/next.config.ts)
- automatic `basePath` / `assetPrefix` during GitHub Actions builds
- `next/image` configured with `unoptimized: true`

### Steps
1. Create a GitHub repository and push the full project.
2. In the repo root on GitHub, create `.github/workflows/deploy-pages.yml`.
3. Paste this workflow:

```yml
name: Deploy Pages

on:
  push:
    branches:
      - main
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/web
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: apps/web/package-lock.json

      - name: Setup Pages
        uses: actions/configure-pages@v5

      - name: Install dependencies
        run: npm ci

      - name: Build static export
        env:
          GITHUB_ACTIONS: "true"
          GITHUB_REPOSITORY: ${{ github.repository }}
        run: npm run build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: apps/web/out

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

4. In GitHub:
   Pages -> Build and deployment -> Source -> `GitHub Actions`
5. Push to `main`.
6. Wait for the workflow to finish.

### URL format
- If your repo is `username.github.io`, the site will be published at the root domain.
- If your repo is any other name, the site will be published at:
  `https://username.github.io/repository-name/`

### Local production export check
```bash
cd apps/web
npm run build
```

This generates the static site in `apps/web/out`.
