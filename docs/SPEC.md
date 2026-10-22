# NOVABANK MASTER PROMPT (for Antigravity: Claude plans, Gemini builds)

## 0. How to work (read this first)

This project runs in two stages. Follow the stage that matches the model you are.

**Stage 1: Planner (Claude).** Do not write application code. Read this whole document, inspect the project folders, then produce these files in `docs/`:
- `PLAN.md`: architecture, folder tree, data models, API list, screen list, and the phased build plan.
- `TASKS.md`: small numbered tasks grouped by phase. Each task must name the exact files to create or change and have a one-line acceptance check, so a weaker builder model can finish it without guessing.
- `DECISIONS.md`: every assumption you made and why. If something here is ambiguous, pick the default stated in this document, record it, and continue. Do not stall on questions.
- `RISKS.md`: the risks in section 14, each with your mitigation.
Then stop and wait for the user to approve the plan.

**Stage 2: Builder (Gemini).** Build only what `TASKS.md` says, one phase at a time.
- After each phase, run the app, run the tests, and verify in the browser with a screenshot. Never report a phase as done without evidence (test output or a screenshot).
- Stop at every phase marked **GATE** and wait for the user to approve.
- Do not install a package from memory. Check its current name and version on npm first (`npm view <package> version`).
- Do not invent features, endpoints or assets that are not in the plan. If something is missing, write it in `DECISIONS.md` and use the stated default.
- Keep files small and focused. No file over about 300 lines.

## 1. Project summary

**NovaBank** is a fictional digital bank: a **college project** that demonstrates a working full-stack banking simulation. No real money, no real bank accounts, no real payment integrations. Show this clearly: a "Fictional banking simulation. No real money." notice on the welcome screen and in Profile.

It ships as:
1. A responsive **website** (desktop, tablet, mobile browser).
2. An **Android app** (APK) packaged from the same frontend with Capacitor.
Both use one shared backend and one shared React codebase.

The product's signature features are **personalized virtual cards** with animated video backgrounds, and a **premium navigation experience** with a draggable liquid-glass bubble.

## 2. Tech stack (fixed)

| Layer | Choice |
|---|---|
| Database | MongoDB (use MongoDB Atlas free tier; it is a replica set, which transactions need) with Mongoose |
| Backend | Node.js, Express, JavaScript (ES modules) |
| Frontend | React with Vite, Tailwind CSS, React Router |
| Animation and gestures | `motion` (the Framer Motion package; verify the current package name), pointer events |
| Android | Capacitor |
| Auth | JWT access token (short-lived) plus refresh token, passwords/PINs hashed with bcrypt |
| Validation | zod on every request body |
| Hardening | helmet, cors (allow-list), express-rate-limit |
| Tests | Vitest or Jest, supertest, `mongodb-memory-server` using its replica-set mode |
| QR | `qrcode.react` to generate; `@capacitor-mlkit/barcode-scanning` on Android and a web scanner library on desktop. Verify the exact package names before installing |

Monorepo layout: `/server`, `/client`, `/docs`, `/tools` (asset scripts). A single root `README.md` explains setup in under 10 steps.

If you believe a different language or library is clearly better for a specific piece, say so in `DECISIONS.md` with the reason, but keep the stack above unless the user approves a change.

## 3. Source assets and the media pipeline (important)

The existing card assets are in two folders: one with **images**, one with **videos**. Assume they are under `D:\Bank Simulation\Cards` unless you find otherwise. **List the folders first and confirm what you find.** There are about 93 card images across 14 collections and **24 videos, each up to 150 MB**.

**Raw videos must never go into the app.** 24 videos at up to 150 MB could total about 3.6 GB, which would break the build and stutter on a phone. Build this pipeline in `/tools`:

1. Keep originals where they are. Never modify or copy originals into `/client` or `/server`. Add the source folders to `.gitignore`.
2. For each video, produce 4 quality tiers with ffmpeg, chosen by a user setting in the app (`Profile → Card animation: Off / Low / Mid / High / Max`, default Mid; Off shows poster only; defaults to Off on reduced motion):
   - **low**: 480x302, 24 fps, crf 27, preset slow, max file size 1.5 MB
   - **mid**: 720x454, 30 fps, crf 23, preset slow, max file size 4 MB
   - **high**: 1080x680, 30 fps, crf 21, preset medium, max file size 8 MB
   - **max**: 1440x908, 30 fps, crf 19, preset medium, max file size 14 MB (`-maxrate 12M -bufsize 24M`)
   - Command pattern (W, H, FPS, CRF, PRESET per tier; FX is horizontal crop focus 0 to 1 from `tools/crop-focus.json`, default 0.5):
     `ffmpeg -y -t 8 -i IN -an -vf "scale=W:H:force_original_aspect_ratio=increase,crop=W:H:(iw-W)*FX:(ih-H)*0.5,fps=FPS" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf CRF -preset PRESET -movflags +faststart OUT.mp4`
   - If a file exceeds its budget cap, raise CRF in steps of 2 and re-encode until it fits.
3. Extract a poster still from each video: `server/public/media/cards/posters/<id>.webp`, 1080 px wide (1080x680, 1.586:1 ratio), quality 85, taken at 30% duration.
4. Process GOAT's images to WebP, 1080 px wide (1080x680, 1.586:1 ratio), quality 85, in `server/public/media/cards/images/`.
5. Write `cards.manifest.json` with multi-tier `"videos": { "low": "...", "mid": "...", "high": "...", "max": "..." }` and an audit report listing every video tier, original size, output size, and any CRF adjustments.
6. Serve the processed media from Express static (`/media/cards/...`) with long cache headers, so the APK stays small. The base URL is configurable (`VITE_MEDIA_BASE_URL`).

**Image audit:** earlier generated card images may have a **chip symbol baked into the artwork**. This design has **no chip**. Scan the images, list every one that appears to contain a chip, and report them to the user. Do not edit or delete images automatically.

Cards that have an image but no video show the still image. Cards with a video show the video tier matching the user's Card Animation setting when focused (see section 7).

## 4. Design direction

- **Style:** clean, trustworthy, modern Indian-bank feel, light theme first. Calm surfaces, generous spacing, large readable balances. The cards are the only loud element; the interface around them stays quiet.
- **Theme setting:** Light (default), Dark, or System. Dark is a calm dark variant, not neon.
- **Typography for the app UI:** DM Sans (400 and 500 only). Currency in INR with Indian digit grouping (`Intl.NumberFormat('en-IN')`), for example ₹24,580.50.
- **Colours (light):** background `#F4F7FB`, text `#10243E`, secondary text `#5B6B80`, primary blue `#1B4F9C`, light blue tint `#E1ECFA`, border `#DDE5EF`, success `#0F7B4D`, danger `#B3261E`. Define all as CSS variables with a dark counterpart.
- **No colour clutter:** one primary blue, semantic colours only for success and error. No rainbow icon sets.
- **Cards** may be colourful; everything else is restrained.
- **Language:** plain verbs, sentence case, no exclamation marks in system copy, errors say what happened and what to do.

## 5. Navigation (the signature interaction)

### Sections
Five top-level sections: **Home, Cards, Pay, Passbook, Profile**. Send Money, Receive Money and Scan QR live inside **Pay**. Deposit and Withdraw are quick actions on Home that open bottom sheets.

### Mobile and tablet: floating glass bottom bar
A floating pill bar, inset from the screen edges, in the style of the Apple Music tab bar:
- A **liquid-glass bubble** sits behind the active tab.
- **Tap** a tab: the bubble springs to it.
- **Press and drag** anywhere on the bar: the bubble lifts slightly (scale about 1.1), follows the finger, and stretches slightly in the direction of travel based on velocity (squash and stretch, small amounts). Tabs it passes over highlight as a preview.
- **On release:** the bubble settles on the nearest tab, using velocity projection so a flick can carry it one tab further. It overshoots slightly and settles with a spring. Tune around stiffness 380, damping 28, mass 0.9.
- A short **haptic tick** each time the bubble crosses into a new tab (Capacitor Haptics on Android; skipped on web).
- The page changes when the bubble settles, with the transition in the next subsection.
- The bar sets `touch-action: none` on itself only, so dragging it never scrolls the page.
- Keyboard and screen readers: the bar is a `tablist`; arrow keys move between tabs; each tab has a visible focus ring and a label.

### Desktop: floating glass rail
A compact floating vertical rail on the left with the same bubble behaviour, dragged vertically with the mouse. Hovering expands labels. Same components, rotated axis.

### Page transitions
- Direction-aware horizontal slide (new page enters from the side matching the tab order), about 300 to 350 ms spring, slight fade and scale (0.98 to 1).
- Keep each section mounted so scroll position and form state survive switching.
- **The navigation bar must never sit inside an element that is transformed, faded or filtered.** It is a sibling placed above the animated page container (see section 8).

### Swipe between sections (touch devices only)
- **Enabled** on Home, Passbook and Profile when the gesture starts at least 24 px from the screen edge (so it does not fight Android's system back gesture) and the horizontal movement is clearly dominant (axis lock, for example horizontal at least 1.5 times vertical).
- **Disabled** on: Pay (QR scanner and forms), the Cards carousel (swiping there changes the card), any screen with a focused input, any open sheet or modal, and any area that scrolls horizontally.
- Mouse drag between pages is **not** supported on desktop (it clashes with text selection). Desktop uses the rail, the keyboard (left and right arrows and number keys 1 to 5 when no input is focused) and animated transitions.
- Android back button: close the top sheet or modal first, then return to Home, then exit.

### Pay section
Inside Pay, a segmented control (Send, Receive, Scan) with a small sliding glass pill, using the same bubble component at a smaller size.

## 6. Screens

**Onboarding**
1. Welcome: logo, one-line pitch, the simulation notice, "Create account" and "Log in".
2. Register: full name, date of birth, phone number, optional nationality. Validate on server and client: minimum age **16** (configurable), phone in E.164 format, phone unique.
3. OTP verification (section 10).
4. Set a **6-digit PIN**. It is used to log in and to confirm transfers.
5. Choose a card (the Cards catalog in a first-run mode).
6. Account created: account number, starting demo balance (default ₹10,000, configurable), "Go to Home".

**Log in:** phone number and PIN. Rate-limited. OTP is used at registration and PIN reset only.

**Home:** greeting, available balance, selected card (compact), quick actions (Send, Deposit, Withdraw, History), the last five transactions with "See all" opening Passbook.

**Cards:** hero carousel of the selected card with tap-to-reveal card number; "Change design" opens the catalog. Catalog: category chips, search, grid of poster images, tap to preview in a larger view, "Use this card" confirms. A user has exactly one active card.

**Pay:** Send, Receive, Scan.
- Send: pick a recipient by phone number or account number (or arriving from a QR scan), enter amount and optional note, review screen showing the recipient's name (resolved by the server), enter PIN, result screen with reference ID.
- Receive: the user's name, account number and a QR code; a "Copy account number" action.
- Scan: full-screen camera view, permission handling with a clear explanation if denied, torch toggle if available, then goes to the Send review screen with the recipient pre-filled.

**Passbook:** all deposits, withdrawals and transfers (sent and received), date, amount, running balance, status (Success or Failed), reference ID. Filter chips (All, Money in, Money out), pagination or infinite scroll. Tapping a row opens a detail sheet.

**Profile:** personal details, account number, theme setting, **Glass effects setting**, motion setting, **Card animation setting (Off / Low / Mid / High / Max; default Mid; replaces video autoplay toggle)**, haptics setting, change PIN, log out, the simulation notice.

## 7. Virtual cards

### Card face
- Aspect ratio **1.586:1**. The video (or image) fills the whole face edge to edge using `object-fit: cover`. No distortion, no side panels, no gaps.
- **No chip, no chip icon, no dark strip or scrim behind the text.**
- Only two text items on the face: the **bank name "NovaBank"** and the **card number**. The card number is shown masked by default (`•••• •••• •••• 4821`) with a tap-to-reveal control; the revealed number is a fictional demo number. Generate demo numbers with a prefix that is not a real card network prefix (for example 9000) and never present them as real.
- **Readability without a strip:** because there is no scrim, every card carries its own text styling in the manifest: `textColor`, a layered `textShadow` or outline, `letterSpacing`, size, and position. When the user sees a card with unreadable text in testing, the fix is to adjust that card's manifest entry, not to add a strip.

### Fonts per card (hard requirement)
Every card category has its own theme-matched font, and any card can override it. The user wants official or theme fonts where they exist. Because the agent cannot reliably download those, do this:
1. Create `client/public/fonts/` and use a font file there if the user has placed one (for example a Naruto-style font for Naruto cards).
2. If a file is missing, use the free Google Fonts fallback below, self-hosted or loaded from Google Fonts, and list every missing theme font in a report so the user can add them later.

| Category | Default fallback |
|---|---|
| Gaming | Orbitron or Rajdhani (Minecraft: Press Start 2P or VT323; GTA: Anton) |
| Coding | JetBrains Mono, Fira Code (Matrix: VT323 or Share Tech Mono) |
| Designer / video editor | Space Grotesk, Syne |
| AI / tech | Exo 2, Orbitron |
| Anime | Bangers or Permanent Marker, with per-card overrides (One Piece: Rye; Solo Leveling: Cinzel) |
| IPL | Oswald or Bebas Neue |
| Football | Teko or Oswald |
| Sports personalities | Bebas Neue or Anton |
| TFI / Telugu cinema | Anton or Bebas Neue |
| Music, soundwave, vinyl | Syne, Righteous, Space Grotesk |
| Minimalist | DM Sans or Inter |
| Girls' style | Pacifico or Playfair Display italic |
| Luxury | Cinzel or Cormorant Garamond |
| Space / sci-fi | Orbitron or Exo 2 |

The card number must use the card's own theme font (`fontFamily` from manifest) by default, retaining `font-variant-numeric: tabular-nums` and letter spacing. The manifest defines an explicit `numberFont` override (e.g. `Orbitron, sans-serif`) for decorative or pixel fonts (such as 'Press Start 2P' on Gaming cards) where digits are illegible at phone scale.

### Manifest
`cards.manifest.json`, one entry per card: `id`, `name`, `category`, `image`, `videos` (`{ "low": "...", "mid": "...", "high": "...", "max": "..." }`), `poster`, `fontFamily`, `fontFile` (optional), `numberFont` (optional), `textColor`, `textShadow`, `letterSpacing`, `textPosition`, `objectPosition`. The server serves it, and the UI is driven entirely by it.

### Playback rules
- Videos are `muted`, `playsInline`, `loop`, `preload="metadata"`.
- **Only the focused card plays.** At most two videos play at once anywhere. Pause videos that scroll off screen (IntersectionObserver) and when the app goes to the background.
- Client selects video quality tier according to user's Card Animation setting (`low`, `mid`, `high`, `max`). If a tier fails to load, fall back to the next lower tier, then to poster.
- Use the poster image instead of video when: Card Animation is "Off", reduced motion is on, the video fails to load, the device reports data saver, or the glass auto-mode has dropped to Lite.
- Do not use CSS blur or filters on a playing video.

## 8. Liquid glass (the part that failed before)

Previous attempts at glass produced no visible effect, so this section is explicit and must be **verified visually**.

### The `GlassSurface` component
One reusable component used for the nav bar, the rail, bottom sheets' headers, the segmented control and the bubble. Mode comes from `data-glass="full|lite|off"` on `<html>`.

**Full:**
- `backdrop-filter: blur(22px) saturate(180%)` with the `-webkit-` prefix too
- background `rgba(255,255,255,0.28)` (dark theme: `rgba(20,24,32,0.35)`)
- border `1px solid rgba(255,255,255,0.55)`
- inset highlight on the top edge and a faint inner glow, plus a soft outer shadow
- the bubble: lighter fill (`rgba(255,255,255,0.5)`), a bright border and a small specular highlight

**Lite:** no blur. Background about 82% opaque white or dark, same border and shadow.

**Off:** solid surface colour, no transparency.

### Settings
Profile → "Glass effects": **Auto** (default), **Full**, **Lite**, **Off**. Auto starts with Full on capable devices and measures frame times during the first seconds of navigation; if the average frame time is above about 24 ms it switches to Lite and shows a small notice. If `backdrop-filter` is unsupported (`CSS.supports`), use Lite. Respect `prefers-reduced-transparency` if the browser supports it.

### Performance budget (the test phone is a Vivo V29)
- At most 3 elements with `backdrop-filter` on screen at once.
- Blur radius 24 px or less.
- Never blur a full-screen area. Only the small glass components.
- The BitChord Android app feels smooth because it uses native GPU blur. A WebView will not automatically match it. This is why Lite and Off exist.

### Why backdrop-filter silently fails (check every one)
1. Nothing visually rich is behind the glass. A solid background gives nothing to blur. The page content must scroll underneath the bar, so give the scroll container bottom padding and let it extend beneath the bar.
2. An ancestor of the glass element has `opacity` below 1, `filter`, `mask`, `clip-path`, `mix-blend-mode`, or an animated `transform`. These create a "backdrop root" and limit or disable what is blurred. **The nav bar must be a sibling of the animated page container, never inside it.**
3. Only the unprefixed property was set. Set both `backdrop-filter` and `-webkit-backdrop-filter`.
4. Tailwind classes were purged or mistyped. Prefer a plain CSS class for `GlassSurface`.
5. The background colour is nearly opaque. Keep it under about 0.4 alpha in Full mode.

### Verification (mandatory)
Build a `/dev/glass-test` page that puts the nav bar over a colourful scrolling pattern. Open it in the browser, take a screenshot, and confirm the pattern behind the bar is visibly blurred and the bubble looks like glass. Attach the screenshot to the phase report. If it does not blur, debug using the list above before continuing. This is a **GATE**.

## 9. Responsive behaviour

| Width | Navigation | Layout |
|---|---|---|
| Under 640 px | floating glass bottom bar | single column, bottom sheets for actions |
| 640 to 1024 px | floating glass bottom bar (wider, centred, max 520 px) | one or two columns, modals for actions |
| Over 1024 px | floating glass left rail | two-column dashboard, content max width about 1100 px, modals for actions |

Touch targets at least 44 px. Test at 360, 412, 768, 1024 and 1440 px widths.

## 10. Backend and data

**Money:** store all amounts as **integer paise**. Never use floats for money.

**Collections**
- `users`: name, dateOfBirth, phone (unique), nationality (optional), pinHash, accountNumber (unique, format `NB` plus 10 digits), selectedCardId, settings, createdAt.
- `accounts`: userId, balancePaise, createdAt. (May be folded into `users` if simpler; record the decision.)
- `transactions`: userId, type (`deposit`, `withdrawal`, `transfer_out`, `transfer_in`), amountPaise, balanceAfterPaise, counterpartyUserId (optional), note, status (`success`, `failed`), failureReason, referenceId (unique), transferId (shared by the two sides of a transfer), idempotencyKey, createdAt. Index on (userId, createdAt) and a unique index on (userId, idempotencyKey).
- `otps`: phone, codeHash, expiresAt (TTL index, 5 minutes), attempts.

**Simulated OTP:** real SMS costs money, so in simulation mode the server generates a 6-digit code, stores only its hash, prints the code in the server console, and returns it to the app as `devOtp` **only** when `SIMULATION_MODE=true` and `NODE_ENV=development`. The app shows it in a clearly labelled "Demo OTP" banner. Maximum 5 attempts, 5-minute expiry, rate-limited. Document in the README how a real SMS provider could replace this.

**Transfers** (`POST /api/transfers`: recipient, amountPaise, note, pin, idempotencyKey):
1. Validate input, verify the PIN, reject self-transfer, enforce limits (minimum ₹1, maximum ₹50,000 per transfer, ₹1,00,000 per day, all configurable).
2. Run in one **MongoDB transaction** (a session): debit the sender with a conditional update (`balancePaise >= amount`), credit the receiver, write both transaction records sharing a `transferId`.
3. A repeated `idempotencyKey` returns the original result and does not move money again.
4. Failed attempts are recorded with a reason where useful (insufficient balance, wrong PIN) without leaking sensitive details.

**Deposit and withdraw (demo):** deposit adds demo money (maximum ₹50,000 per action, daily cap), withdraw removes it (cannot exceed the balance). Both create transaction records.

**Core endpoints (the planner may refine):** `POST /auth/register`, `/auth/otp/request`, `/auth/otp/verify`, `/auth/pin`, `/auth/login`, `/auth/refresh`, `/auth/logout`; `GET /me`, `PATCH /me/settings`, `PATCH /me/card`; `GET /accounts/lookup?phone=|account=` (returns the recipient's display name only); `POST /transfers`, `POST /deposits`, `POST /withdrawals`; `GET /transactions`, `GET /transactions/:id`; `GET /cards` (the manifest).

**Security basics:** helmet, CORS allow-list, rate limits on login, OTP and transfers, zod validation, hashed PINs and OTPs, no secrets in the repo (`.env.example` only), generic error messages, no logging of PINs or tokens. Collect only name, date of birth, phone and optional nationality.

**Tests (must exist and pass):** registration age rule, OTP expiry and attempts, login, transfer success, insufficient balance, idempotent retry, self-transfer rejection, and a **concurrency test** where two simultaneous transfers cannot overdraw the account (use the in-memory replica set).

## 11. Android packaging (Capacitor)

- App id suggestion `com.novabank.sim`; name "NovaBank".
- Plugins to evaluate (verify current names): App (back button), Haptics, Status Bar, Splash Screen, and an ML Kit barcode scanner for QR.
- Local development against a laptop server needs the phone and laptop on the same Wi-Fi, the API base URL set to the laptop's LAN IP (or the emulator address `10.0.2.2`), and **cleartext HTTP allowed in debug builds only**. Android blocks plain HTTP by default. For a final demo, prefer deploying the backend (for example a free tier host) with HTTPS.
- Store tokens securely, not in plain localStorage if a secure storage option is available.
- Confirm on a real device (Vivo V29) that muted video autoplays and that `backdrop-filter` renders; record results in the phase report.
- Provide the exact commands to build a debug APK and where the file ends up.

## 12. Accessibility and motion

- Text contrast of at least 4.5:1 on every surface, including text over glass. If a glass surface fails contrast, increase its opacity automatically.
- Visible focus states, labels on all icon buttons, semantic roles for the tab bar and segmented controls, form errors announced.
- Respect reduced motion: no squash and stretch, no spring overshoot (instant or short fades), card videos replaced by posters.
- Layouts must survive larger system font sizes.
- Never rely on colour alone to show success or failure.

## 13. Build phases

0. **Asset audit and media pipeline** (section 3): folder report, chip audit, transcoded loops, posters, manifest. GATE: user reviews the report.
1. **Server foundation:** project setup, Mongo connection, models, config, health route, tests harness.
2. **Auth:** register, simulated OTP, PIN, login, refresh, rate limits, tests.
3. **Banking core:** accounts, deposit, withdraw, transfer with transactions and idempotency, passbook endpoints, tests including concurrency.
4. **Client shell and glass navigation:** theme tokens, `GlassSurface`, bottom bar, rail, draggable bubble, page transitions, Glass effects setting, `/dev/glass-test`. **GATE: the user approves the glass and drag behaviour from a screen recording or screenshots before anything else is built on top of it.**
5. **Screens:** onboarding, Home, Pay (Send, Receive, Scan), Passbook, Profile, all wired to the API.
6. **Cards:** card component, per-category fonts, catalog and selection, playback rules. **GATE: the user reviews the cards on desktop and phone sizes.**
7. **Android:** Capacitor setup, plugins, debug APK, on-device checks.
8. **Polish and delivery:** accessibility pass, reduced-motion pass, empty and error states, README with architecture diagram, API list, setup steps and screenshots, final test run.

## 14. Risks the planner must address in RISKS.md

1. **Video size and playback load:** raw files are far too large; the pipeline in section 3 is mandatory.
2. **Glass performance on a mid-range phone in a WebView:** Auto mode, Lite, Off, and the performance budget.
3. **Glass failing silently:** the checklist and the screenshot gate.
4. **MongoDB transactions need a replica set:** use Atlas or a local replica set; the tests must prove atomicity.
5. **Chip symbols baked into existing card images** conflict with the no-chip rule.
6. **Theme fonts are not available as files yet:** fallbacks and a missing-font report.
7. **Text readability on busy video without a scrim:** per-card text styling in the manifest.
8. **Android cleartext HTTP, camera permissions, and LAN access** during development.
9. **Gesture conflicts** (Android back gesture, horizontal carousels, forms, scanner): the enable and disable rules in section 5.
10. **The BitChord reference** is a native Android app under the GPL-3.0 licence. Use it only as a behavioural reference for how translucent bars and navigation should feel. **Do not copy its code.**

## 15. Out of scope

Loans, investments, insurance, trading, credit scores, rewards, real payments, real bank-account linking, real SMS delivery, real KYC, and any feature not listed above. Do not add menu items beyond the five sections.

## 16. Definition of done

- All tests pass, including the concurrency test.
- The website works at all listed breakpoints and the debug APK installs and runs on the Vivo V29.
- The glass bar visibly blurs content and the bubble can be dragged between tabs smoothly; the user approved it at the Phase 4 gate.
- Each card category uses its own font; no card shows a chip; every card shows only the bank name and card number.
- Card videos are compressed loops, play only when focused, and fall back to posters.
- The README lets a classmate run the project from scratch.
