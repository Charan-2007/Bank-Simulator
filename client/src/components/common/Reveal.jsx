import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import {
  prefersReducedMotion,
  hasRevealed,
  markRevealed,
  revealContainerVariants,
  revealItemVariants
} from '../../utils/motion.js';

export default function Reveal({
  children,
  sectionKey,
  className = '',
  as = 'div'
}) {
  const isReduced = useMemo(() => prefersReducedMotion(), []);
  const alreadyRevealed = useMemo(() => {
    if (!sectionKey) return false;
    return hasRevealed(sectionKey);
  }, [sectionKey]);

  if (alreadyRevealed) {
    return <div className={className}>{children}</div>;
  }

  const MotionComponent = motion[as] || motion.div;

  return (
    <MotionComponent
      initial="hidden"
      animate="visible"
      variants={revealItemVariants}
      custom={isReduced}
      onAnimationComplete={() => {
        if (sectionKey) markRevealed(sectionKey);
      }}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
