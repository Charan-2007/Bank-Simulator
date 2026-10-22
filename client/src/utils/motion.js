/**
 * Motion utilities and reveal presets
 */

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

const revealedSections = new Set();

export function hasRevealed(sectionKey) {
  if (typeof window === 'undefined') return true;
  return revealedSections.has(sectionKey);
}

export function markRevealed(sectionKey) {
  revealedSections.add(sectionKey);
}

export const revealContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05
    }
  }
};

export const revealItemVariants = {
  hidden: (reduced = false) => ({
    opacity: 0,
    y: reduced ? 0 : 24,
    filter: reduced ? 'none' : 'blur(10px)'
  }),
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1]
    }
  }
};
