# substarr

A minimalist, Linear-inspired custom dashboard and UI wrapper for YouTube subscriptions. Features hierarchical nested folders, multi-tagging, drag-and-drop reorganization, distraction-free playback, 5 interchangeable layout styles, and Google OAuth / 1-click Takeout CSV sync.

---

## Deploying to Cloudflare Pages

This repository is pre-configured for direct, zero-configuration deployment to **Cloudflare Pages**.

### Method 1: Connect Directly via Cloudflare Dashboard (Recommended)

1. Log in to your [Cloudflare Dashboard](https://dash.cloudflare.com/) and navigate to **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**.
2. Select this GitHub repository (`substarr`).
3. Set the build settings:
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave blank)
4. Click **Save and Deploy**. Cloudflare will build the site and provide a permanent production URL (e.g., `https://substarr.pages.dev`).

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
