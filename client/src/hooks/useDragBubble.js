import { useState, useRef, useCallback } from 'react';

export function useDragBubble({ tabCenters = [], orientation = 'horizontal', onSelectTab }) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [velocity, setVelocity] = useState(0);

  const startCoordRef = useRef(0);
  const lastCoordRef = useRef(0);
  const lastTimeRef = useRef(0);
  const isPointerDownRef = useRef(false);

  const handlePointerDown = useCallback((e) => {
    isPointerDownRef.current = true;
    setIsDragging(true);
    const coord = orientation === 'horizontal' ? e.clientX : e.clientY;
    startCoordRef.current = coord;
    lastCoordRef.current = coord;
    lastTimeRef.current = performance.now();
    setDragOffset(0);
    setVelocity(0);

    if (e.target && e.target.setPointerCapture) {
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch {}
    }
  }, [orientation]);

  const handlePointerMove = useCallback((e) => {
    if (!isPointerDownRef.current) return;
    const coord = orientation === 'horizontal' ? e.clientX : e.clientY;
    const now = performance.now();
    const dt = Math.max(1, now - lastTimeRef.current);
    const dx = coord - lastCoordRef.current;

    const currentVel = (dx / dt) * 16.6; // normalized velocity
    setVelocity(currentVel);

    setDragOffset(coord - startCoordRef.current);
    lastCoordRef.current = coord;
    lastTimeRef.current = now;
  }, [orientation]);

  const handlePointerUp = useCallback((activeIndex, e) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    setIsDragging(false);

    if (e?.target && e.target.releasePointerCapture) {
      try {
        e.target.releasePointerCapture(e.pointerId);
      } catch {}
    }

    if (!tabCenters || tabCenters.length === 0) {
      setDragOffset(0);
      setVelocity(0);
      return;
    }

    const startCenter = tabCenters[activeIndex] ?? 0;
    const projectedCenter = startCenter + dragOffset + (velocity * 3.5);

    // Find closest tab based on actual measured tab centers
    let closestIndex = activeIndex;
    let minDistance = Infinity;

    tabCenters.forEach((center, idx) => {
      const dist = Math.abs(projectedCenter - center);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = idx;
      }
    });

    setDragOffset(0);
    setVelocity(0);

    if (onSelectTab && closestIndex !== activeIndex) {
      onSelectTab(closestIndex);
    }
  }, [dragOffset, velocity, tabCenters, onSelectTab]);

  return {
    isDragging,
    dragOffset,
    velocity,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp
  };
}

export default useDragBubble;
