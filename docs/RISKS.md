# NovaBank — Risk Register

Each risk from section 14 of the master prompt, with its mitigation strategy.

---

## R-01: Video size and playback load

**Risk:** The 24 raw source videos total ~1,294 MB (up to 138 MB each). Bundling them into the app would break the build, balloon the APK, and stutter on mobile.

**Probability:** Certain (if unmitigated)

**Impact:** Critical — app unusable on phones

**Mitigation:**
1. **Never copy raw videos into `/client` or `/server`.** Source folders are in `.gitignore`.
2. **Transcode with ffmpeg across 4 quality tiers** (`tools/transcode-videos.js`):
   - `low`: 480x302, 24 fps, crf 27, preset slow, max file size 1.5 MB
   - `mid`: 720x454, 30 fps, crf 23, preset slow, max file size 4 MB
   - `high`: 1080x680, 30 fps, crf 21, preset medium, max file size 8 MB
   - `max`: 1440x908, 30 fps, crf 19, preset medium, max file size 14 MB (`-maxrate 12M -bufsize 24M`)
   - 8-second loops, no audio, H.264 high profile.
   - If any tier exceeds its budget cap, CRF is incremented in steps of 2 until it fits.
3. **Serve from Express static** with long cache headers. Media is fetched over the network, not bundled in the APK.
4. **Card animation setting & Poster fallback:** User can configure `Profile → Card animation` (Off / Low / Mid / High / Max; default Mid; Off shows poster only; defaults to Off on reduced motion). Every video has a 1080px wide WebP poster extracted at ~30% duration. Used when: Card animation is Off, reduced motion, video error, data saver mode, or Lite glass.
5. **Playback rules:** only the focused card plays; max 2 videos at once; IntersectionObserver pauses off-screen; Page Visibility API pauses in background.
6. **Audit report** (`tools/audit-report.js`) lists every video tier, original size, output size, and any CRF adjustments.

---

## R-02: Glass performance on mid-range phone in WebView

**Risk:** `backdrop-filter: blur()` is GPU-intensive. On a Vivo V29 running in a WebView (not native GPU compositing), it may cause jank, dropped frames, or battery drain.

**Probability:** High — web blur is inherently more expensive than native

**Impact:** High — poor UX on the target device

**Mitigation:**
1. **Auto mode:** Start with Full glass. Measure frame times during the first 3 seconds of navigation using `requestAnimationFrame` timestamps.
2. **Threshold:** If average frame time > 24ms (~42fps), downgrade to Lite and show a small notice.
3. **Lite mode:** Same visual style (border, shadow, rounded corners) but no `backdrop-filter`. Background at ~85% opacity.
4. **Off mode:** Solid colours, no transparency.
5. **Performance budget:** max 3 `backdrop-filter` elements on screen, blur ≤ 24px, never blur full-screen.
6. **User override:** Profile → Glass effects → Auto / Full / Lite / Off.
7. **Respect `prefers-reduced-transparency`** if the browser supports it.

---

## R-03: Glass failing silently

**Risk:** `backdrop-filter` can silently produce no visible effect due to several CSS/DOM conditions. Previous attempts produced no blur.

**Probability:** High — this has happened before in this project

**Impact:** High — the signature visual feature is invisible

**Mitigation (the checklist):**
1. ✅ **Background behind the glass must be visually rich.** Scroll content extends behind the bar (bottom padding on scroll container). A solid background gives nothing to blur.
2. ✅ **No ancestor has `opacity < 1`, `filter`, `mask`, `clip-path`, `mix-blend-mode`, or animated `transform`.** These create a "backdrop root" that limits blur. **The nav bar is a sibling of the animated page container, never inside it.**
3. ✅ **Set both `backdrop-filter` AND `-webkit-backdrop-filter`.** Safari and older Chrome need the prefix.
4. ✅ **Use a plain CSS class, not Tailwind utility classes** for GlassSurface (`.glass-surface`, `.nav`, `.bubble`). Avoids purging issues.
5. ✅ **Background alpha under 0.4** in Full mode (`rgba(255,255,255,0.34)`). A nearly opaque background hides the blur.
6. ✅ **`/dev/glass-test` verification page.** Renders the nav bar over a colorful scrolling pattern. Screenshot required before Phase 4 gate.
7. ✅ **Gate:** The user must approve the glass effect from a screenshot/recording before any screens are built on top of it.

---

## R-04: MongoDB transactions need a replica set

**Risk:** MongoDB transactions (`session.withTransaction()`) require a replica set. A standalone `mongod` silently refuses transactions, causing transfers to fail.

**Probability:** Certain — this is a MongoDB requirement

**Impact:** Critical — transfers, the core feature, don't work

**Mitigation:**
1. **Production/dev:** Use **MongoDB Atlas free tier**, which is always an M0 replica set. Document cluster setup, IP allow-list (`0.0.0.0/0` in dev), user creation, and URI configuration in README.
2. **Tests:** Use `mongodb-memory-server` with its **replica-set mode** (`MongoMemoryReplSet`). The test setup file (`server/tests/setup.js`) explicitly starts a replica set.
3. **Concurrency test** (`server/tests/concurrency.test.js`): Two simultaneous transfers from the same account that would overdraw must result in one success and one failure — proving the transaction's conditional update works.
4. **README** documents that a standalone `mongod` is not supported.

---

## R-05: Chip symbols on virtual cards

**Risk:** Any chip symbol appearing in card artwork or the UI contradicts NovaBank's pure digital, no-chip design direction.

**Probability:** Mitigated — the user confirmed that no existing card image contains a chip, and no card in NovaBank may ever show a chip. Do not rely on `phase0_audit.md` (it was not found). Legacy images are not "flagged" or in need of chip repair.

**Impact:** Medium — visual inconsistency, confusing for a card that is explicitly chip-less.

**Mitigation:**
1. **Verification step in T-0.5:** The agent views every card image. If any image shows a chip, it excludes that card from `cards.manifest.json` and lists it in `docs/chip-audit-report.md`.
2. **Never delete or edit images:** The agent leaves source image files completely untouched.
3. **No `chipAudit` manifest field:** The manifest stays clean with no chip-audit metadata.
4. **Narrowed chip check for card face:** The ban applies specifically to the card face. `CardFace.jsx`, card CSS, and card assets must contain no chip element, SVG, or icon. Category and transaction filters are named "filters" across all UI code and documentation to eliminate naming collisions.
5. **Automated verification check in T-6.2:** A targeted search across `CardFace.jsx`, card CSS, and card assets validates zero occurrences of "chip" elements, SVGs, classes, or icons.

---

## R-06: Theme fonts not available as files

**Risk:** The spec requires per-category fonts (Naruto font, One Piece font, etc.). Official/theme fonts are not freely downloadable and may not exist as web fonts.

**Probability:** High — most anime/game franchise fonts are not on Google Fonts

**Impact:** Medium — cards look generic instead of themed

**Mitigation:**
1. **Self-hosted `@fontsource` fallback packages:** Each category maps to a modular `@fontsource/*` package bundled locally via Vite, avoiding external CDN network dependencies.
2. **`client/public/fonts/` directory:** If the user places a custom `.woff2`/`.ttf` file there and names it in the manifest's `fontFile` field, it loads via `@font-face` override.
3. **Missing-font report:** `tools/build-manifest.js` and `docs/missing-fonts-report.md` list every card whose `fontFile` is null, meaning it uses the `@fontsource` fallback.
4. **`numberFont` override:** For decorative fonts whose digits are hard to read, the manifest specifies a separate `numberFont` (default: DM Sans) for the card number.

---

## R-07: Text readability on busy video without a scrim

**Risk:** The spec forbids a dark scrim/strip behind card text. On busy, bright, or high-contrast video backgrounds, white text may be unreadable.

**Probability:** High — some videos are very busy

**Impact:** Medium — poor UX on specific cards

**Mitigation:**
1. **Per-card `textShadow` in the manifest:** A layered shadow (e.g., `0 2px 8px rgba(0,0,0,0.7), 0 0 4px rgba(0,0,0,0.5)`) provides a soft halo without a visible strip.
2. **Per-card `textColor`:** Most cards use white, but dark-background cards can use a light colour.
3. **`letterSpacing`:** Increased spacing improves readability on busy backgrounds.
4. **`textPosition`:** Positions text in calmer areas of the card (configurable per card).
5. **User testing:** At the Phase 6 gate, the user reviews every card category on desktop and phone sizes. Unreadable cards get their manifest entry adjusted.

---

## R-08: Android cleartext HTTP, camera permissions, and LAN access

**Risk:** Android blocks cleartext HTTP by default. Camera permissions are required for QR scanning. LAN access requires the phone and laptop on the same Wi-Fi.

**Probability:** Certain — these are Android platform behaviours

**Impact:** Medium — dev workflow blocked if not configured

**Mitigation:**
1. **Cleartext HTTP & Network Security Config:** Add `android:usesCleartextTraffic="true"` in `AndroidManifest.xml` for debug builds **only**. Document `res/xml/network_security_config.xml` permitting cleartext to local LAN IP addresses.
2. **Android Scheme & Mixed-Content (Debug Builds):** Configure `server.androidScheme: 'http'` in `capacitor.config.ts` during debug to avoid mixed-content blocking when accessing local HTTP backend, or enable `mixedContentMode: 'always'` on WebView. For production, use HTTPS.
3. **Live-Reload vs Production APK:** Explicitly document setting `server.url` in `capacitor.config.ts` for live-reload development vs commenting it out for building standalone production APKs with bundled assets.
4. **Camera permissions:** Declare `<uses-permission android:name="android.permission.CAMERA" />` in the manifest. The Scan screen handles runtime permission requests with clear explanations if denied.
5. **LAN access & Base URLs:** Configure `VITE_API_BASE_URL` and `VITE_MEDIA_BASE_URL` to point to laptop LAN IP (`http://<laptop-LAN-IP>:3000`) or emulator host (`http://10.0.2.2:3000`).
6. **CORS Allow-List:** Express CORS middleware includes Capacitor origins (`capacitor://localhost`, `http://localhost`, and local LAN dev URLs).

---

## R-09: Gesture conflicts

**Risk:** Multiple gesture systems compete: Android back gesture (edge swipe), card carousel (horizontal swipe), QR scanner (camera area), form inputs (keyboard), and section-switching swipe.

**Probability:** Certain — touch events are inherently ambiguous

**Impact:** Medium — frustrating UX if gestures misfire

**Mitigation:**
1. **24px edge dead zone:** Section swipe ignores gestures starting within 24px of the screen edge (Android back gesture territory).
2. **Axis locking:** Section swipe only activates when horizontal movement ≥ 1.5× vertical.
3. **Disable list:** Section swipe is disabled on:
   - Cards screen (carousel conflict)
   - Pay screen (QR scanner + forms)
   - Any screen with a focused input
   - Any open bottom sheet or modal
   - Any horizontally-scrolling area
4. **Sequential swipe order (Override):** Touch navigation steps one tab at a time following bottom bar adjacency (`Home`, `Cards`, `Pay`, `Passbook`, `Profile`). A swipe can START only on `Home` (left to Cards), `Passbook` (right to Pay, left to Profile), and `Profile` (right to Passbook); starting on Cards, Pay, forms, or sheets is disabled.
5. **No mouse-drag** between sections on desktop (text selection conflict). Desktop uses rail, keyboard (arrow keys, number keys 1-5).
6. **Android back button:** Close top sheet/modal → return to Home → exit app (via Capacitor App plugin).
7. **`touch-action: none`** on the nav bar only, not on the page.

---

## R-10: The BitChord reference is GPL-3.0

**Risk:** The spec mentions BitChord as a behavioral reference for translucent bars. BitChord is a native Android app under GPL-3.0. Copying its code would impose GPL on the entire project.

**Probability:** Low (with mitigation)

**Impact:** Critical — licence contamination of a college project

**Mitigation:**
1. **Do not read, clone, or reference BitChord's source code.** It is a behavioural inspiration only.
2. **All glass and navigation code is written from scratch** based on the spec's explicit CSS values and spring constants.
3. **No BitChord assets, icons, or design elements** are used.
4. This decision is recorded here as an explicit guardrail for the builder.
