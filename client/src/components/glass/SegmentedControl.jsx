import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';

export default function SegmentedControl({
  segments = [],
  activeId,
  onChange,
  className = ''
}) {
  const containerRef = useRef(null);
  const [bubbleStyle, setBubbleStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const activeEl = containerRef.current.querySelector(`[data-segment-id="${activeId}"]`);
    if (activeEl) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const activeRect = activeEl.getBoundingClientRect();
      setBubbleStyle({
        left: activeRect.left - containerRect.left,
        width: activeRect.width
      });
    }
  }, [activeId, segments]);

  return (
    <div
      ref={containerRef}
      className={`relative flex items-center p-1 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] shadow-xs ${className}`}
      role="tablist"
    >
      {/* Animated active pill */}
      <motion.div
        animate={{
          left: bubbleStyle.left,
          width: bubbleStyle.width
        }}
        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
        className="absolute top-1 bottom-1 rounded-xl bg-[var(--surface)] shadow-sm border border-[var(--border-subtle)] pointer-events-none"
      />

      {segments.map((seg) => {
        const isActive = seg.id === activeId;
        return (
          <button
            key={seg.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-segment-id={seg.id}
            onClick={() => onChange(seg.id)}
            className={`relative z-10 flex-1 py-2 text-center text-xs sm:text-sm font-semibold rounded-xl transition-colors duration-150 cursor-pointer ${
              isActive
                ? 'text-[#1b4f9c] dark:text-blue-400 font-bold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            }`}
          >
            {seg.label}
          </button>
        );
      })}
    </div>
  );
}
