import React, { useState, useEffect } from 'react';
import { subscribeServerWaking } from '../../api/client.js';

export default function WakeUpBanner() {
  const [isWaking, setIsWaking] = useState(false);

  useEffect(() => {
    return subscribeServerWaking((waking) => {
      setIsWaking(waking);
    });
  }, []);

  if (!isWaking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-300"
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[var(--surface-subtle)]/90 backdrop-blur-md border border-[var(--border)] shadow-lg text-[var(--text-main)] text-xs font-medium animate-pulse">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
        <span>Waking up the server (free hosting, up to a minute)...</span>
      </div>
    </div>
  );
}
