# NovaBank — Missing Fonts & Typography Report

This document reports on the typography integration for all card categories in NovaBank, detailing the spec's intended theme aesthetic, the corresponding self-hosted `@fontsource` packages bundled in the client, and whether custom font files were placed in `client/public/fonts/`.

## Category Typography Table

| Category | Spec Ideal Theme Font | Self-Hosted `@fontsource` Package | Fallback CSS Family | Custom `fontFile` Present? | Number Font Override | Status |
|---|---|---|---|---|---|---|
| **Abstract** | Futuristic Geometric / Sci-Fi | `@fontsource/orbitron` | `Orbitron, sans-serif` | No (`null`) | `DM Sans, sans-serif` | ✅ Self-hosted active |
| **Cars** | High-Velocity Heavy Display | `@fontsource/anton` | `Anton, sans-serif` | No (`null`) | `DM Sans, sans-serif` | ✅ Self-hosted active |
| **Gaming** | 8-Bit Retro & Arcade Pixel | `@fontsource/press-start-2p` | `"Press Start 2P", monospace` | No (`null`) | `DM Sans, sans-serif` | ✅ Self-hosted active |
| **Anime** | Comic Manga Brush / Action | `@fontsource/bangers` | `Bangers, sans-serif` | No (`null`) | `DM Sans, sans-serif` | ✅ Self-hosted active |
| **Superheroes** | Cinematic Gothic / Blockbuster | `@fontsource/cinzel` | `Cinzel, serif` | No (`null`) | `DM Sans, sans-serif` | ✅ Self-hosted active |
| **Sports Legends (GOAT's)** | Bold Athletic Headline | `@fontsource/bebas-neue` | `"Bebas Neue", sans-serif` | No (`null`) | `DM Sans, sans-serif` | ✅ Self-hosted active |

## Notes on Implementation
1. **Zero External CDN Calls**: All fonts are bundled directly into the Vite build assets via `@fontsource/*` packages. No external network requests to Google Fonts CDN are made at runtime.
2. **Number Font Legibility**: Because decorative fonts (such as *Press Start 2P* or *Cinzel*) can degrade the readability of 16-digit card numbers on small phone displays, every card specifies `numberFont: "DM Sans, sans-serif"` with `tabular-nums` alignment, guaranteeing crisp numerical readability regardless of the card art theme.
3. **Custom Font Support**: Should custom font files (`.woff2`, `.ttf`) be added to `client/public/fonts/`, `client/src/utils/loadCardFont.js` includes a dynamic `FontFace` loader that injects them automatically when referenced in the manifest.
