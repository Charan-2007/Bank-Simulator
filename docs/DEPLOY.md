# NovaBank Production Deployment Guide

Complete step-by-step instructions with exact copy-paste configuration values for deploying NovaBank to production.

- **Backend Web Service**: [Render](https://render.com) (Free Tier)
- **Frontend SPA & Card Media**: [Cloudflare Pages](https://pages.cloudflare.com) (Free Tier)
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (M0 Free Replica Set)

---

## 1. Deployment Order

> [!IMPORTANT]
> Follow this exact sequence to avoid circular configuration dependencies:
> 1. **Deploy Backend to Render** first and obtain your assigned Render backend URL (e.g. `https://novabank-api.onrender.com`).
> 2. **Run Web Build Script** locally with the Render API URL to generate the static deployment package in `deploy/web`.
> 3. **Deploy Web to Cloudflare Pages** and obtain your Cloudflare Pages URL (e.g. `https://novabank.pages.dev`).
> 4. **Update Render Environment** by adding the Cloudflare Pages URL to `CORS_ORIGINS` and redeploying.
> 5. **Run Production Smoke Tests** to verify end-to-end integration.

---

## 2. Backend Deployment on Render

### Step 2.1 — Create Render Web Service
1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub / GitLab repository containing `NovaBank`.
4. Fill in the exact settings below:

| Field | Setting / Value | Notes |
|---|---|---|
| **Name** | `novabank-api` | (or your preferred name) |
| **Region** | Singapore / Frankfurt / Oregon | Choose closest to your users |
| **Branch** | `main` | Production branch |
| **Root Directory** | *(Leave empty)* | **CRITICAL**: Must remain empty because server imports `../shared` |
| **Runtime** | `Node` | Node.js 18+ / 20+ |
| **Build Command** | `npm --prefix server ci` | Clean dependency install |
| **Start Command** | `npm --prefix server start` | Starts Express on `0.0.0.0:$PORT` |
| **Instance Type** | `Free` | 512 MB RAM, spins down on idle |
| **Health Check Path** | `/api/health` | Fast, non-blocking readiness check |

*(Verify in the Render dashboard after creating)*

---

### Step 2.2 — Generate Production Secrets
Run this command twice in your terminal to generate two unique 64-byte random hex secrets for JWTs:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

### Step 2.3 — Render Environment Variables
Under the **Environment** tab of your Render service, add the following variables:

| Key | Value / Example | Secret? | Description |
|---|---|:---:|---|
| `NODE_ENV` | `production` | No | Enables production safeguards & trust proxy |
| `MONGODB_URI` | `mongodb+srv://<user>:<password>@cluster.mongodb.net/novabank_prod?retryWrites=true&w=majority` | **YES** | Target database name must be `novabank_prod` |
| `JWT_ACCESS_SECRET` | *(64-byte hex string generated above)* | **YES** | Must be >= 64 hex characters |
| `JWT_REFRESH_SECRET` | *(64-byte hex string generated above)* | **YES** | Must be >= 64 hex characters |
| `JWT_ACCESS_EXPIRY` | `15m` | No | Short-lived access token lifetime |
| `JWT_REFRESH_EXPIRY` | `7d` | No | Refresh token session lifetime |
| `CORS_ORIGINS` | `https://novabank.pages.dev,capacitor://localhost,http://localhost,https://localhost` | No | Comma-separated allowed origins (no wildcard) |
| `DEMO_SHOW_OTP` | `true` | No | Displays demo SMS gateway banner in UI |
| `TRANSFER_MIN_AMOUNT_PAISE` | `100` | No | Minimum transfer ₹1.00 |
| `TRANSFER_MAX_AMOUNT_PAISE` | `5000000` | No | Maximum per-transaction transfer ₹50,000 |
| `DAILY_TRANSFER_LIMIT_PAISE` | `10000000` | No | Daily transfer limit ₹1,00,000 |
| `DEPOSIT_MAX_AMOUNT_PAISE` | `5000000` | No | Max demo deposit ₹50,000 |
| `MIN_USER_AGE_YEARS` | `16` | No | Minimum age constraint |
| `STARTING_BALANCE_PAISE` | `1000000` | No | Initial registration credit ₹10,000 |
| `PIN_MAX_FAILED_ATTEMPTS` | `5` | No | Max failed PIN attempts before lockout |
| `PIN_LOCKOUT_MINUTES` | `15` | No | Duration of lockout in minutes |
| `TIMEZONE` | `Asia/Kolkata` | No | Reference timezone for midnight resets |

Click **Save Changes** and deploy the service. Once deployed, note your service URL (e.g. `https://novabank-api.onrender.com`).

---

## 3. Frontend & Card Media Deployment on Cloudflare Pages

### Step 3.1 — Build the Web Package Locally
In your project root, execute `tools/build-web.js` passing your live Render API URL:

```bash
node tools/build-web.js https://novabank-api.onrender.com
```

This automated script:
1. Compiles the Vite SPA with `VITE_API_BASE_URL` baked into client assets.
2. Copies all 29 card media assets (`videos/`, `posters/`, `images/`) to `deploy/web/media/cards/`.
3. Creates Cloudflare Pages `_headers` configuring 1-year immutable caching (`max-age=31536000, immutable`) for `/media/*` and `no-cache` for `/index.html`.
4. Creates Cloudflare Pages `_redirects` (`/* /index.html 200`) enabling SPA client-side routing on refreshes (e.g. `/passbook`).
5. Validates that no file exceeds Cloudflare's 25 MiB limit and file count is below 20,000.

---

### Step 3.2 — Deploy to Cloudflare Pages

#### Option A: Dashboard Direct Upload (Recommended)
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) -> **Workers & Pages**.
2. Click **Create application** -> **Pages** -> **Upload assets**.
3. Name your project (e.g. `novabank`).
4. Drag and drop the generated `deploy/web` folder into the upload dropzone.
5. Click **Deploy site**.
6. Cloudflare Pages assigns your public URL (e.g. `https://novabank.pages.dev`).

*(Verify in the Cloudflare Pages dashboard after deployment)*

#### Option B: CLI Deployment (via Wrangler)
If you prefer deploying via terminal:
```bash
npx wrangler pages deploy deploy/web --project-name=novabank
```

---

## 4. Finalizing CORS & Environment Synchronization

1. Copy your live Cloudflare Pages URL (e.g. `https://novabank.pages.dev`).
2. Go back to your [Render Dashboard](https://dashboard.render.com) -> `novabank-api` -> **Environment**.
3. Update `CORS_ORIGINS` to include your exact Cloudflare Pages URL:
   ```
   CORS_ORIGINS=https://novabank.pages.dev,capacitor://localhost,http://localhost,https://localhost
   ```
4. Click **Save Changes** and allow Render to trigger a zero-downtime redeploy.

---

## 5. Post-Deployment Verification

Run the automated smoke test against your live URLs:
```bash
node tools/smoke-prod.js https://novabank-api.onrender.com https://novabank.pages.dev
```

### Manual Verification Checklist
- [ ] Open `https://novabank.pages.dev` in a private/incognito browser window.
- [ ] Verify the welcome screen loads with the simulation banner.
- [ ] Register a new test account: confirm OTP banner appears and fills code.
- [ ] Set 6-digit PIN and verify card selection screen shows 29 cards.
- [ ] Verify card carousel plays video smoothly in Full glass mode.
- [ ] Test a transfer of ₹500 to another user; verify receipt modal and balance update.
- [ ] Refresh the page while on `/passbook`; verify it renders cleanly without a 404.

---

## 6. Cold Start & Keep-Awake Strategy

### Render Free Tier Cold Starts
On Render's Free tier, services spin down after 15 minutes of inactivity. When a user opens the app after an idle period:
- Initial HTTP response can take 30 to 60 seconds.
- NovaBank's built-in **Wake-Up UX** fires a background `/api/health` request on app launch. If any API request takes longer than 4 seconds, a non-blocking toast displays:
  > *"Waking up the server (free hosting, up to a minute)..."*
- The client extends its request timeout to 90 seconds and automatically retries safe `GET` requests.

### Optional Keep-Awake Cron (Free)
To eliminate cold starts during demonstration hours:
1. Register for free on [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org).
2. Create an **HTTP(s) Monitor** targeting your health endpoint:
   - URL: `https://novabank-api.onrender.com/api/health`
   - Interval: Every `10 minutes` (Render sleeps at 15 minutes).
   - Expected status: `200`.

---

## 7. Troubleshooting Guide

| Issue | Symptom | Root Cause & Resolution |
|---|---|---|
| **CORS Blocked** | Browser console: *"Cross-Origin Request Blocked"* | Ensure the exact Cloudflare Pages URL (including `https://` without trailing slash) is present in Render's `CORS_ORIGINS`. |
| **Cold Start Timeout** | App shows *"Could not reach the server"* after 90s | Render instance is spinning up. Refresh the browser once Render completes startup. Check Render logs to verify if building or starting. |
| **Database Connection Failure** | Health check reports `db: 0` (`disconnected`) | MongoDB Atlas cluster may be paused or IP whitelist is blocking Render. Go to Atlas -> **Network Access** -> Ensure `0.0.0.0/0` is allowed. |
| **500 Internal Error on Login/Register** | Server logs *"JWT_ACCESS_SECRET must be at least 64 hex characters"* | Check Render Environment variables. Ensure `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are 64+ hex characters without quotes. |
| **404 on Page Refresh** | Refreshing `/passbook` returns Cloudflare 404 | The `_redirects` file is missing. Re-run `node tools/build-web.js` and ensure `_redirects` containing `/* /index.html 200` is uploaded to Cloudflare Pages. |

---

## 8. Android APK Deployment Note

The Android APK built via Capacitor bundles the React web application locally inside the native binary. For the APK to communicate with production servers:
1. Ensure `VITE_API_BASE_URL` is set to `https://novabank-api.onrender.com` in `client/.env.production`.
2. Build and sync native assets:
   ```bash
   cd client
   npm run build
   npx cap sync android
   ```
3. Compile debug APK:
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
4. Output APK: `client/android/app/build/outputs/apk/debug/app-debug.apk`.
