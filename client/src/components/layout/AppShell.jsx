import React, { useState, useRef } from 'react';
import BottomBar from '../glass/BottomBar.jsx';
import SideRail from '../glass/SideRail.jsx';
import PageTransition from './PageTransition.jsx';
import useSwipe from '../../hooks/useSwipe.js';
import useMediaQuery from '../../hooks/useMediaQuery.js';

export function AppShell({ activeIndex: controlledIndex, onTabChange, children }) {
  const [internalIndex, setInternalIndex] = useState(0);
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;
  const prevIndexRef = useRef(activeIndex);

  // Single shared 1024px breakpoint for exclusive navigation rendering
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const handleSelectTab = (newIndex) => {
    prevIndexRef.current = activeIndex;
    if (onTabChange) {
      onTabChange(newIndex);
    } else {
      setInternalIndex(newIndex);
    }
  };

  // Wire sequential swipe gestures
  useSwipe({
    activeIndex,
    onSelectTab: handleSelectTab,
    enabled: true
  });

  return (
    <div
      id="app-shell"
      className="relative w-full min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-x-hidden"
    >
      {/* 
        CRITICAL ARCHITECTURE:
        The page container and navigation are direct SIBLINGS.
        Padding is strictly applied only for the active nav type:
        - Below 1024px: pb-28 (bottom bar clearance), 0 left padding.
        - From 1024px: pl-28 (side rail clearance), normal pb-6.
      */}
      <main
        id="page-container"
        className={`w-full min-h-screen ${isDesktop ? 'pl-28 pb-6' : 'pb-28'}`}
      >
        <PageTransition activeIndex={activeIndex} previousIndex={prevIndexRef.current}>
          {children}
        </PageTransition>
      </main>

      {/* Exclusively render exactly ONE navigation element in the DOM */}
      {isDesktop ? (
        <SideRail
          activeIndex={activeIndex}
          onSelectTab={handleSelectTab}
        />
      ) : (
        <BottomBar
          activeIndex={activeIndex}
          onSelectTab={handleSelectTab}
        />
      )}
    </div>
  );
}

export default AppShell;
