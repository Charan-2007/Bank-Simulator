# NovaBank — Phased Task List

Every task names the exact files to create or change and has an acceptance check.
The builder works through one phase at a time, top to bottom.

---

## Phase 0 — Asset Audit & Media Pipeline 🚧 GATE

> **Read `docs/SPEC.md` first** before starting this phase.

### T-0.1: Verify ffmpeg is installed
- **Action:** Run `ffmpeg -version` in the terminal.
- **If missing:** Print instructions for the user to install ffmpeg (via winget, choco, or manual download) and stop.
- **Accept:** `ffmpeg -version` prints a version number.

### T-0.2: Create `tools/transcode-videos.js` (Four Quality Tiers)
- **Create:** `tools/transcode-videos.js`
- **Reads from:** `Cards/` (source video folders: Abstract, Cars, Game, Naruto, Others, Spider Man)
- **Writes to:** `server/public/media/cards/videos/{low,mid,high,max}/` (one file per video tier, kebab-case id: `<cardId>.mp4`)
- **Four Quality Tiers:**
  - `low`: 480x302, 24 fps, crf 27, preset slow, max file size 1.5 MB
  - `mid`: 720x454, 30 fps, crf 23, preset slow, max file size 4 MB
  - `high`: 1080x680, 30 fps, crf 21, preset medium, max file size 8 MB
  - `max`: 1440x908, 30 fps, crf 19, preset medium, max file size 14 MB (`-maxrate 12M -bufsize 24M`)
- **ffmpeg command pattern:**
  `ffmpeg -y -t 8 -i IN -an -vf "scale=W:H:force_original_aspect_ratio=increase,crop=W:H:(iw-W)*FX:(ih-H)*0.5,fps=FPS" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf CRF -preset PRESET -movflags +faststart OUT.mp4`
- Read horizontal crop focus `FX` per video from `tools/crop-focus.json` (0 to 1, default 0.5).
- If an output file exceeds its budget cap, raise CRF in steps of 2 and re-encode until it fits.
- Resumable: skip any output that already exists and passes ffprobe check.
- **Accept:** Running `node tools/transcode-videos.js` produces 96 `.mp4` files (24 videos × 4 tiers) in `server/public/media/cards/videos/{low,mid,high,max}/`, all within their size caps.

### T-0.3: Create `tools/extract-posters.js` (1080px WebP Posters)
- **Create:** `tools/extract-posters.js`
- **Action:** For each video in `server/public/media/cards/videos/high/`:
  1. Extract frame at ~30% duration (2.4s of 8s loop) as a 1080px wide WebP image (1080x680, quality 85) into `server/public/media/cards/posters/<cardId>.webp`.
  2. Verify dimensions (1080x680) and check for blank/black frames.
- **Accept:** 24 poster image files in `server/public/media/cards/posters/`, each matching a canonical card ID, 1080x680 WebP, non-blank.

### T-0.4: Copy and process card images (1080px WebP Images)
- **Create:** `tools/process-images.js`
- **Action:**
  1. Read personality images from `Cards/GOAT's/`.
  2. Convert all card images to **WebP format**, resized to **1080 px wide (1080x680)** maintaining the 1.586:1 card ratio, quality 85.
  3. Write outputs to `server/public/media/cards/images/` using standardized kebab-case filenames (`sports-*.webp`).
- **Accept:** All card images appear in `server/public/media/cards/images/` as `.webp` files, with dimensions 1080x680.

### T-0.5: Verify card images for chips
- **Action:** The agent views every card image in `server/public/media/cards/images/`.
- If any image shows a chip, exclude that card from `server/data/cards.manifest.json` and list it in `docs/chip-audit-report.md`.
- Never delete or edit any image.
- Do not add any `chipAudit` field to the manifest.
- **Output:** `docs/chip-audit-report.md` confirming all verified images, listing any excluded cards with chips, and confirming that all included card images have no chip.
- **Accept:** Every card image is verified; any card displaying a chip is excluded from the manifest and documented in `docs/chip-audit-report.md`; no image is deleted or modified; manifest contains no `chipAudit` field.

### T-0.6: Folder-to-category mapping approval & manifest generation
- **Approved Mapping:**
  - `Abstract` (video) → Category `abstract` ("Abstract Art", `@fontsource/orbitron`)
  - `Cars` (video) → Category `cars` ("Supercars & Drift", `@fontsource/anton`)
  - `Game` (video) → Category `gaming` ("Gaming Worlds", `@fontsource/press-start-2p`)
  - `Naruto` (video) + `Others/frieren*` → Category `anime` ("Anime", `@fontsource/bangers`)
  - `Spider Man` (video) + `Others/the-batman*` → Category `superheroes` ("Superheroes", `@fontsource/bangers`)
  - `GOAT's` (images) → Category `sports-legends` ("Sports Legends", `@fontsource/bebas-neue`)
  - *Coding has no wallpapers and is excluded from the card catalog.*
- **Create:** `tools/build-manifest.js`
- **Create:** `server/data/cards.manifest.json`
- **Note:** Do NOT generate `cards.manifest.json` until user gives approval at Phase 0 gate.
- **Schema:** Maps each populated card to `id`, `name`, `category`, `image`, `videos` (`{ low, mid, high, max }`), `poster`, `fontFamily`, `textColor`, `textShadow`, `letterSpacing`, `textPosition`, `objectPosition`.
- **Accept:** `server/data/cards.manifest.json` contains only cards with art, valid JSON, matching the approved mapping table and multi-tier video schema.

### T-0.7: Create `tools/audit-report.js`
- **Create:** `tools/audit-report.js`
- **Writes:** `docs/media-audit-report.md`
- **Action:** List every video with original size, output size, duration, pass/fail. List every processed WebP image. List every card in the manifest with its font and presence of artwork.
- **Accept:** `docs/media-audit-report.md` is a comprehensive report ready for user review.

### T-0.8: Relative `.gitignore` & media storage policy (Item 5)
- **Create:** `.gitignore`
- **Use relative paths only:**
  ```
  node_modules/
  .env
  dist/
  android/
  .capacitor/
  /Cards/
  server/public/media/cards/videos/
  server/public/media/cards/posters/
  server/public/media/cards/images/
  ```
- **Storage Policy:** State explicitly that processed media is **not committed to Git** and **not stored in Git LFS**; it is generated locally via `tools/` and served statically by Express (`/media/cards/...`) or shared separately for deployment.
- **Accept:** `.gitignore` uses `/Cards/` (anchored to repo root); no media files are staged.

**🚧 GATE: User reviews `docs/media-audit-report.md` and `docs/chip-audit-report.md` before proceeding.**

---

## Phase 1 — Server Foundation

> **Read `docs/SPEC.md` first** before starting this phase.

### T-1.1: Root workspace setup & Atlas setup guide (Item 20)
- **Create:** `package.json` (root workspace config, `"type": "module"`, scripts for dev/test)
- **Create:** `.env.example` — documents all env vars:
  ```env
  PORT=3000
  NODE_ENV=development
  MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/novabank?retryWrites=true&w=majority
  JWT_SECRET=your_jwt_secret_here
  DEMO_SHOW_OTP=true
  VITE_API_BASE_URL=http://localhost:3000
  VITE_MEDIA_BASE_URL=http://localhost:3000
  ```
- **MongoDB Atlas Setup Note:** Include instructions in setup docs:
  1. Create a free M0 cluster on MongoDB Atlas (authentic 3-node replica set required for Mongo transactions).
  2. Under Network Access, add IP allow-list (`0.0.0.0/0` for development or current IP).
  3. Under Database Access, create a database user and password.
  4. Copy connection string to `MONGODB_URI`.
- **Create:** `README.md` (placeholder, filled in Phase 8)
- **Accept:** `npm install` at root succeeds.

### T-1.2: Server project init
- **Create:** `server/package.json` (`"type": "module"`, dependencies: express, mongoose, bcrypt, jsonwebtoken, zod, helmet, cors, express-rate-limit, dotenv, uuid)
- **Verify package names/versions:** Run `npm view <package> version` for each before adding.
- **Accept:** `cd server && npm install` succeeds, no deprecated warnings.

### T-1.3: Server config & CORS allow-list (Item 10, 14, 16)
- **Create:** `server/src/config/env.js` — loads `.env`, exports config with:
  - `DEMO_SHOW_OTP`: boolean (default `true` in simulation mode)
  - CORS allow-list including `http://localhost:5173`, `http://localhost:3000`, `capacitor://localhost`, `http://localhost`, `https://localhost`, and local IP addresses.
- **Create:** `server/src/config/db.js` — Mongoose connection with retry logic, exports `connectDB()`.
- **Create:** `server/src/config/limits.js` — all limits (amounts, rates, min age 16), with daily limit evaluation set to `Asia/Kolkata` timezone.
- **Accept:** Importing each file does not throw.

### T-1.4: Mongoose models with pending status & PIN lockout (Item 7, 8, 9)
- **Create:** `server/src/models/User.js`:
  - `status`: `{ type: String, enum: ['pending', 'active'], default: 'pending' }`
  - `failedPinAttempts`: `{ type: Number, default: 0 }`
  - `pinLockedUntil`: `{ type: Date, default: null }`
  - `refreshTokens`: array of `{ tokenHash: String, createdAt: Date, expiresAt: Date, device: String }` (SHA-256 hashed, never bcrypt)
  - `balancePaise`: integer, default 1,000,000 paise (₹10,000)
- **Create:** `server/src/models/Transaction.js` — schema per PLAN.md, compound index on `(userId, createdAt)`, unique index on `(userId, idempotencyKey)`.
- **Create:** `server/src/models/Otp.js` — schema with TTL index on `expiresAt` (5 minutes).
- **Accept:** All three models compile without errors when imported.

### T-1.5: Utility functions (Item 9, 17)
- **Create:** `server/src/utils/accountNumber.js` — generates `NB` + 10 random digits.
- **Create:** `server/src/utils/referenceId.js` — generates unique reference IDs (`NB` + timestamp + random).
- **Create:** `server/src/utils/cardNumber.js` — generates fictional `9000-xxxx-xxxx-xxxx` demo numbers.
- **Create:** `server/src/utils/tokens.js` — `signAccessToken(userId)`, `generateRefreshToken()` (generates random 40-byte hex token and SHA-256 hash `crypto.createHash('sha256').update(token).digest('hex')`), `verifyAccessToken(token)`.
- **Accept:** Each function returns the expected format when called.

### T-1.6: Middleware
- **Create:** `server/src/middleware/auth.js` — JWT verification middleware, attaches `req.userId`.
- **Create:** `server/src/middleware/rateLimiter.js` — exports rate limiter configs (login, OTP, transfer, general).
- **Create:** `server/src/middleware/validate.js` — generic zod validation middleware factory: `validate(schema)` returns middleware.
- **Create:** `server/src/middleware/errorHandler.js` — central error handler, generic messages, logs stack in dev.
- **Accept:** Each middleware exports a function.

### T-1.7: Express app and health route
- **Create:** `server/src/index.js` — Express app with helmet, cors, JSON body parser, routes, error handler. Health route at `GET /api/health`.
- **Create:** `server/src/routes/health.routes.js` — returns `{ status: 'ok', db: mongoose.connection.readyState }`.
- Serve `server/public/` as static with `Cache-Control: public, max-age=31536000` for `/media/` paths.
- Serve `server/data/cards.manifest.json` at `GET /api/cards`.
- **Accept:** `node server/src/index.js` starts, `GET /api/health` returns 200.

### T-1.8: Test harness
- **Create:** `server/tests/setup.js` — starts `MongoMemoryReplSet`, connects Mongoose, exports teardown.
- **Create:** `server/vitest.config.js` or relevant config — uses setup file, sets timeout.
- **Create:** `server/tests/health.test.js` — verifies health endpoint returns 200.
- **Accept:** `npm test` in server runs and the health test passes.

---

## Phase 2 — Auth

> **Read `docs/SPEC.md` first** before starting this phase.

### T-2.1: Auth schemas with change-PIN (Item 8)
- **Create:** `server/src/schemas/auth.schemas.js`
- Define zod schemas for:
  - Register body (name, dob ≥ 16 years, phone in E.164, nationality optional)
  - OTP request & verify bodies
  - Set PIN body (6-digit numeric string)
  - Change PIN body (`currentPin`, `newPin`, `confirmPin`)
  - Login body (phone, 6-digit PIN)
  - Refresh token body (`refreshToken` string)
- **Accept:** Each schema validates compliant payloads and rejects invalid formats.

### T-2.2: OTP service
- **Create:** `server/src/services/otp.service.js`
- Functions: `requestOtp(phone)` — generates 6-digit code, stores bcrypt hash, returns plaintext code for dev/demo. `verifyOtp(phone, code)` — verifies hash, increments attempt counter, enforces 5-attempt limit and 5-minute TTL.
- **Accept:** Unit-testable OTP generation and verification functions.

### T-2.3: Auth service with pending restart, PIN lockout & SHA-256 tokens (Item 7, 8, 9)
- **Create:** `server/src/services/auth.service.js`
- Implement:
  1. `register(data)`: Checks if user exists. If existing user has `status: 'pending'`, allows restarting/updating the pending record. If `status: 'active'`, rejects with 409 Conflict. Creates new user in `pending` status with demo balance.
  2. `setPin(userId, pin)`: Hashes 6-digit PIN with bcrypt, stores `pinHash`, transitions user `status` to `'active'`.
  3. `changePin(userId, currentPin, newPin)`: Verifies `currentPin` with bcrypt; enforces PIN lockout rules; updates `pinHash` on success.
  4. `login(phone, pin)`:
     - Checks `pinLockedUntil`. If locked (current time < `pinLockedUntil`), throws 423 Locked with remaining time.
     - Compares PIN. On mismatch: increments `failedPinAttempts`. If `failedPinAttempts >= 5`, sets `pinLockedUntil = Date.now() + 15 * 60 * 1000`. Throws 401.
     - On match: resets `failedPinAttempts` to 0 and clears `pinLockedUntil`. Generates access token (15m) and random 40-byte hex refresh token.
     - Computes SHA-256 hash of refresh token and appends `{ tokenHash, createdAt, expiresAt }` to user's `refreshTokens` array (never bcrypt).
  5. `refreshToken(token)`: Computes SHA-256 hash of input token; queries user with matching hash; verifies expiry; returns new access token.
  6. `logout(userId, token)`: Computes SHA-256 hash and pulls matching entry from `refreshTokens` array.
- **Accept:** Service implements restartable pending registration, 15-minute PIN lockout, change PIN, and multi-token SHA-256 storage.

### T-2.4: Auth controller with DEMO_SHOW_OTP flag (Item 16)
- **Create:** `server/src/controllers/auth.controller.js`
- Handlers for register, OTP request/verify, PIN set, PIN change, login, refresh, logout.
- **Demo OTP Flag:** In OTP request/verify, check `process.env.DEMO_SHOW_OTP === 'true'`. If true, include `devOtp` in response body in any environment.
- **Body-Based Token Delivery:** Tokens (`accessToken`, `refreshToken`) are returned strictly in the JSON response body for secure storage on mobile/web. No cookies used.
- **Accept:** Controllers handle requests, enforce status codes, and respect `DEMO_SHOW_OTP`.

### T-2.5: Auth routes
- **Create:** `server/src/routes/auth.routes.js`
- Register routes:
  - `POST /api/auth/register`
  - `POST /api/auth/otp/request`
  - `POST /api/auth/otp/verify`
  - `POST /api/auth/pin`
  - `POST /api/auth/pin/change` (protected by access token middleware)
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout` (protected by access token middleware)
- **Accept:** All auth endpoints respond appropriately.

### T-2.6: Auth tests including lockout & token revocation (Item 7, 8, 9)
- **Create:** `server/tests/auth.test.js`
- Test cases:
  1. Register valid user → creates user with `status: 'pending'`.
  2. Register existing phone while pending → succeeds (restarts pending registration).
  3. Register existing phone while active → 409 Conflict.
  4. Underage (<16) registration → 400.
  5. Request OTP with `DEMO_SHOW_OTP=true` → returns `devOtp`.
  6. Verify OTP and set PIN → activates user (`status: 'active'`).
  7. Login with correct PIN → returns tokens in body; SHA-256 hash stored.
  8. Login with wrong PIN 5 times → account locked for 15 minutes; 6th attempt rejected with 423.
  9. Change PIN with valid current PIN → updates PIN.
  10. Change PIN with invalid current PIN → rejects and increments failed attempts.
  11. Refresh token with valid token → issues new access token.
  12. Logout → removes token hash; subsequent refresh with that token is rejected (401).
- **Accept:** All 12 test suites pass.

---

## Phase 3 — Banking Core

> **Read `docs/SPEC.md` first** before starting this phase.

### T-3.1: Banking schemas (zod)
- **Create:** `server/src/schemas/banking.schemas.js`
- Schemas for transfer body, deposit body, withdrawal body, transaction query params.
- **Accept:** Input validation works reliably.

### T-3.2: Account service with active user lookup (Item 7)
- **Create:** `server/src/services/account.service.js`
- Functions: `getBalance(userId)`, `updateSettings(userId, settings)`, `updateCard(userId, cardId)`.
- `lookupRecipient(phone, account)`: Queries `{ $or: [{ phone }, { accountNumber: account }], status: 'active' }`. Returns display name only. Returns 404 if user not found or user is in `pending` status.
- **Accept:** Recipient lookup succeeds ONLY for active accounts.

### T-3.3: Transfer service with session daily limit in Asia/Kolkata (Item 10)
- **Create:** `server/src/services/transfer.service.js`
- `executeTransfer(senderId, { recipientPhone, recipientAccount, amountPaise, note, pin, idempotencyKey })`:
  1. Enforce sender PIN lockout check: if locked, reject. Verify PIN; on error, increment failed attempts and enforce 15m lockout if 5 attempts reached.
  2. Reject self-transfer.
  3. Enforce single-transfer limit (max ₹50,000 / 5,000,000 paise).
  4. Check idempotency: if key exists for sender, return stored result without re-executing.
  5. **Start MongoDB transaction session.**
  6. **Inside transaction session (`.session(session)`):**
     - Compute start of day and end of day in **`Asia/Kolkata`** (IST, UTC+05:30).
     - Aggregate sender's successful `transfer_out` transactions today inside the session.
     - If `(todaySum + amountPaise) > 10,000,000 paise (₹1,00,000)`: abort transaction and throw 400 "Daily transfer limit of ₹1,00,000 exceeded".
     - Atomically debit sender (`balancePaise >= amountPaise` guard).
     - Atomically credit active recipient.
     - Create both `transfer_out` and `transfer_in` Transaction records sharing `transferId`.
  7. Commit transaction and return reference ID and updated balance.
- **Accept:** Transfer runs atomically inside Mongo session, calculating Asia/Kolkata daily limit inside session.

### T-3.4: Deposit and withdraw services
- **Create:** `server/src/services/deposit.service.js` — max ₹50,000 demo credit per operation.
- **Create:** `server/src/services/withdraw.service.js` — validates sufficient balance, debits account.
- **Accept:** Balance and transactions updated correctly.

### T-3.5: Transaction service
- **Create:** `server/src/services/transaction.service.js`
- `listTransactions(userId, { filter, page, limit })` — paginated passbook query supporting filters (`all`, `money_in`, `money_out`).
- `getTransaction(userId, transactionId)` — retrieves transaction details.
- **Accept:** Filtering and pagination function correctly.

### T-3.6: Banking controllers
- **Create:** `server/src/controllers/account.controller.js`
- **Create:** `server/src/controllers/transfer.controller.js`
- **Create:** `server/src/controllers/transaction.controller.js`
- **Accept:** Express routes connected cleanly.

### T-3.7: Banking routes
- **Create:** `server/src/routes/account.routes.js`
- **Create:** `server/src/routes/transfer.routes.js`
- **Create:** `server/src/routes/transaction.routes.js`
- **Accept:** Routes wired to Express app.

### T-3.8: Banking tests with concurrency & Asia/Kolkata daily limit (Item 10)
- **Create:** `server/tests/transfer.test.js`
  1. Transfer success → balances and records match; shared transferId.
  2. Insufficient balance → 400, no balance change.
  3. Transfer to pending user → 404/400 (cannot transfer to inactive user).
  4. Exceeds daily transfer limit in `Asia/Kolkata` → 400 rejected inside transaction.
  5. Wrong PIN → increments failed attempts toward lockout.
  6. Idempotent retry → original referenceId returned; no double debit.
- **Create:** `server/tests/concurrency.test.js`
  1. Two simultaneous transfers from same account attempting to overdraw → exactly one succeeds, one fails.
- **Create:** `server/tests/transaction.test.js`
  1. Passbook pagination and filters (`all`, `money_in`, `money_out`).
  2. Deposit and withdrawal edge cases.
- **Accept:** All banking and concurrency tests pass against replica set.

---

## Phase 4 — Client Shell & Glass Navigation 🚧 GATE

> **Read `docs/SPEC.md` first** before starting this phase.

### T-4.1: Client project setup with @fontsource packages (Item 13)
- **Create:** `client/package.json` (dependencies: react, react-dom, react-router-dom, `tailwindcss`, `@tailwindcss/vite`, motion, qrcode.react, `@fontsource/dm-sans`, `@fontsource/orbitron`, `@fontsource/rajdhani`, `@fontsource/press-start-2p`, `@fontsource/anton`, `@fontsource/jetbrains-mono`, `@fontsource/space-grotesk`, `@fontsource/syne`, `@fontsource/exo-2`, `@fontsource/bangers`, `@fontsource/bebas-neue`, `@fontsource/cinzel`, `@zxing/browser`, `@zxing/library`)
- **Create:** `client/vite.config.js` (proxy `/api` to `http://localhost:3000`; add `@tailwindcss/vite` as a Vite plugin — **no separate postcss.config.js or tailwind.config.js needed with Tailwind v4**)
- **Create:** `client/index.html`
- **Tailwind v4 — DO NOT write v3-style config (Item 2):**
  - Do **not** create `tailwind.config.js`, `postcss.config.js`, or use `autoprefixer` as separate packages — they are unnecessary in Tailwind v4.
  - Add `import tailwindcss from '@tailwindcss/vite'` and `plugins: [tailwindcss()]` to `vite.config.js`.
  - In `client/src/index.css`, replace the legacy `@tailwind base/components/utilities` directives with a single line: `@import "tailwindcss";`
- **Verify** all package names and versions with `npm view` before installing.
- **Accept:** `npm run dev` in client starts Vite without errors; fonts import properly; no v3-style Tailwind config files exist.

### T-4.2: CSS foundation with tuned glass reference (Item 15)
- **Create:** `client/src/index.css`
- Define CSS custom properties for all colours (light and dark), both in `:root` (light) and `[data-theme="dark"]`.
- **Tailwind v4:** Start the file with `@import "tailwindcss";` (single line — do **not** use the v3 `@tailwind base/components/utilities` directives).
- **Tuned Glass Specification (Item 15):**
  ```css
  .glass-surface, .nav {
    border-radius: 24px;
    background: rgba(255, 255, 255, 0.34);
    backdrop-filter: blur(18px) saturate(190%);
    -webkit-backdrop-filter: blur(18px) saturate(190%);
    border: 1px solid rgba(255, 255, 255, 0.9);
    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95),
                inset 0 -1px 0 rgba(255, 255, 255, 0.35),
                inset 0 0 14px rgba(255, 255, 255, 0.35),
                0 10px 28px rgba(16, 36, 62, 0.22);
  }
  .bubble {
    background: rgba(255, 255, 255, 0.55);
    border: 1px solid rgba(255, 255, 255, 0.95);
    box-shadow: inset 0 1px 0 #ffffff,
                inset 0 -6px 10px rgba(27, 79, 156, 0.1),
                0 3px 10px rgba(16, 36, 62, 0.14);
  }
  [data-glass="lite"] .glass-surface, [data-glass="lite"] .nav {
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }
  [data-glass="off"] .glass-surface, [data-glass="off"] .nav {
    background: var(--surface);
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    border: 1px solid var(--border);
  }
  ```
- **Accept:** CSS classes render glass with correct specular highlights and blur.

### T-4.3: Theme and Glass contexts
- **Create:** `client/src/context/ThemeContext.jsx` — manages `light/dark/system`, sets `data-theme` on `<html>`.
- **Create:** `client/src/context/GlassContext.jsx` — manages `auto/full/lite/off`, sets `data-glass` on `<html>`. Auto mode measures frame times.
- **Accept:** Theme and glass mode switch when context values change.

### T-4.4: GlassSurface component
- **Create:** `client/src/components/glass/GlassSurface.jsx`
- A `<div>` that applies the `.glass-surface` class. Accepts `className` and `children` props.
- **Accept:** Renders a div with the glass class.

### T-4.5: GlassBubble component with exact physics (Item 15)
- **Create:** `client/src/components/glass/GlassBubble.jsx`
- An absolutely-positioned element inside the nav bar that animates to the active tab's position.
- Uses `motion` for spring animation (stiffness 380, damping 28, mass 0.9).
- Uses exact `.bubble` styles from Item 15.
- On press-and-drag: lifts (scale ~1.1), follows pointer, squash-and-stretch based on velocity.
- On release: settles on nearest tab (with velocity projection for flick), overshoots and springs back.
- **Accept:** Bubble animates between positions with spring physics and matches CSS reference.

### T-4.6: BottomBar component (mobile/tablet)
- **Create:** `client/src/components/glass/BottomBar.jsx`
- Floating pill bar at the bottom, inset from edges, `position: fixed`, `z-index: 50`.
- Contains 5 tabs: Home, Cards, Pay, Passbook, Profile with icons and labels.
- `GlassSurface` as container, `GlassBubble` behind active tab.
- Tap: bubble springs to tapped tab.
- Drag: bubble follows finger, tabs preview-highlight, release settles with spring.
- `touch-action: none` on the bar itself.
- Keyboard: `role="tablist"`, arrow keys, visible focus ring.
- Shown at `< 1024px` width. At `640-1024px`: centered, max 520px wide.
- **Accept:** Bar renders, tabs switch, bubble animates on tap and drag.

### T-4.7: SideRail component (desktop)
- **Create:** `client/src/components/glass/SideRail.jsx`
- Compact floating vertical rail on the left, same bubble behaviour but vertical axis.
- Hover expands labels.
- Shown at `> 1024px` width.
- **Accept:** Rail renders, vertical drag works, labels expand on hover.

### T-4.8: Page transitions
- **Create:** `client/src/components/layout/PageTransition.jsx`
- Direction-aware horizontal slide (enters from left/right based on tab order).
- ~300-350ms spring, slight fade and scale (0.98→1).
- All 5 sections stay mounted (visibility hidden + aria-hidden for inactive).
- **Accept:** Switching tabs animates correctly, scroll position survives tab switch.

### T-4.9: AppShell layout
- **Create:** `client/src/components/layout/AppShell.jsx`
- Structure: `PageTransition` container (animated, contains all sections) and `BottomBar/SideRail` as **siblings** (never nested).
- Uses `useMediaQuery` to choose bar vs. rail.
- **Create:** `client/src/hooks/useMediaQuery.js`
- **Accept:** Nav bar and page container are siblings in the DOM. Nav is never inside an animated/transformed ancestor.

### T-4.10: Swipe between sections with explicit order (Item 12 Override)
- **Create:** `client/src/hooks/useSwipe.js`
- **Bottom Bar Tab Adjacency Swipe Order:** Follows order `Home, Cards, Pay, Passbook, Profile`, ONE tab at a time.
- A swipe can **START only on** `Home`, `Passbook`, and `Profile`, never on `Cards`, `Pay`, focused inputs, or open sheets/modals:
  - Swipe left on **Home** transitions to **Cards**.
  - On **Passbook**: swipe right transitions to **Pay**, swipe left transitions to **Profile**.
  - On **Profile**: swipe right transitions to **Passbook**.
- Axis locking (horizontal ≥ 1.5× vertical), 24px edge dead zone.
- Mouse drag NOT supported (desktop).
- **Accept:** Swiping follows sequential adjacent order, starts only on Home, Passbook, and Profile, and honors dead zone.

### T-4.11: `/dev/glass-test` page
- **Create:** `client/src/pages/dev/GlassTest.jsx`
- Renders a colorful scrolling pattern behind the glass nav bar.
- Purpose: verify that `backdrop-filter` is visibly blurring the content.
- Route: `/dev/glass-test`.
- **Accept:** Opening this page in the browser shows the nav bar visibly blurring the colorful content behind it. **Screenshot required.**

### T-4.12: App routing setup
- **Create:** `client/src/App.jsx`
- React Router: public routes (Welcome, Login, Register, OTP, PIN, ChooseCard, AccountCreated), protected routes (AppShell with 5 sections), dev routes (`/dev/glass-test`).
- **Create:** `client/src/main.jsx`
- **Accept:** All routes resolve, navigation works.

### T-4.13: Draggable bubble hook
- **Create:** `client/src/hooks/useDragBubble.js`
- Handles pointer events (pointerdown, pointermove, pointerup) for the bubble drag interaction.
- Velocity tracking for flick-to-next-tab.
- Squash-and-stretch calculation based on velocity.
- **Accept:** Bubble can be dragged and released with physics.

**🚧 GATE: Take a screenshot of `/dev/glass-test` showing visible blur. Record a screen capture of bubble drag. User approves before Phase 5.**

---

## Phase 5 — Screens

> **Read `docs/SPEC.md` first** before starting this phase.

### T-5.1: API client & media URL prefixing (Item 14)
- **Create:** `client/src/api/client.js` — Axios/fetch wrapper utilizing `VITE_API_BASE_URL` (with fallback to current origin), automatic bearer token injection, and auto-refresh on 401.
- **Create:** `client/src/api/auth.js` — register, requestOtp, verifyOtp, setPin, changePin, login, refresh, logout.
- **Create:** `client/src/api/accounts.js` — getMe, updateSettings, updateCard, lookupRecipient.
- **Create:** `client/src/api/transfers.js` — sendTransfer, deposit, withdraw.
- **Create:** `client/src/api/transactions.js` — listTransactions, getTransaction.
- **Create:** `client/src/api/cards.js` — `getCards`: fetches manifest and automatically prepends `VITE_MEDIA_BASE_URL` to relative `image`, `video`, and `poster` URLs.
- **Accept:** Each API module exports correct functions and media paths are prefixed.

### T-5.2: Auth context and hook
- **Create:** `client/src/context/AuthContext.jsx` — stores user, tokens in secure storage (Capacitor Preferences / localStorage), provides login/logout/refresh.
- **Create:** `client/src/hooks/useAuth.js` — convenience hook for auth context.
- **Accept:** Login sets tokens, logout clears them, protected routes redirect to login.

### T-5.3: Common components with portal rendering (Item 11)
- **Create:** `client/src/components/common/Button.jsx` — primary/secondary/danger variants.
- **Create:** `client/src/components/common/PinInput.jsx` — 6-digit PIN input with auto-advance.
- **Create:** `client/src/components/common/OtpInput.jsx` — 6-digit OTP input with timer and "Demo OTP" banner.
- **Create:** `client/src/components/common/AmountInput.jsx` — INR input with Indian grouping preview.
- **Create:** `client/src/components/common/BottomSheet.jsx` — draggable bottom sheet rendering via `ReactDOM.createPortal(children, document.body)`.
- **Create:** `client/src/components/common/Modal.jsx` — centered modal rendering via `ReactDOM.createPortal(children, document.body)`.
- **Create:** `client/src/components/common/LoadingSpinner.jsx`
- **Create:** `client/src/components/common/SimulationNotice.jsx` — "Fictional banking simulation. No real money."
- **Accept:** All overlays render outside animated containers through a portal to `document.body`.

### T-5.4: Utility functions
- **Create:** `client/src/utils/formatCurrency.js` — `formatINR(paise)` using `Intl.NumberFormat('en-IN')`.
- **Create:** `client/src/utils/paise.js` — `toPaise(rupees)`, `fromPaise(paise)`.
- **Create:** `client/src/utils/motion.js` — `prefersReducedMotion()` check.
- **Accept:** `formatINR(2458050)` returns `"₹24,580.50"`.

### T-5.5: Onboarding screens with Demo OTP banner (Item 16)
- **Create:** `client/src/pages/Welcome.jsx` — logo, pitch, SimulationNotice, "Create account" and "Log in" buttons.
- **Create:** `client/src/pages/Register.jsx` — form: full name, DOB, phone, nationality (optional). Pending registrations can be restarted seamlessly.
- **Create:** `client/src/pages/OtpVerify.jsx` — OTP input, timer, "Demo OTP" banner displayed whenever `devOtp` is returned (governed by `DEMO_SHOW_OTP=true`).
- **Create:** `client/src/pages/SetPin.jsx` — 6-digit PIN input with confirm step.
- **Create:** `client/src/pages/ChooseCard.jsx` — card catalog in first-run mode.
- **Create:** `client/src/pages/AccountCreated.jsx` — shows account number, starting balance, "Go to Home" button.
- **Accept:** Full registration flow works end-to-end: Register → OTP → PIN → Choose Card → Account Created → Home.

### T-5.6: Login screen with lockout feedback (Item 8)
- **Create:** `client/src/pages/Login.jsx` — phone + PIN, displays lockout countdown banner if account is locked (HTTP 423), navigates to Home on success.
- **Accept:** Login works, handles 15-minute PIN lockout, stores tokens in body.

### T-5.7: Home screen
- **Create:** `client/src/pages/Home.jsx`
- Greeting ("Good morning, Name"), available balance (formatted INR), selected card.
- Quick actions: Send, Deposit, Withdraw, History.
- Last 5 transactions with "See all" link to Passbook.
- Deposit/Withdraw open BottomSheet (portal to `<body>`) with AmountInput.
- **Accept:** Home displays balance, quick actions work, deposit/withdraw update balance.

### T-5.8: Pay section with camera lifecycle & server name resolution (Item 11, 21)
- **Create:** `client/src/pages/Pay.jsx` — container with SegmentedControl (Send, Receive, Scan).
- **Create:** `client/src/components/glass/SegmentedControl.jsx` — small sliding glass pill.
- **Create:** `client/src/pages/Send.jsx` — recipient input (phone/account), amount, note, review screen showing recipient name from lookup API, PIN confirmation, result screen with reference ID.
- **Create:** `client/src/pages/Receive.jsx` — user's name, account number, QR code (`qrcode.react`), "Copy account number" button.
- **Create:** `client/src/pages/Scan.jsx`:
  - Renders through `ReactDOM.createPortal(children, document.body)`.
  - Camera starts **only when the Scan tab is active**; camera tracks stopped immediately when inactive or closed.
  - On QR code scan: extracts recipient account, queries `GET /api/accounts/lookup?account=...`, and displays the **authoritative name returned by the server** on the review screen (ignoring any name in the QR payload).
- **Accept:** Send flow works end-to-end. Receive shows QR. Scan opens camera only when active and uses server-resolved recipient name.

### T-5.9: Passbook screen with filters (renamed from filter chips)
- **Create:** `client/src/pages/Passbook.jsx`
- All transactions: date, amount (green for in, red for out), running balance, status, reference ID.
- **Passbook filters:** All, Money In, Money Out.
- Infinite scroll or pagination.
- Tap row → detail bottom sheet with full transaction info.
- **Accept:** Transactions load, passbook filters work, detail sheet opens in portal.

### T-5.10: Profile screen with change-PIN (Item 8)
- **Create:** `client/src/pages/Profile.jsx`
- Personal details (name, phone, account number).
- Theme setting (Light/Dark/System).
- Glass effects setting (Auto/Full/Lite/Off).
- Motion setting (reduced motion toggle).
- **Card animation setting:** (Off / Low / Mid / High / Max; default Mid; Off shows poster only; defaults to Off on reduced motion; replaces video autoplay toggle).
- Haptics toggle.
- Change PIN modal calling `POST /api/auth/pin/change` (current PIN → new PIN → confirm).
- Log out button (revokes refresh token on server).
- SimulationNotice at the bottom.
- **Accept:** All settings persist. PIN can be changed securely. Logout revokes token and redirects.

---

## Phase 6 — Cards 🚧 GATE

> **Read `docs/SPEC.md` first** before starting this phase.

### T-6.1: Font loading with self-hosted @fontsource (Item 13)
- **Create:** `client/src/utils/loadCardFont.js`
- Imports self-hosted font families from `@fontsource/*` for all card categories.
- If a card manifest entry specifies `fontFile` in `public/fonts/`, loads that custom font via `@font-face` override.
- **Accept:** Every card category uses its specified self-hosted font without external CDN dependencies.

### T-6.2: CardFace component with narrowed chip check
- **Create:** `client/src/components/cards/CardFace.jsx`
- Aspect ratio 1.586:1, video/image fills edge-to-edge (`object-fit: cover`).
- Bank name "NovaBank" and masked card number only. Tap to reveal.
- **Strictly no chip:** `CardFace.jsx`, card CSS, and card assets must contain no chip element, SVG, or icon. (Category and transaction filter buttons are exclusively named "filters" to eliminate naming clashes).
- Per-card `fontFamily`, `textColor`, `textShadow`, `letterSpacing`, `textPosition` from manifest.
- `font-variant-numeric: tabular-nums` on card number.
- If `numberFont` is specified, use it for the number.
- **Accept:** Card renders correctly with no chip, correct font, readable text. Automated code check: run a targeted search across `client/src/components/cards/CardFace.jsx`, card CSS, and card assets to verify zero occurrences of "chip" element, SVG, class, or icon.

### T-6.3: Card video playback (Four Quality Tiers)
- **Modify:** `client/src/components/cards/CardFace.jsx`
- `<video muted playsInline loop preload="metadata">`.
- Only focused card plays (prop `isFocused`).
- Video tier selected based on user's `Card animation` setting (`low`, `mid`, `high`, `max`). If file fails to load, falls back to next lower tier, then poster.
- IntersectionObserver pauses off-screen videos.
- Page Visibility API pauses on background.
- Fall back to poster when: Card animation is "Off", reduced motion on, video error, data saver, or Lite glass mode.
- Never apply CSS blur/filter on playing video.
- **Accept:** Video plays selected tier only when focused, pauses off-screen, falls back to poster.

### T-6.4: CardCarousel component
- **Create:** `client/src/components/cards/CardCarousel.jsx`
- Hero carousel on the Cards screen showing the user's selected card large.
- Swipe between cards in the carousel.
- Tap-to-reveal card number.
- "Change design" button opens CardCatalog.
- **Accept:** Carousel displays, swipe changes cards, tap reveals number.

### T-6.5: CardCatalog component (only cards with art, Item 3)
- **Create:** `client/src/components/cards/CardCatalog.jsx`
- **Populated Cards Only (Item 3):** Displays only cards that have artwork (image or video/poster).
- **Dynamic Category Filters:** Category filters (All, Anime, Gaming, Cars, etc.) appear **only** for categories that have at least one card with art.
- Grid of poster images.
- Tap to preview (larger view with CardPreview).
- "Use this card" button → `PATCH /api/me/card`.
- **Accept:** Catalog displays only cards with art; category filters reflect only populated categories; selection updates active card.

### T-6.6: CardPreview component
- **Create:** `client/src/components/cards/CardPreview.jsx`
- Larger card view in a modal/bottom sheet (portal to `<body>`).
- Shows video (if available) and card details.
- "Use this card" confirmation.
- **Accept:** Preview renders correctly.

### T-6.7: Wire cards into screens
- **Modify:** `client/src/pages/Home.jsx` — show selected card (compact CardFace).
- **Modify:** `client/src/pages/Cards.jsx` — full CardCarousel + CardCatalog.
- **Modify:** `client/src/pages/ChooseCard.jsx` — first-run card selection using CardCatalog.
- **Accept:** Cards appear everywhere they should with correct fonts and playback.

### T-6.8: Missing font report
- **Create:** `docs/missing-fonts-report.md`
- List every card category, the spec's ideal font, the `@fontsource` fallback in use, and whether a custom `fontFile` was provided.
- **Accept:** Report is accurate and complete.

**🚧 GATE: User reviews cards at desktop (1440px) and phone (360px) sizes. Every category font renders. No card shows a chip.**

---

## Phase 7 — Android (Capacitor)

> **Read `docs/SPEC.md` first** before starting this phase.

### T-7.1: Capacitor setup & environment configurations (Item 14)
- Run `npm install @capacitor/core @capacitor/cli` in client (verify versions first).
- Run `npx cap init` with app ID `com.novabank.sim`, name `NovaBank`.
- **Create/update:** `client/capacitor.config.ts`.
- **Live-Reload Mode vs Production APK (Item 14):**
  - For development live-reload: set `server.url` to `http://<LAN-IP>:5173` and `cleartext: true`.
  - For production APK: remove or comment out `server.url` so Capacitor loads the bundled web assets from the local filesystem (`dist/`).
  - Configure `androidScheme`: set `server.androidScheme: 'http'` for debug (to avoid mixed-content issues when communicating with HTTP backend on LAN) or set to `'https'` for production builds with proper network certificates.
  - Document mixed-content WebView settings (`mixedContentMode: 'always'`) in Android WebView config if debugging HTTP APIs from HTTPS scheme.
- **Accept:** `npx cap init` succeeds and `capacitor.config.ts` documents debug vs production configurations.

### T-7.2: Add Android platform & security config (Item 14)
- Run `npx cap add android`.
- **Modify:** `android/app/src/main/AndroidManifest.xml` — add `android:usesCleartextTraffic="true"` (debug only), camera permission `<uses-permission android:name="android.permission.CAMERA" />`.
- Document Network Security Configuration (`res/xml/network_security_config.xml`) permitting cleartext traffic to local LAN IP addresses during development.
- **Accept:** Android project exists in `client/android/` with debug cleartext and camera permissions configured.

### T-7.3: Capacitor plugins
- Install (verify each on npm first): `@capacitor/app`, `@capacitor/haptics`, `@capacitor/status-bar`, `@capacitor/splash-screen`, `@capacitor-mlkit/barcode-scanning`.
- **Modify:** `Scan.jsx` to use `@capacitor-mlkit/barcode-scanning` when on Android, web scanner (`@zxing/browser` with `@zxing/library`) on desktop.
- **Create:** `client/src/utils/haptics.js` — wraps Capacitor Haptics, no-op on web.
- **Modify:** `GlassBubble.jsx` — trigger haptic on tab cross.
- **Accept:** Plugins install without errors.

### T-7.4: Build debug APK
- Run `npm run build` in client (production build).
- Run `npx cap sync android`.
- Document the exact commands to build a debug APK with Gradle (`./gradlew assembleDebug` inside `client/android`).
- **Accept:** Debug APK is produced at `client/android/app/build/outputs/apk/debug/app-debug.apk`.

### T-7.5: Android back button handling
- **Modify:** `client/src/App.jsx` or `AppShell.jsx`
- Android back: close top sheet/modal → navigate to Home → exit app (via `@capacitor/app`'s `backButton` listener).
- **Accept:** Back button behaviour works correctly.

### T-7.6: On-device checks (document results)
- **Create:** `docs/android-test-results.md`
- Test on Vivo V29 (or emulator) and document:
  1. Does muted video autoplay? (Expected: yes)
  2. Does `backdrop-filter` render? (Expected: depends on WebView version)
  3. Does glass auto-mode detect and switch if needed?
  4. Does QR scanner work?
  5. Does haptic feedback fire?
- **Accept:** Report is filled out with results.

---

## Phase 8 — Polish & Delivery

> **Read `docs/SPEC.md` first** before starting this phase.

### T-8.1: Accessibility pass
- Audit all screens for:
  1. Text contrast ≥ 4.5:1 on every surface (including glass). Increase glass opacity if failing.
  2. Visible focus states on all interactive elements.
  3. Labels on all icon buttons (`aria-label`).
  4. `role="tablist"`, `role="tab"`, `aria-selected` on nav bar.
  5. `role="tabpanel"` on section containers.
  6. Form errors announced with `aria-live`.
  7. Never rely on colour alone (add icons/text for success/failure).
  8. Works with larger system font sizes.
- **Accept:** No critical a11y violations.

### T-8.2: Reduced motion pass
- **Modify:** all animation code
- When `prefers-reduced-motion: reduce`: no squash-and-stretch, no spring overshoot, instant transitions or short fades, card videos replaced by posters.
- **Accept:** Enabling "Reduce motion" in OS settings produces a calm, non-animated experience.

### T-8.3: Empty and error states
- Every screen that loads data must have:
  1. Loading state (LoadingSpinner).
  2. Empty state ("No transactions yet", "No cards found", etc.).
  3. Error state ("Something went wrong. Tap to retry." with a retry action).
- **Accept:** Each screen shows appropriate states.

### T-8.4: Final test run
- Run `npm test` in server. All tests must pass.
- Run the app, perform a full flow: Register → OTP → PIN → Choose Card → Home → Deposit → Send → Passbook → Change Card → Change Theme → Log out → Log in.
- Take screenshots at 360px, 768px, and 1440px.
- **Accept:** All tests pass, full flow works, screenshots captured.

### T-8.5: README & MongoDB Atlas setup guide (Item 20)
- **Overwrite:** `README.md`
- Contents:
  1. Project title and simulation notice.
  2. Architecture diagram (text or mermaid).
  3. Tech stack table.
  4. Prerequisites (Node.js, npm, MongoDB Atlas account, ffmpeg).
  5. **MongoDB Atlas Setup Guide (Item 20):**
     - Create an M0 free tier cluster (which provides replica set support required for transactions).
     - Configure Network Access: add IP allow-list (`0.0.0.0/0` for development or current IP).
     - Create a database user with username and password.
     - Copy the connection string (format: `mongodb+srv://<user>:<password>@cluster.mongodb.net/novabank?retryWrites=true&w=majority`).
     - Save as `MONGODB_URI` in `server/.env`.
  6. Setup steps (≤10):
     - Clone, `npm install`, copy `.env.example` to `.env`, configure MongoDB URI, run media pipeline, start server, start client.
  7. API endpoint list (table).
  8. Running tests.
  9. Building the Android APK.
  10. Screenshots.
  11. Known limitations.
- **Accept:** A classmate can run the project from scratch by following the README with the Atlas setup guide.

### T-8.6: Final cleanup
- Remove any `console.log` from production code (keep in dev-only paths).
- Verify `.env.example` has all required env vars.
- Verify `.gitignore` is complete with `/Cards/` (anchored to repo root) and relative paths.
- **Accept:** No secrets in the repo, no debug logs in production.
