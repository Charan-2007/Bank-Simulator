# NovaBank — Decisions Log

Every assumption made during planning, with rationale. If the user disagrees, update this document and adjust the plan.

---

## D-01: Fold `accounts` into `users`

**Decision:** Store `balancePaise` directly on the `User` document instead of a separate `accounts` collection.

**Rationale:** The spec says "May be folded into `users` if simpler." Since each user has exactly one account, a separate collection adds a join to the most common read (Home screen balance) and a third/fourth write to the transfer transaction. A single `User.balancePaise` field keeps the transfer to two conditional updates inside one Mongo transaction.

**Trade-off:** If multi-account support were ever needed, this would need refactoring. Acceptable for a college project.

---

## D-02: Vitest over Jest

**Decision:** Use Vitest as the test runner for both server and client.

**Rationale:** The spec says "Vitest or Jest." Vitest integrates natively with Vite (the frontend bundler), supports ES modules without extra configuration, and has a Jest-compatible API. Using one test runner across the monorepo reduces setup complexity.

---

## D-03: Asset source directory verification

**Decision:** Treat `D:\Bank Simulator\Cards\` as the sole active source asset directory.

**Rationale:** The initial spec assumed an additional directory `D:\Bank Simulation\Cards`, but inspection confirmed that `D:\Bank Simulation` does not exist on disk. All 24 source videos and 5 GOAT's images are located in `D:\Bank Simulator\Cards\`. No files in `Cards/` are ever modified or deleted.

---

## D-04: Card manifest lives in `server/data/`

**Decision:** The generated `cards.manifest.json` is placed in `server/data/cards.manifest.json` and served via `GET /api/cards`. The `tools/build-manifest.js` script writes it there.

**Rationale:** The manifest must be served by Express (section 7). Placing it in a `data/` subdirectory keeps it separate from source code while making it easy for Express to read and serve.

---

## D-05: Processed media served from `server/public/media/cards/`

**Decision:** Transcoded videos across 4 quality tiers, posters, and processed images are output to `server/public/media/cards/videos/{low,mid,high,max}/`, `server/public/media/cards/posters/`, and `server/public/media/cards/images/`. Express serves `server/public/` as static files with long cache headers.

**Rationale:** The spec requires multi-tier video delivery and fast static caching. Serving media over HTTP/static keeps the APK small while allowing `VITE_MEDIA_BASE_URL` to point to a CDN later.

---

## D-06: Card number prefix `9000`

**Decision:** All demo card numbers use the prefix `9000` (e.g., `9000 1234 5678 9012`).

**Rationale:** The spec specifies "a prefix that is not a real card network prefix (for example 9000)." The `9000` prefix is chosen as an explicit demo prefix to clearly distinguish fictional cards from real bank payment cards, without asserting international assignment status.

---

## D-07: Single DEMO_SHOW_OTP flag for demo OTP display

**Decision:** Replace environment-dependent rules (`SIMULATION_MODE` + `NODE_ENV`) with a single environment flag: `DEMO_SHOW_OTP=true`.

**Rationale:** In any environment (development, staging, or production presentation), setting `DEMO_SHOW_OTP=true` instructs the server to return the generated OTP as `devOtp` in the API response and causes the client to display the "Demo OTP" banner with the autofill code. This simplifies evaluator and college project demos while providing a single switch to disable simulated codes for strict security testing.

---

## D-08: Animation library is `motion` (formerly `framer-motion`)

**Decision:** Use the npm package `motion` (the current name for the Framer Motion library).

**Rationale:** The spec says "motion (the Framer Motion package; verify the current package name)." As of 2024, `framer-motion` was renamed to `motion` on npm. The builder must verify the current version with `npm view motion version` before installing.

---

## D-09: Self-hosted fallback fonts via `@fontsource`

**Decision:** Fallback fonts for card categories and app UI are self-hosted via modular `@fontsource/*` packages rather than loaded from external Google Fonts CDNs.

**Rationale:** External CDN dependencies can fail on restricted Wi-Fi, offline college project demonstrations, or air-gapped Android emulators. `@fontsource` packages bundle font assets directly into Vite's local build assets. If a user provides custom TTF/WOFF2 files in `client/public/fonts/`, they take priority via `@font-face` overrides.

---

## D-10: Explicit swipe order between sections

**Decision:** Swipe follows the bottom bar order (`Home`, `Cards`, `Pay`, `Passbook`, `Profile`), moving ONE tab at a time. A swipe can START only on `Home`, `Passbook`, and `Profile`, never on `Cards`, `Pay`, forms, or sheets.
- Swipe left on **Home** transitions to **Cards**.
- On **Passbook**: swipe right transitions to **Pay**, swipe left transitions to **Profile**.
- On **Profile**: swipe right transitions to **Passbook**.
- Axis locking (horizontal ≥ 1.5× vertical) and 24px edge dead zone apply to all gestures.

**Rationale:** Directly aligns swipe transitions with visual bottom bar tab adjacency while safeguarding interactive components: carousel gestures on Cards and camera/inputs on Pay cannot initiate a page swipe, but users on reading screens can step naturally to adjacent sections.

---

## D-11: Single active card per user

**Decision:** Each user has exactly one `selectedCardId`. Changing the card replaces it.

**Rationale:** Section 6 says "A user has exactly one active card."

---

## D-12: Account number format

**Decision:** Account numbers are `NB` + 10 random digits (e.g., `NB3847291056`). Generated at registration, unique index enforced.

**Rationale:** Section 10 specifies format `NB` + 10 digits.

---

## D-13: Transfer limits are configurable via `server/src/config/limits.js`

**Decision:** All limits (min ₹1, max ₹50,000/transfer, ₹1,00,000/day, deposit max ₹50,000, min age 16) are defined in one config file, overridable by env vars.

**Rationale:** The spec says these are all "configurable." Centralising them in one file makes tuning easy.

---

## D-14: Daily transfer limit calculated inside transaction in Asia/Kolkata timezone

**Decision:** The daily transfer limit (₹1,00,000) is enforced by querying the sum of today's successful `transfer_out` transactions directly within the active MongoDB session (`.session(session)`), with "today" computed using `Asia/Kolkata` (UTC+05:30) calendar boundaries.

**Rationale:** Computing limits inside the Mongo session prevents race conditions from concurrent transfers that could exceed daily caps. Defining "today" in Indian Standard Time (`Asia/Kolkata`) aligns daily caps with Indian banking calendar days rather than UTC midnight.

---

## D-15: No separate PIN-confirm endpoint for transfers

**Decision:** The transfer endpoint (`POST /api/transfers`) accepts the PIN directly. It is verified inline as part of the transfer flow.

**Rationale:** Adding a separate PIN verification step would require session state or a temporary token. Inline verification is simpler and still secure (PIN is hashed, rate-limited, and never logged).

---

## D-16: Refresh tokens as SHA-256 hashes, multi-session, body-based

**Decision:** Refresh tokens are generated as high-entropy random opaque tokens (40-byte hex strings), hashed with SHA-256 (never bcrypt), and stored as `{ tokenHash, createdAt, expiresAt }` entries in a `refreshTokens` array on the `User` document. Delivered strictly in request/response bodies (no cookies).

**Rationale:** 
1. Bcrypt is intentionally slow and vulnerable to DoS when verifying multiple tokens per second; SHA-256 is fast, constant-time, and cryptographically secure for high-entropy secrets.
2. A user array permits multi-device / multi-session logins simultaneously.
3. Body-based token passing avoids cross-origin cookie restrictions between Capacitor apps (`capacitor://localhost` or `http://localhost`) and Express backend servers. Explicit logout removes the matching token hash from the array.

---

## D-17: Page sections stay mounted

**Decision:** All five main sections (Home, Cards, Pay, Passbook, Profile) remain mounted when switching tabs. Only their visibility/animation state changes.

**Rationale:** Section 5 says "Keep each section mounted so scroll position and form state survive switching." Implementation: render all sections, animate the active one in, hide others with `visibility: hidden` and `aria-hidden`.

---

## D-18: QR code data format & authoritative recipient lookup

**Decision:** The QR code encodes `{ "type": "novabank", "accountNumber": "NB...", "name": "User Name" }`. However, when scanned, the client **must** make an authoritative server lookup (`GET /api/accounts/lookup?account=NB...`) and display the name returned by the server, discarding whatever name is encoded in the QR payload.

**Rationale:** QR payloads can be tampered with or contain stale display names. Relying strictly on the server's lookup ensures the sender verifies the genuine, active account holder before authorizing any transfer.

---

## D-19: Web QR scanner library selection

**Decision:** Use `@zxing/browser` alongside `@zxing/library` as the browser QR scanning solution on desktop/web, and `@capacitor-mlkit/barcode-scanning` on Android. Remove `qr-scanner` as a fallback.

**Rationale:** Modern barcode scanning on the web is most reliably handled by `@zxing/browser` (which relies on `@zxing/library` core), featuring active maintenance, native TypeScript/ESM support, and robust camera stream handling. Older libraries like `qr-scanner` (last published November 2022) and `html5-qrcode` (last published April 2023) are unneeded.

---

## D-20: Haptics skipped on web

**Decision:** Haptic feedback (tab switches) is implemented only via Capacitor Haptics on Android. On web, the call is a no-op.

**Rationale:** Section 5 says "Capacitor Haptics on Android; skipped on web." The builder should wrap haptic calls in a utility that checks for the Capacitor platform.

---

## D-21: Posters extracted at ~30% of video duration (1080px WebP)

**Decision:** Extract poster frames at approximately 30% of each video's duration (computed via `ffprobe` as `duration * 0.3`, or 2.4s of 8s loop) as 1080px wide WebP images (1080x680, quality 85) into `server/public/media/cards/posters/<id>.webp`.

**Rationale:** Video animations often start with a blank screen, title card, or fade-in during the first second. Sampling at 30% captures dynamic subject action. Using 1080px wide WebP at quality 85 matches the high-tier card resolution and provides crisp visual fidelity for posters and static fallbacks.

---

## D-22: `VITE_MEDIA_BASE_URL` and `VITE_API_BASE_URL` configuration

**Decision:** Support configurable base URLs (`VITE_API_BASE_URL` and `VITE_MEDIA_BASE_URL`). Defaults:
- Web development: empty string (same origin, proxied by Vite).
- Android / Mobile dev: LAN IP (e.g. `http://192.168.1.50:3000`).
The card API automatically prefixes relative media paths with `VITE_MEDIA_BASE_URL`.

**Rationale:** Capacitor runs in a local web view (`http://localhost` or `capacitor://localhost`), requiring absolute URLs pointing to the development machine's network IP for API requests and static video streaming.

---

## D-23: Access token duration

**Decision:** Access token: 15 minutes. Refresh token: 7 days.

**Rationale:** The spec says "short-lived" access token. 15 minutes is standard for SPAs. 7-day refresh token is convenient for a demo app without being excessively long.

---

## D-24: Spring animation constants

**Decision:** Bubble spring defaults: stiffness 380, damping 28, mass 0.9 (as specified). Page transition: ~300-350ms spring with scale 0.98→1 and slight fade.

**Rationale:** Directly from section 5. These are starting points; the builder may tune ±10% based on feel.

---

## D-25: Narrowed No-Chip Rule for Card Face & UI Filter Naming

**Decision:** 
1. The ban on chip icons and elements applies strictly to the **card face**: `CardFace.jsx`, card CSS, and card assets must contain no chip element, SVG, or icon.
2. In T-6.2, an automated code search checks `CardFace.jsx`, card CSS, and card assets to verify zero occurrences of "chip" elements, classes, or icons.
3. To eliminate naming confusion across the codebase and documentation, all UI selection/toggle buttons on the catalog, home, and passbook screens are explicitly named **filters** (category filters, passbook filters), reserving the term "chip" solely for the banned physical card element.
4. Existing card images are verified in T-0.5. If any image displays a chip, that card is excluded from the manifest and documented in `docs/chip-audit-report.md`. No image is deleted or modified, and no `chipAudit` manifest field is used.

**Rationale:** Naming filter buttons "filters" ensures that searching the codebase for banned card chips produces zero false positives, while keeping card faces clean and modern.

---

## D-26: Processed media storage & git policy

**Decision:** Processed media files in `server/public/media/cards/` are excluded from version control via relative `.gitignore` rules (`/Cards/` anchored to repo root). They are **not committed to Git** and **not stored in Git LFS**. Regeneration via `tools/transcode-videos.js` and `tools/extract-posters.js` requires the source `/Cards/` folder to be present. The `README.md` must state that the processed media folder needs a separate backup archive for deployment or environments where raw source cards are not available.

**Rationale:** Processed video and poster assets can total dozens of megabytes. Keeping them in `.gitignore` prevents repository bloat while deterministic scripts enable local builds when source assets are available. Documenting the separate media backup archive ensures reproducible deployments without shipping gigabytes of raw video files in Git.

---

## D-27: User registration status, restartability & PIN lockout

**Decision:**
1. A registering user is created with `status: 'pending'`. Only after successful OTP verification and 6-digit PIN creation does the status transition to `'active'`.
2. A pending registration can be restarted if abandoned; subsequent registration attempts with the same phone overwrite/update the pending user.
3. User lookups (`GET /api/accounts/lookup`) return only `active` users.
4. Security: 5 consecutive failed PIN attempts trigger a 15-minute account lockout (`pinLockedUntil`), rejecting attempts with HTTP 423 Locked.

**Rationale:** Prevents orphan unfinished registrations from blocking phone numbers and protects demo accounts from automated PIN brute-force attacks.

---

## D-28: Body portal rendering & camera lifecycle

**Decision:**
1. All bottom sheets, modals, and the QR scanner viewfinder render through a React portal directly to `document.body` (`ReactDOM.createPortal`).
2. The camera video stream starts strictly when the Scan screen or QR scanner component becomes active, and all camera tracks are immediately stopped (`track.stop()`) on unmount or tab switch.

**Rationale:** Portaling modals to `<body>` avoids CSS `transform` clipping and `backdrop-filter` backdrop root bugs inside the animated page shell. Managing camera track lifecycles prevents battery drain and ensures privacy indicators do not persist when navigating away from the scanner.

---

## D-29: Four-Tier Video Pipeline & Card Animation User Setting

**Decision:**
1. Every card video is transcoded into 4 quality tiers (`low`, `mid`, `high`, `max`), stored in `server/public/media/cards/videos/{low,mid,high,max}/<id>.mp4`:
   - `low`: 480x302, 24 fps, crf 27, preset slow, max file size 1.5 MB
   - `mid`: 720x454, 30 fps, crf 23, preset slow, max file size 4 MB
   - `high`: 1080x680, 30 fps, crf 21, preset medium, max file size 8 MB
   - `max`: 1440x908, 30 fps, crf 19, preset medium, max file size 14 MB (`-maxrate 12M -bufsize 24M`)
2. If any output exceeds its size cap, CRF is incremented by 2 iteratively until within budget.
3. Horizontal crop focus `FX` (0 to 1, default 0.5) is read per-video from `tools/crop-focus.json`.
4. In `cards.manifest.json`, the single `video` string is replaced with a dictionary:
   `"videos": { "low": "...", "mid": "...", "high": "...", "max": "..." }`.
5. The user setting `Profile → Card animation` (Off / Low / Mid / High / Max; default Mid) controls video playback. Off shows poster only. Defaults to Off when system reduced motion is active. Replaces the legacy binary autoplay toggle.
6. If the selected tier file fails to load, client falls back to the next lower tier, and ultimately to the poster.

**Rationale:** Replaces low-quality single-tier 720x454 CRF 28 output with user-customizable quality scaling. Users on low-end devices or metered connections can choose `Low`, while high-end devices enjoy crisp `Max` resolution.

---

## D-30: Card Number Theme Font Default & Documented Overrides

**Decision:**
1. By default, the card number (`9000 •••• •••• 9012` and revealed `9000 1234 5678 9012`) inherits and uses the card's theme font (`fontFamily` from `cards.manifest.json`), maintaining `font-variant-numeric: tabular-nums` and letter spacing.
2. In `cards.manifest.json`, `"numberFont": "DM Sans, sans-serif"` is removed from the 26 cards across Abstract (`Orbitron`), Cars (`Anton`), Anime (`Bangers`), Superheroes (`Cinzel`), and Sports Legends (`Bebas Neue`), so they render digits using their own themed fonts.
3. For the 3 Gaming cards (`gaming-minecraft-cherry-blossom`, `gaming-gta-6`, `gaming-minecraft-train-forest`), the theme font `"Press Start 2P"` is an 8-bit retro pixel font with 1:1 square glyph metrics. On a 390px mobile viewport (~342px card face), 19 characters with spaces span over 300px, causing line-wrapping, overflow collisions with card titles, and blurred pixel clusters for digits `0`, `8`, `6`, and `9`. Therefore, an explicit documented override `"numberFont": "Orbitron, sans-serif"` is applied to these 3 gaming cards, preserving a futuristic gaming feel with clean, legible digits.
4. A 29-card contact sheet at 390px viewport width is verified and saved to `docs/screenshots/card-numbers-contact-sheet-390px.png`.

**Rationale:** Enhances the personalized theme aesthetic of virtual cards while safeguarding legibility and avoiding horizontal overflow on mobile viewports.

---

## D-31: Single Navigation Breakpoint (1024px) via Conditional Rendering

**Decision:**
1. Navigation is rendered mutually exclusively using React conditional rendering via `useMediaQuery('(min-width: 1024px)')`.
2. Below 1024px, strictly `<BottomBar />` is mounted; `<SideRail />` does not exist in the DOM. `#page-container` has bottom padding `pb-28` and 0 left padding.
3. From 1024px, strictly `<SideRail />` is mounted; `<BottomBar />` does not exist in the DOM. `#page-container` has left padding `pl-28 pb-6` and no bottom padding `pb-28`.
4. This guarantees that `document.querySelectorAll('nav').length === 1` at all viewport widths (tested at 390, 768, 1023, 1024, 1280, 1440 px).

**Rationale:** Prevents duplicate DOM navigation bars and CSS padding conflicts between mobile and desktop layouts.

---

## D-32: OTP Flow Auto-Request, Invalidation & 30s Cooldown

**Decision:**
1. Registration (`POST /api/auth/register`) automatically requests an OTP and includes `devOtp` in the response when `DEMO_SHOW_OTP=true`.
2. On navigating to `/otp-verify`, the Demo OTP banner appears immediately with the code. A `useRef` guard prevents double requests in React StrictMode.
3. Clicking "Resend code" invalidates the previous OTP on the server, creates a new code, updates the banner, and activates a 30s cooldown with visible countdown `Resend Code (${cooldown}s)`.
4. Submitting an old or invalid code increments attempts and returns `Invalid OTP code. ${remaining} attempt(s) remaining.`, locking out after 5 attempts.

**Rationale:** Eliminates friction in the onboarding flow while strictly enforcing OTP invalidation, cooldown rate limits, and attempt tracking.
