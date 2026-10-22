import React from 'react';
import { motion } from 'motion/react';

export function GlassBubble({
  rect,
  isDragging = false,
  dragOffset = 0,
  velocity = 0,
  orientation = 'horizontal',
  debug = false
}) {
  if (!rect) return null;

  const springConfig = {
    type: 'spring',
    stiffness: 380,
    damping: 28,
    mass: 0.9
  };

  // Compute squash and stretch based on drag velocity
  const absVel = Math.min(Math.abs(velocity), 15);
  const stretch = 1 + (absVel * 0.025);
  const squash = 1 - (absVel * 0.015);

  const scaleX = isDragging
    ? (orientation === 'horizontal' ? stretch * 1.05 : squash * 1.05)
    : 1;

  const scaleY = isDragging
    ? (orientation === 'vertical' ? stretch * 1.05 : squash * 1.05)
    : 1;

  const targetX = orientation === 'horizontal'
    ? rect.x + (isDragging ? dragOffset : 0)
    : rect.x;

  const targetY = orientation === 'vertical'
    ? rect.y + (isDragging ? dragOffset : 0)
    : rect.y;

  return (
    <motion.div
      id="glass-bubble-element"
      className="bubble absolute pointer-events-none rounded-[20px] z-0"
      style={{
        top: 0,
        left: 0,
        margin: 0,
        outline: debug ? '1.5px solid #00f0ff' : 'none'
      }}
      initial={false}
      animate={{
        x: targetX,
        y: targetY,
        width: rect.width,
        height: rect.height,
        scaleX,
        scaleY,
        scale: isDragging ? 1.06 : 1
      }}
      transition={isDragging ? { duration: 0 } : springConfig}
    />
  );
}

export default GlassBubble;
