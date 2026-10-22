/**
 * Self-hosted font loader using @fontsource packages.
 * No external Google Fonts CDN or network requests are needed.
 */
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/orbitron/400.css';
import '@fontsource/orbitron/700.css';
import '@fontsource/anton/400.css';
import '@fontsource/press-start-2p/400.css';
import '@fontsource/bangers/400.css';
import '@fontsource/cinzel/400.css';
import '@fontsource/cinzel/700.css';
import '@fontsource/bebas-neue/400.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/syne/700.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/exo-2/600.css';
import '@fontsource/jetbrains-mono/400.css';

const loadedCustomFonts = new Set();

/**
 * Dynamically loads custom font file from public/fonts/ if specified in manifest.
 */
export function ensureCustomFont(fontName, fontFilePath) {
  if (!fontFilePath || loadedCustomFonts.has(fontName) || typeof document === 'undefined') {
    return;
  }

  try {
    const fontFace = new FontFace(fontName, `url(${fontFilePath})`);
    fontFace.load().then((loaded) => {
      document.fonts.add(loaded);
      loadedCustomFonts.add(fontName);
    }).catch((err) => {
      console.warn(`Could not load custom font ${fontName}:`, err);
    });
  } catch (e) {
    // browser font loading api fallback
  }
}

export default {
  ensureCustomFont
};
