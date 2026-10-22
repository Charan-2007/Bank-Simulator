import React, { useRef, useState, useEffect, useCallback } from 'react';
import GlassBubble from './GlassBubble.jsx';
import useDragBubble from '../../hooks/useDragBubble.js';
import { TABS } from './BottomBar.jsx';

export function SideRail({ activeIndex = 0, onSelectTab, debug = false }) {
  const railRef = useRef(null);
  const tabRefs = useRef([]);
  const [activeRect, setActiveRect] = useState(null);
  const [tabCenters, setTabCenters] = useState([]);

  const updateMeasurements = useCallback(() => {
    if (!railRef.current) return;
    const railBox = railRef.current.getBoundingClientRect();
    const clientLeft = railRef.current.clientLeft || 0;
    const clientTop = railRef.current.clientTop || 0;

    const activeTabEl = tabRefs.current[activeIndex];
    if (!activeTabEl) return;
    const activeTabBox = activeTabEl.getBoundingClientRect();

    // 1. Exact center of active tab relative to rail padding box
    const tabCenterPaddingX = (activeTabBox.left + activeTabBox.right) / 2 - (railBox.left + clientLeft);
    const tabCenterPaddingY = (activeTabBox.top + activeTabBox.bottom) / 2 - (railBox.top + clientTop);

    // 2. Exact dimensions: bubble width = rail inner width - 8px; bubble height = tab height - 8px
    const bubbleWidth = (railRef.current.clientWidth || railBox.width) - 8;
    const bubbleHeight = activeTabBox.height - 8;

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

    // 4. Measure vertical centers of all tabs for snap release
    const centers = tabRefs.current.map((el) => {
      if (!el) return 0;
      const b = el.getBoundingClientRect();
      return (b.top + b.bottom) / 2 - (railBox.top + clientTop);
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
    orientation: 'vertical',
    onSelectTab
  });

  useEffect(() => {
    updateMeasurements();

    const ro = new ResizeObserver(() => {
      updateMeasurements();
    });

    if (railRef.current) ro.observe(railRef.current);
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
    if (e.key === 'ArrowDown') {
      onSelectTab((activeIndex + 1) % TABS.length);
    } else if (e.key === 'ArrowUp') {
      onSelectTab((activeIndex - 1 + TABS.length) % TABS.length);
    }
  };

  return (
    <nav
      className="fixed left-6 top-1/2 -translate-y-1/2 z-50 select-none"
      role="navigation"
      aria-label="Desktop Navigation Rail"
    >
      <div
        ref={railRef}
        id="side-rail-container"
        role="tablist"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => handlePointerUp(activeIndex, e)}
        onPointerCancel={(e) => handlePointerUp(activeIndex, e)}
        className="nav relative flex flex-col items-center justify-between p-1 w-16 h-80 cursor-grab active:cursor-grabbing outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <GlassBubble
          rect={activeRect}
          isDragging={isDragging}
          dragOffset={dragOffset}
          velocity={velocity}
          orientation="vertical"
          debug={debug}
        />

        {TABS.map((tab, idx) => {
          const isActive = idx === activeIndex;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              ref={(el) => (tabRefs.current[idx] = el)}
              id={`rail-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.label}
              onClick={() => onSelectTab(idx)}
              style={{
                outline: debug ? '1px dashed rgba(255, 0, 100, 0.75)' : 'none'
              }}
              className={`relative z-10 flex-[1_1_0%] min-h-0 w-full flex flex-col items-center justify-center rounded-[18px] transition-colors duration-150 ${
                isActive
                  ? 'text-[var(--text-main)] font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              <Icon active={isActive} />
              <span className="text-[9.5px] mt-0.5 tracking-tight truncate w-full text-center">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default SideRail;
