# substarr

A minimalist, Linear-inspired custom dashboard and UI wrapper for YouTube subscriptions. Features hierarchical nested folders, multi-tagging, drag-and-drop reorganization, distraction-free playback, 5 interchangeable layout styles, and Google OAuth / 1-click Takeout CSV sync.

---

## Deploying to Cloudflare

This repository supports both Cloudflare deployment flows:
- **Cloudflare Workers (Workers Builds)** (when you see **Deploy command** and **Root directory**)
- **Cloudflare Pages** (when you see **Build output directory** and **Framework preset**)

---

### If you see "Deploy command" and "Root directory" (Cloudflare Workers Builds)

You are in Cloudflare's **Workers Builds** interface (or creating a Worker from Git):

1. **Root directory**: Leave blank or set to `/` (since the project files are at the root of the repository).
2. **Build command** *(if shown)*: `npm run build`
3. **Deploy command**: `npx wrangler deploy` (the default)
4. **Environment Variables**:
   - `NODE_VERSION` = `22`

The repository includes a ready-to-use `wrangler.toml` configured with Cloudflare Workers Static Assets:
```toml
name = "substarr"
compatibility_date = "2026-10-01"

[assets]
directory = "./dist"
not_found_handling = "single-page-application"
html_handling = "auto-trailing-slash"

[build]
command = "npm run build"
```
When `npx wrangler deploy` runs, Cloudflare automatically executes `npm run build` and serves `./dist` with SPA routing (`not_found_handling = "single-page-application"`), handling all routes smoothly without 404s!

---

### If you want to use Cloudflare Pages (Traditional Static Site Hosting)

If you prefer standard **Cloudflare Pages**:
1. In Cloudflare Dashboard, go to **Workers & Pages** → **Create application** → **Pages** tab (make sure you choose the **Pages** tab, not Worker).
2. Connect your GitHub repository.
3. Configure:
   - **Framework preset**: `Vite` (or `None`)
   - **Build command**: `npm install && npm run build` (or `npm run build`)
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank)
4. In **Environment variables**:
   - `NODE_VERSION` = `22`
   - `SKIP_DEPENDENCY_INSTALL` = `1`

---

### Method 2: Deploy via Wrangler CLI

If you prefer deploying from your terminal:

```bash
# 1. Install dependencies
npm install

# 2. Build the production assets
npm run build

# 3. Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=substarr
```

---

### Method 3: GitHub Actions (Automated CI/CD)

A GitHub Actions workflow is included at `.github/workflows/deploy-cloudflare.yml`. To enable automated deployments on every `git push`:
1. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**.
2. Add these two repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Pages edit permissions (create one at [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)).
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID (found on your dashboard homepage or Workers & Pages overview).

---

## Configuring Google OAuth on your Cloudflare Domain

Once your Cloudflare site is live (e.g. `https://substarr.pages.dev` or a custom domain like `https://youtube.yourdomain.com`):

1. Open the [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Under **OAuth 2.0 Client IDs**, select your OAuth Client ID (or the one generated for substarr).
3. Under **Authorized JavaScript origins**, click **+ ADD URI** and add:
   - `https://<your-project>.pages.dev` (e.g., `https://substarr.pages.dev`)
   - `https://<your-custom-domain>` (if using a custom domain)
4. Click **Save**.
5. In **substarr**, click **"1-Click YouTube Sync"** → **"Sign in with Google"**. Google will authenticate your account and allow you to import all subscriptions in 1 click!

---

## Features

- **Nested Folders & Grouping**: Organize channels into custom folders and subfolders.
- **Drag-and-Drop Organization**: Drag any channel card to any folder in the sidebar.
- **5 Display Layouts**: Large Thumbnails, Small Thumbnails, Detailed List, Simple List, and Cinematic Banners.
- **Distraction-Free Video Player**: Clean embedded playback without algorithmic clickbait, recommended rabbit holes, or comment clutter.
- **YouTube Data API v3 & 1-Click Sync**: Support for live API keys, Google OAuth, and instant YouTube Takeout `subscriptions.csv` import.
- **Local Persistence & JSON Backup**: All folder trees, tags, and notes are automatically saved to browser storage with 1-click JSON backup export/import.
