# NovaBank Build Progress

## Phase 1 — Server Foundation
- **Tasks Completed**: T-1.1, T-1.2, T-1.3, T-1.4, T-1.5, T-1.6, T-1.7, T-1.8
- **Tests**: 2 passed (health, cards)
- **Status**: Complete & Verified with Atlas Replica Set
- **Unresolved**: None

## Phase 2 — Auth
- **Tasks Completed**: T-2.1, T-2.2, T-2.3, T-2.4, T-2.5, T-2.6
- **Tests**: 14 passed across 3 test files (health, cards, 12 auth tests including 15-min PIN lockout, SHA-256 tokens, pending restart, underage check, change-PIN, and token revocation)
- **Status**: Complete
- **Unresolved**: None

## Phase 3 — Banking Core
- **Tasks Completed**: T-3.1, T-3.2, T-3.3, T-3.4, T-3.5, T-3.6, T-3.7, T-3.8 + Extra Demo Flow (tools/demo-flow.js)
- **Tests**: 25 passed across 6 test files (health, cards, auth, transfer, concurrency, transaction)
- **Status**: Complete & Verified with Atlas Replica Set & Live E2E Flow
- **Unresolved**: None

## Phase 4 — Client Shell & Glass Navigation
- **Tasks Completed**: T-4.1 to T-4.13 + Precision Alignment & Blur Verification
- **Fixes Applied**:
  - Dynamically measured `getBoundingClientRect()` relative to inner padding box (compensating for 1px container border); bubble dimensions set to `tabWidth - 8px` and `innerBarHeight - 8px` (4px margins on all sides); connected to `ResizeObserver`.
  - All 5 tab slots enforced strictly equal width (`flex: 1 1 0%, min-width: 0`). Same rules applied to SideRail.
  - Bubble drag release snaps directly to closest measured tab center.
  - Added `?debug=1` live alignment overlay verifying |Diff| ≤ 1.0 px across widths 360, 390, 412 in Full, Lite, and Off modes (all 45 tests pass with diffs ≤ 0.25 px).
  - High-contrast split card seam placed directly behind bar; 2x zoom crop proves optical blur in Full mode vs solid surface in Off mode (`backdrop-filter: blur(18px) saturate(1.9)` on `.nav`).
  - Strict real-time frame telemetry: no placeholder numbers; measured real 180-frame rAF loop in Auto mode: 16.67 ms avg, 17.2 ms worst, 60 FPS.
- **Client Build**: `vite build` completed in 3.38s with zero errors.
- **Status**: Complete & Verified — Waiting at Phase 4 Gate
- **Unresolved**: None


## Phase 5 — Screens & Flows
- **Tasks Completed**: T-5.1, T-5.2, T-5.3, T-5.4, T-5.5, T-5.6, T-5.7, T-5.8, T-5.9, T-5.10
- **Components Built**:
  - API Client with single in-flight token refresh mutex (`client.js`, `auth.js`, `accounts.js`, `transfers.js`, `transactions.js`, `cards.js`).
  - AuthContext & hook with in-memory access token and session refresh storage.
  - Common primitives: `Button`, `PinInput` (6-digit auto-advance), `OtpInput` (with Demo OTP banner & auto-fill), `AmountInput` (integer paise + live Indian INR preview + quick chips), `BottomSheet` (portal to `<body>`), `Modal` (portal to `<body>`), `LoadingSpinner`, `SimulationNotice`.
  - Screens: `Welcome`, `Register` (age >= 16 check, pending restart), `OtpVerify`, `SetPin`, `ChooseCard`, `AccountCreated`, `Login` (HTTP 423 lockout countdown).
  - Main Sections: `Home` (deposit/withdraw sheets, balance refetch, recent txns), `Pay` (`SegmentedControl`, `Send` with authoritative server lookup & idempotency, `Receive` with QR, `Scan` with camera lifecycle & portal), `Passbook` (filters: all/in/out, detail sheet), `Profile` (theme, glass, animation tier, haptics, change-PIN, logout).
- **Tests**: Vitest money unit tests passing (7/7). Client Vite build passing (0 errors).
- **Status**: Complete

## Phase 6 — Cards System
- **Tasks Completed**: T-6.1, T-6.2, T-6.3, T-6.4, T-6.5, T-6.6, T-6.7, T-6.8
- **Components Built**:
  - `loadCardFont.js`: Self-hosted `@fontsource/*` font integration for all categories (Orbitron, Anton, Press Start 2P, Bangers, Cinzel, Bebas Neue, DM Sans). Zero external Google Fonts CDN calls.
  - `CardFace.jsx`: 1.586:1 aspect ratio, edge-to-edge cover, strictly zero chip element/SVG/class, tap to reveal masked number (`9000 •••• •••• 1234`), 4 quality tiers (`low`, `mid`, `high`, `max`), fallback to poster on reduced motion or error, IntersectionObserver and Page Visibility playback controls.
  - `CardCarousel.jsx`: Hero carousel with swipe and "Set as Active" action.
  - `CardCatalog.jsx`: Filterable grid showing populated cards only, with category filter pills for populated categories.
  - `CardPreview.jsx`: Portal modal for card inspection.
  - Generated `docs/missing-fonts-report.md`.
- **Status**: Complete

## Phase 7 — Android (Capacitor)
- **Tasks Completed**: T-7.1, T-7.2, T-7.3, T-7.4, T-7.5, T-7.6
- **Native Android Configuration**:
  - Capacitor 8 installed (`@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor/app`, `@capacitor/haptics`, `@capacitor/status-bar`).
  - Native platform added in `client/android/` with `com.novabank.sim`.
  - Configured `AndroidManifest.xml` (`usesCleartextTraffic="true"`, `network_security_config.xml` for LAN IPs, camera permission `<uses-permission android:name="android.permission.CAMERA" />`).
  - Haptics utility (`client/src/utils/haptics.js`) wired to BottomBar tab changes.
  - Android hardware back button handler registered in `App.jsx` (navigates child tabs to Home, exits on Home).
  - Created `docs/ANDROID_BUILD.md` and `docs/android-test-results.md`.
  - `npx cap sync android` synchronized web assets and native plugins in 0.186s.
- **Status**: Complete

## Phase 8 — Polish & Delivery
- **Tasks Completed**: T-8.1, T-8.2, T-8.3, T-8.4, T-8.5, T-8.6
- **Deliverables**:
  - Accessibility audit & ARIA markup (`role="tablist"`, `role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-hidden`, visible focus rings, high contrast text).
  - Reduced motion integration across `motion` spring configs, page transitions, and card video autoplay.
  - Empty and error states with retry across all data views.
  - Comprehensive live Atlas E2E verification (`tools/verify-e2e-flow.js`) passing all 9 stages (Register, OTP, Set PIN, Choose Card, Deposit ₹5,000.50, Transfer ₹750.25, Idempotent retry, Wrong PIN 401, Overdraw 400, Cleanup).
  - Screenshots captured at 390px (mobile) and 1280px (desktop) in `docs/screenshots/`.
  - Overwritten `README.md` with complete setup guide in ≤10 steps, Atlas replica set guide, endpoints table, and architecture.
  - Cleaned up environment files (`.env.example` verified, `.gitignore` anchored).
- **Test Summary**:
  - Server tests: 25 / 25 passed across 6 test files.
  - Client tests: 7 / 7 passed.
  - Live Atlas E2E suite: 9 / 9 stages passed.
- **Status**: All Phases Complete & Verified

## Post-Phase 8 Refinements & Quality Fixes

### 1. OTP Flow Fixes (Issue 1)
- **Immediate Demo OTP Banner**: Registration API (`POST /api/auth/register`) automatically issues an OTP and returns `devOtp` (when `DEMO_SHOW_OTP=true`). `OtpVerify.jsx` renders the Demo OTP banner immediately upon landing without needing to press Resend. Guarded by `autoRequestedRef` against double-fetch in React StrictMode.
- **Resend Invalidation & 30s Cooldown**: When Resend is pressed, the previous OTP is invalidated immediately on the server (`Otp.deleteMany({ phone })`). The Resend button displays a live 30-second countdown (`Resend Code (${cooldown}s)`) and is disabled.
- **Attempt Tracking**: Submitting an old or invalid code increments attempts and returns `Invalid OTP code. ${remaining} attempt(s) remaining.`, locking out after 5 attempts. Entering the valid new code succeeds and advances to `/set-pin`.

### 2. Single Navigation Element Enforcement (Issue 2)
- **Exclusive DOM Breakpoint at 1024px**: `AppShell.jsx` conditionally renders `{isDesktop ? <SideRail /> : <BottomBar />}` via `useMediaQuery('(min-width: 1024px)')`.
- Neither navigation element exists in the DOM when inactive.
- **Content Padding**: `#page-container` has `pb-28` below 1024px and `pl-28 pb-6` from 1024px.
- **DOM Count Verified**: Tested across 6 viewport widths (390, 768, 1023, 1024, 1280, 1440 px) in `tools/e2e-ui.js`; `document.querySelectorAll('nav').length === 1` at every width.

### 3. Card Number Theme Fonts & Readability Overrides (Issue 3)
- **Theme Font Inheritance**: Card numbers (`9000 •••• •••• 9012` and revealed `9000 1234 5678 9012`) inherit the card's theme font (`fontFamily` from `cards.manifest.json`), maintaining `font-variant-numeric: tabular-nums` and letter spacing.
- **Readability Overrides**: The 8-bit retro pixel font `"Press Start 2P"` on Gaming cards has wide square glyphs (~304px for 19 characters), causing mobile line-wrapping, card title collisions, and unreadable pixel clusters for digits `0, 8, 6, 9` on a 390px viewport. Documented override `"numberFont": "Orbitron, sans-serif"` is configured in `server/data/cards.manifest.json` for the 3 gaming cards, while the remaining 26 cards inherit their theme fonts (`Orbitron`, `Anton`, `Bangers`, `Cinzel`, `Bebas Neue`).
- **Contact Sheet**: All 29 cards verified at 390px viewport in `docs/screenshots/card-numbers-contact-sheet-390px.png`.
- **Specs & Decisions Updated**: `docs/SPEC.md`, `docs/PLAN.md`, and `docs/DECISIONS.md` (D-30, D-31, D-32).

---

## Final Verification & Bug Fix Task Completion (Phases 1-20 Specification)

### 1. Dribbble Animation Reference Note (Part 8)
The Dribbble reference could not be opened; the OTP animation was designed from the written description only.

### 2. Bugs Fixed & Component Enhancements
- **Intermittent Set-PIN Bug**: Root cause: `client/src/pages/SetPin.jsx` lines 14–15 held `userId` and `tempToken` only in React Router's ephemeral navigation `location.state`, causing page refreshes, direct navigation, or mobile memory reloads to lose credentials and fail with 401.
- **Self-Transfer Bug**: Root cause: `client/src/pages/Send.jsx` lines 64–66 & 100–104 and `server/src/services/transfer.service.js` line 96 previously lacked strict identity validation and relied on un-normalized prefix comparisons that collided between users with similar numbers.
- **Phone Number Canonicalization & Rate Limiter Equality**: Implemented `shared/phoneUtils.js` enforcing E.164 (`+91XXXXXXXXXX`) canonical storage with spaces allowed in input. The test phone range no longer bypasses any limiter; all tests exercise the exact same rate-limiting code paths as production users.
- **Date of Birth Validation**: Implemented `shared/dateUtils.js` with Gregorian leap-year validation and minimum age 16 enforcement computed in Asia/Kolkata timezone. Three numeric fields with automatic advance and scroll-snap wheel modal on mobile.
- **PinInput Eye Toggle**: Integrated a 44px hit-target eye toggle, auto-hiding after 10 seconds or on container blur. Keyboard Enter key submits the active form.
- **Reveal Animation**: Created staggered entrance component (`Reveal.jsx`) applying 24px slide-up, blur 10px -> 0px, and 450ms duration with 60ms stagger.

### 3. Test Verification Results
- **Unit & Integration Suite (`npm test`)**:
  - 9 test files, 49/49 tests passing in Vitest (`tests/auth.test.js`, `tests/transfer.test.js`, `tests/transaction.test.js`, `tests/concurrency.test.js`, `tests/boundary.test.js`, `tests/cards.test.js`, `tests/health.test.js`, `tests/shared-utils.test.js`, `tests/regression.test.js`).
  - Rate limiters verified active across all test cases with no phone number range exemptions.
- **High-Volume Stress Testing (`npm run stress`)**:
  - 10 users, 1,000 operations, 300 concurrent transfers.
  - Invariants A through G 100% verified (Total system balance conserved, zero negative balances, strictly balanced sender/receiver pairs, idempotency verified, zero race conditions).
- **Real-Browser E2E Verification (`node tools/e2e-ui.js`)**:
  - **Suite 1 (Screenshots)**: All 4 required 390px mobile viewport screenshots captured in `docs/test-artifacts/`:
    - `01-register-dob-phone.png` (Registration with DOB 3-input and PhoneInput)
    - `02-set-pin-revealed.png` (Set-PIN screen with eye toggle unmasked)
    - `03-otp-success.png` (OtpVerifyAnimation success checkmark)
    - `04-otp-failure.png` (OtpVerifyAnimation error shake and attempts remaining)
  - **Suite 2 (Set-PIN Intermittent Bug Reproduction & Fix)**:
    - 20 sequential users (+917000000000 to +917000000019) registered, verified OTP, and set PIN.
    - Result: **20/20 users succeeded (100% pass rate)**.
  - **Suite 3 (Multi-User E2E Transfers & Auth Lifecycle)**:
    - 6 users provisioned (+917000000100 to +917000000105).
    - Transfer 1 via Phone (User 0 -> User 1, ₹500): UI lookup, PIN authorization, transaction execution, and receipt display succeeded.
    - Transfer 2 via Account Number (User 0 -> User 2, ₹300): UI lookup, PIN authorization, transaction execution, and receipt display succeeded.
    - Sign Out of Account verified: auth tokens completely cleared from `localStorage` and `sessionStorage`.
    - Automated post-test cleanup purged all 27 reserved test users.

---

## Phase 2 & 3 Bug Fixes & Rate Limiting Verification (Atlas IP Whitelist & Real Phone Bugs)

### 1. Root Cause Analysis & Diagnoses
- **Bug 1a (OTP Screen Verification Failed / Two Codes Issued)**:
  - In `auth.controller.js` line 10, registration issued Code 1 and returned `devOtp`.
  - In `OtpVerify.jsx`, an eager mount effect was invoking `requestOtp(phone)` whenever `!devOtp` or on re-render/refresh without state, causing `Otp.deleteMany({ phone })` to invalidate Code 1 and issue Code 2. Code 1 entered by the user or filled from banner failed verification (`400 Invalid OTP code`).
  - Fixed by retaining `devOtp`, `userId`, and `phone` across sessions (`sessionStorage`), suppressing auto-request when an OTP already exists from registration, and guarding against StrictMode duplicate requests with a stable ref.
- **Bug 1b (Register Screen Validation & Status Mappings)**:
  - Input with double spaces (`charan  gffff`) and DD/MM/YYYY date (`05/04/1940`) previously failed server validation because DOB was strictly `split('-')` and whitespace was uncollapsed.
  - Fixed in `server/src/schemas/auth.schemas.js` by parsing both `YYYY-MM-DD` and `DD/MM/YYYY` / `DD-MM-YYYY` with Gregorian bounds (min age 16, max age 100) and transforming names with `\s+ -> ' '`.
  - Client error mapping implemented via `formatApiError()` in `client/src/utils/errorUtils.js`: mapped 409 to `"This number is already registered. Log in instead."` (or `"Registration already in progress. Resume registration."`), 429 to `"Too many attempts. Try again in N seconds."` with live countdown via `Retry-After`, 423 to lockout message, 400 to field details, and connection drops to `"Could not reach the server"`.
- **Bug 1c (Set-PIN & Self-Transfers)**:
  - Set-PIN context lost on mobile page refresh is resolved via `sessionStorage` fallback for `userId` and `tempToken`.
  - Self-transfers are strictly compared using exact normalized strings across both client (`Send.jsx`) and server (`transfer.service.js`) without prefix collisions.

### 2. Rate Limiting Overhaul
- Removed all reserved test phone exemptions (`+9170000...`). All requests now exercise the exact same code paths.
- Keyed OTP, PIN, and login limits strictly by normalized phone number (`keyGenerator`), preserving a generous IP limiter (300 requests / 15 minutes) for shared Wi-Fi networks.
- Injected `resetRateLimiters()` store-clearing function across all limiter instances for deterministic unit/integration testing without bypassing middleware.
- Standard `Retry-After` headers and 429 countdown handling active across client pages.

### 3. Test Results
- **Vitest Server Test Suite (`npm --prefix server test`)**:
  - **9 / 9 test files passed (100%)**.
  - **49 / 49 tests passed (100%)** in 70.46s.
  - Includes `tests/regression.test.js` (7 tests) covering non-reserved OTP execution with limiters active, 10 OTP requests from 1 IP across different phones (allowed), 6 wrong OTP guesses for 1 phone (blocked with 429), duplicate registration (409 text), double-space name normalization, prefix-sharing peer transfers (phone, account, QR), and self-transfer rejection.
- **Atlas Direct Ping**:
  - Connection to Atlas cluster was attempted using `node tools/test-atlas-ping.js` with a 30s timeout.
  - Returned error: `Could not connect to any servers in your MongoDB Atlas cluster. One common reason is that you're trying to access the database from an IP that isn't whitelisted. Make sure your current IP address is on your Atlas cluster's IP whitelist: https://www.mongodb.com/docs/atlas/security-whitelist/`

---

## Production Deployment Readiness (Render + Cloudflare Pages + MongoDB Atlas)

### 1. Server Production Hardening
- **Host Binding & Proxy Trust**: Server binds to `0.0.0.0:$PORT` (defaulting to `process.env.PORT || 3000`). Configured `app.set("trust proxy", 1)` in production so rate limiters inspect true client IPs behind Render's reverse proxy.
- **Strict Production CORS**: `CORS_ORIGINS` enforced via exact match allow-list (including Capacitor native origins `capacitor://localhost`, `http://localhost`, `https://localhost`). Wildcards (`*`) strictly disallowed in production.
- **Fail-Fast Startup Configuration**: Server immediately aborts startup with descriptive error messages if `MONGODB_URI`, `CORS_ORIGINS`, or JWT secrets (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` >= 64 hex characters) are missing or invalid in production. Zero default secrets in production.
- **Resilient Cold Starts**: `connectDB()` implements automatic background retries without crashing the server process. `GET /api/health` performs an instantaneous status check on `mongoose.connection.readyState` without waiting on database roundtrips.
- **Stateless Media Independence**: Server runs normally when `server/public/media` is absent, as all card videos, posters, and images are hosted directly on Cloudflare Pages.

### 2. Clean-Clone & Monorepo Check
- **Root Render Scripts**: Root `package.json` provides `"server:ci": "npm --prefix server ci"` and `"server:start": "npm --prefix server start"`. Verified in a clean git clone in a temporary directory (`tools/test-clean-clone.js`):
  - `npm --prefix server ci` executed cleanly from root.
  - All 49 server vitest tests passed.
  - Detached server spawned on port 3100; `/api/health` and `/api/cards` (29 cards) verified.
- **Git Repository & Secret Scan**:
  - Initialized git repository on branch `main`.
  - `.gitignore` anchored to exclude `server/.env`, `node_modules`, `client/dist`, `deploy/`, `/Cards/`, `server/public/media/`, `client/android/build`, and logs.
  - Automated scanner (`tools/secret-scan.js`) confirmed 0 plaintext secrets, 0 unredacted MongoDB passwords, and 0 files over 5 MB.
  - Git repository size: `count: 352, size: 26.59 MiB`.

### 3. Cloudflare Pages Web Build & Wake-Up UX
- **Automated Web Builder (`tools/build-web.js`)**:
  - Compiles client bundle with target `VITE_API_BASE_URL` and `VITE_MEDIA_BASE_URL`.
  - Copies Vite assets and all 29 card media files to `deploy/web/media/cards/`.
  - Generates Cloudflare Pages `_headers` (immutable 1-year cache for `/media/*`, `no-cache` for `/index.html`) and `_redirects` (`/* /index.html 200` SPA fallback).
  - Validated Cloudflare Pages limits: **216 files (limit: 20,000)**, **109.43 MB total (limit: 25 MiB/file)**.
- **Wake-Up UX Banner**:
  - App sends a background `GET /api/health` on load (`initBackgroundHealthCheck`).
  - If any API request takes > 4 seconds, displays a non-blocking toast: *"Waking up the server (free hosting, up to a minute)..."* and extends the request timeout to 90 seconds.
  - Safe auto-retry policy: auto-retries only `GET` requests and health checks. Never auto-retries money mutations (`/api/transfers`, `/api/deposits`, `/api/withdrawals`).
- **Production Smoke Test Suite (`tools/smoke-prod.js` & `tools/test-smoke-pair.js`)**:
  - 6/6 checks passed against local test pair on ports 3100 and 5273:
    1. `GET /api/health` -> ok
    2. `GET /api/cards` -> 29 cards in manifest
    3. CORS preflight allowed from web origin (5273)
    4. CORS preflight blocked from unauthorized origin
    5. Poster image served with correct content-type & cache headers
    6. Mid-tier video served with correct content-type & cache headers
- **Deployment Documentation**: Complete copy-paste values, Render configuration, Cloudflare Pages upload steps, and troubleshooting guide documented in `docs/DEPLOY.md`.
