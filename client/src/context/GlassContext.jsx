import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const GlassContext = createContext();

export function GlassProvider({ children }) {
  const [glassMode, setGlassMode] = useState(() => localStorage.getItem('nb_glass') || 'auto');
  const [effectiveGlass, setEffectiveGlass] = useState('full');
  const [frameStats, setFrameStats] = useState({
    avgFrameTimeMs: null,
    worstFrameTimeMs: null,
    fps: null,
    sampleCount: 0,
    status: 'idle'
  });

  const benchmarkRunningRef = useRef(false);

  const runBenchmark = useCallback((onComplete) => {
    if (benchmarkRunningRef.current) return;
    benchmarkRunningRef.current = true;

    setFrameStats({
      avgFrameTimeMs: null,
      worstFrameTimeMs: null,
      fps: null,
      sampleCount: 0,
      status: 'measuring'
    });

    let animId;
    let prevTime = performance.now();
    const deltas = [];
    const maxSamples = 180;

    const measure = (now) => {
      const delta = now - prevTime;
      prevTime = now;

      // Ignore first abnormal frame or background tab pause (> 100ms)
      if (deltas.length === 0 || (delta > 1 && delta < 100)) {
        if (deltas.length > 0) {
          deltas.push(delta);
        } else {
          deltas.push(16.6); // seed frame
        }
      }

      if (deltas.length < maxSamples) {
        if (deltas.length % 30 === 0) {
          const currentAvg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
          const currentWorst = Math.max(...deltas);
          setFrameStats({
            avgFrameTimeMs: Number(currentAvg.toFixed(2)),
            worstFrameTimeMs: Number(currentWorst.toFixed(2)),
            fps: Math.round(1000 / currentAvg),
            sampleCount: deltas.length,
            status: 'measuring'
          });
        }
        animId = requestAnimationFrame(measure);
      } else {
        benchmarkRunningRef.current = false;
        const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
        const worst = Math.max(...deltas);
        const currentFps = Math.round(1000 / avg);
        const shouldDemote = avg > 24; // > 24ms (~42fps) demotes

        const finalMode = shouldDemote ? 'lite' : 'full';
        setEffectiveGlass(finalMode);
        document.documentElement.setAttribute('data-glass', finalMode);

        const finalStats = {
          avgFrameTimeMs: Number(avg.toFixed(2)),
          worstFrameTimeMs: Number(worst.toFixed(2)),
          fps: currentFps,
          sampleCount: deltas.length,
          status: 'ready',
          demoted: shouldDemote
        };

        setFrameStats(finalStats);
        if (onComplete) onComplete(finalStats);
      }
    };

    animId = requestAnimationFrame(measure);
    return () => {
      if (animId) cancelAnimationFrame(animId);
      benchmarkRunningRef.current = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('nb_glass', glassMode);

    if (glassMode !== 'auto') {
      setEffectiveGlass(glassMode);
      document.documentElement.setAttribute('data-glass', glassMode);
      return;
    }

    // Auto Mode
    const supportsBackdrop = typeof CSS !== 'undefined' && (
      CSS.supports('backdrop-filter', 'blur(1px)') ||
      CSS.supports('-webkit-backdrop-filter', 'blur(1px)')
    );

    if (!supportsBackdrop) {
      setEffectiveGlass('lite');
      document.documentElement.setAttribute('data-glass', 'lite');
      setFrameStats({
        avgFrameTimeMs: null,
        worstFrameTimeMs: null,
        fps: null,
        sampleCount: 0,
        status: 'unsupported'
      });
      return;
    }

    // Start auto benchmark
    setEffectiveGlass('full');
    document.documentElement.setAttribute('data-glass', 'full');
    const cancel = runBenchmark();
    return cancel;
  }, [glassMode, runBenchmark]);

  return (
    <GlassContext.Provider value={{ glassMode, setGlassMode, effectiveGlass, frameStats, runBenchmark }}>
      {children}
    </GlassContext.Provider>
  );
}

export function useGlass() {
  const context = useContext(GlassContext);
  if (!context) throw new Error('useGlass must be used within GlassProvider');
  return context;
}
