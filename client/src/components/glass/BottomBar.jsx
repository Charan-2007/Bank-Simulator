import React, { useRef, useState, useEffect, useCallback } from 'react';
import GlassBubble from './GlassBubble.jsx';
import useDragBubble from '../../hooks/useDragBubble.js';
import { hapticImpactLight } from '../../utils/haptics.js';

export const TABS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'cards', label: 'Cards', icon: CardsIcon },
  { id: 'pay', label: 'Pay', icon: PayIcon },
  { id: 'passbook', label: 'Passbook', icon: PassbookIcon },
  { id: 'profile', label: 'Profile', icon: ProfileIcon }
];

function HomeIcon({ active }) {
  return (
    <svg className="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke={active ? 'currentColor' : 'var(--text-muted)'} strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function CardsIcon({ active }) {
  return (
    <svg className="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke={active ? 'currentColor' : 'var(--text-muted)'} strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );
}

function PayIcon({ active }) {
  return (
    <svg className="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke={active ? 'currentColor' : 'var(--text-muted)'} strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function PassbookIcon({ active }) {
  return (
    <svg className="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke={active ? 'currentColor' : 'var(--text-muted)'} strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  );
}

function ProfileIcon({ active }) {
  return (
    <svg className="w-5 h-5 transition-colors" fill="none" viewBox="0 0 24 24" stroke={active ? 'currentColor' : 'var(--text-muted)'} strokeWidth={active ? 2.2 : 1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

export function BottomBar({ activeIndex = 0, onSelectTab, debug = false }) {
  const barRef = useRef(null);
  const tabRefs = useRef([]);
  const [activeRect, setActiveRect] = useState(null);
  const [tabCenters, setTabCenters] = useState([]);

  const updateMeasurements = useCallback(() => {
    if (!barRef.current) return;
    const barBox = barRef.current.getBoundingClientRect();
    const clientLeft = barRef.current.clientLeft || 0;
    const clientTop = barRef.current.clientTop || 0;

    const activeTabEl = tabRefs.current[activeIndex];
    if (!activeTabEl) return;
    const activeTabBox = activeTabEl.getBoundingClientRect();

    // 1. Center of active tab relative to the padding box of the bar (origin for position: absolute)
    const tabCenterPaddingX = (activeTabBox.left + activeTabBox.right) / 2 - (barBox.left + clientLeft);
    const tabCenterPaddingY = (activeTabBox.top + activeTabBox.bottom) / 2 - (barBox.top + clientTop);

    // 2. Exact dimensions: bubble height = bar inner height - 8px; bubble width = tab width - 8px
    const bubbleWidth = activeTabBox.width - 8;
    const bubbleHeight = (barRef.current.clientHeight || barBox.height) - 8;

    // 3. Top-left of bubble such that bubble centre equals active tab centre
    const bubbleX = tabCenterPaddingX - bubbleWidth / 2;
    const bubbleY = tabCenterPaddingY - bubbleHeight / 2;

    setActiveRect({
      x: bubbleX,
      y: bubbleY,
      width: bubbleWidth,
      height: bubbleHeight,
      tabCenterX: tabCenterPaddingX,
      tabCenterY: tabCenterPaddingY
    });

    // 4. Measure centers of all tabs relative to padding box for snap release
    const centers = tabRefs.current.map((el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return (b.left + b.right) / 2 - (barBox.left + clientLeft);
    });
    setTabCenters(centers);
  }, [activeIndex]);

  const {
    isDragging,
    dragOffset,
    velocity,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  } = useDragBubble({
    tabCenters,
    orientation: 'horizontal',
    onSelectTab
  });

  useEffect(() => {
    updateMeasurements();

    const ro = new ResizeObserver(() => {
      updateMeasurements();
    });

    if (barRef.current) ro.observe(barRef.current);
    tabRefs.current.forEach((el) => {
      if (el) ro.observe(el);
    });

    window.addEventListener('resize', updateMeasurements);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateMeasurements);
    };
  }, [updateMeasurements]);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      hapticImpactLight();
      onSelectTab((activeIndex + 1) % TABS.length);
    } else if (e.key === 'ArrowLeft') {
      hapticImpactLight();
      onSelectTab((activeIndex - 1 + TABS.length) % TABS.length);
    }
  };

  return (
    <nav
      className="fixed bottom-4 left-4 right-4 sm:left-0 sm:right-0 sm:mx-auto sm:max-w-[500px] z-50 select-none"
      role="navigation"
      aria-label="Main Navigation"
    >
      <div
        ref={barRef}
        id="bottom-bar-container"
        role="tablist"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => handlePointerUp(activeIndex, e)}
        onPointerCancel={(e) => handlePointerUp(activeIndex, e)}
        className="nav relative flex items-center justify-between p-1 h-16 cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        {/* Dynamic Translucent Spring Bubble */}
        <GlassBubble
          rect={activeRect}
          isDragging={isDragging}
          dragOffset={dragOffset}
          velocity={velocity}
          orientation="horizontal"
          debug={debug}
        />

        {/* Tab Buttons: Exactly equal width (flex: 1 1 0, min-width: 0) */}
        {TABS.map((tab, idx) => {
          const isActive = idx === activeIndex;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[idx] = el)}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => {
                hapticImpactLight();
                onSelectTab(idx);
              }}
              style={{
                outline: debug ? '1px dashed rgba(255, 0, 100, 0.75)' : 'none'
              }}
              className={`relative z-10 flex-[1_1_0%] min-w-0 h-full flex flex-col items-center justify-center rounded-[18px] transition-colors duration-150 ${
                isActive
                  ? 'text-[var(--text-main)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Icon active={isActive} />
              <span className="text-[10.5px] mt-0.5 tracking-tight truncate w-full text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomBar;
