import React, { useState, useEffect, useRef } from 'react';
import BottomBar, { TABS } from '../../components/glass/BottomBar.jsx';
import SideRail from '../../components/glass/SideRail.jsx';
import useMediaQuery from '../../hooks/useMediaQuery.js';
import { useGlass } from '../../context/GlassContext.jsx';
import { useTheme } from '../../context/ThemeContext.jsx';

export function GlassTest() {
  const [activeTab, setActiveTab] = useState(0);
  const { glassMode, setGlassMode, effectiveGlass, frameStats, runBenchmark } = useGlass();
  const { theme, setTheme } = useTheme();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const [isDebug, setIsDebug] = useState(false);
  const [alignmentData, setAlignmentData] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('debug') === '1') {
      setIsDebug(true);
    }
  }, []);

  // Measure tab centers and bubble center for debug table
  const measureAlignment = () => {
    const barEl = document.querySelector('#bottom-bar-container');
    const bubbleEl = document.querySelector('#glass-bubble-element');
    if (!barEl || !bubbleEl) return;

    const barBox = barEl.getBoundingClientRect();
    const bubbleBox = bubbleEl.getBoundingClientRect();
    const bubbleCenterX = (bubbleBox.left + bubbleBox.right) / 2;
    const bubbleCenterY = (bubbleBox.top + bubbleBox.bottom) / 2;

    const data = TABS.map((tab, idx) => {
      const tabEl = document.querySelector(`#tab-${tab.id}`);
      if (!tabEl) return null;
      const tabBox = tabEl.getBoundingClientRect();
      const tabCenterX = (tabBox.left + tabBox.right) / 2;
      const tabCenterY = (tabBox.top + tabBox.bottom) / 2;

      const diffX = Number((bubbleCenterX - tabCenterX).toFixed(2));
      const diffY = Number((bubbleCenterY - tabCenterY).toFixed(2));
      const isCurrent = idx === activeTab;
      const passed = Math.abs(diffX) <= 1.0 && Math.abs(diffY) <= 1.0;

      return {
        id: tab.id,
        label: tab.label,
        isCurrent,
        tabCenterX: Number(tabCenterX.toFixed(1)),
        tabCenterY: Number(tabCenterY.toFixed(1)),
        bubbleCenterX: Number(bubbleCenterX.toFixed(1)),
        bubbleCenterY: Number(bubbleCenterY.toFixed(1)),
        diffX,
        diffY,
        passed
      };
    }).filter(Boolean);

    setAlignmentData(data);
  };

  useEffect(() => {
    measureAlignment();
    if (isDebug) {
      const interval = setInterval(measureAlignment, 150);
      return () => clearInterval(interval);
    }
  }, [activeTab, isDebug, glassMode]);

  return (
    <div
      id="glass-test-root"
      className="relative w-full min-h-[300vh] bg-[var(--bg-main)] text-[var(--text-main)] overflow-x-hidden"
    >
      <div className="w-full max-w-4xl mx-auto px-4 py-8" style={{ paddingBottom: '900px' }}>
        {/* Header Controls */}
        <div className="mb-6 p-6 rounded-3xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">NovaBank Glass Test Bench</h1>
              <p className="text-sm text-[var(--text-muted)]">
                Verifying real-time backdrop blur, spring bubble physics, and GPU rendering.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                id="theme-toggle-btn"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="px-3.5 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-card)] text-xs font-semibold hover:border-[var(--primary)] transition-colors"
              >
                Theme: {theme.toUpperCase()}
              </button>
              <button
                id="debug-toggle-btn"
                onClick={() => setIsDebug(!isDebug)}
                className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                  isDebug ? 'bg-cyan-500 text-slate-900 border-cyan-400 font-bold' : 'bg-[var(--surface-card)] border-[var(--border)]'
                }`}
              >
                Debug: {isDebug ? 'ON (?debug=1)' : 'OFF'}
              </button>
            </div>
          </div>

          {/* Glass Mode Switcher */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mr-2">
              Glass Mode:
            </span>
            {['full', 'lite', 'off', 'auto'].map((mode) => (
              <button
                key={mode}
                id={`glass-btn-${mode}`}
                onClick={() => setGlassMode(mode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  glassMode === mode
                    ? 'bg-[var(--primary)] text-white shadow-sm'
                    : 'bg-[var(--surface-card)] text-[var(--text-main)] border border-[var(--border)] hover:border-[var(--primary)]'
                }`}
              >
                {mode.toUpperCase()}
              </button>
            ))}
            {glassMode === 'auto' && (
              <button
                id="benchmark-btn"
                onClick={() => runBenchmark()}
                className="ml-auto px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                Re-Run Benchmark
              </button>
            )}
          </div>

          {/* Performance Telemetry: Strict Real Values */}
          <div className="mt-4 p-3 rounded-2xl bg-[var(--surface-card)] border border-[var(--border)] grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Active Filter:</span>
              <strong className="text-[var(--primary)] uppercase font-mono text-sm">{effectiveGlass}</strong>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Avg Frame Time:</span>
              <strong id="stat-avg-frametime" className="font-mono text-sm">
                {frameStats.avgFrameTimeMs !== null ? `${frameStats.avgFrameTimeMs} ms` : 'no data'}
              </strong>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Worst Frame:</span>
              <strong id="stat-worst-frametime" className="font-mono text-sm">
                {frameStats.worstFrameTimeMs !== null ? `${frameStats.worstFrameTimeMs} ms` : 'no data'}
              </strong>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Estimated FPS:</span>
              <strong id="stat-fps" className="font-mono text-sm">
                {frameStats.fps !== null ? `${frameStats.fps} FPS` : 'no data'}
              </strong>
            </div>
            <div>
              <span className="text-[var(--text-muted)] block text-[11px]">Samples:</span>
              <strong id="stat-samples" className="font-mono text-sm">
                {frameStats.sampleCount > 0 ? `${frameStats.sampleCount} frames` : '0 frames'}
              </strong>
            </div>
          </div>
        </div>

        {/* Debug Alignment Diagnostics Overlay Table */}
        {isDebug && (
          <div
            id="debug-alignment-panel"
            className="mb-6 p-5 rounded-3xl bg-slate-900 text-white border border-cyan-500/50 shadow-xl font-mono text-xs"
          >
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <span className="font-bold text-cyan-400">?debug=1 Tab Alignment Diagnostics</span>
              <span className="text-[11px] text-slate-400">Target: |Diff| ≤ 1.0 px</span>
            </div>
            <div className="overflow-x-auto">
              <table id="debug-alignment-table" className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                    <th className="py-1 px-2">Tab</th>
                    <th className="py-1 px-2">Tab Center</th>
                    <th className="py-1 px-2">Bubble Center</th>
                    <th className="py-1 px-2">Diff X</th>
                    <th className="py-1 px-2">Diff Y</th>
                    <th className="py-1 px-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alignmentData.map((row) => (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-800/50 ${
                        row.isCurrent ? 'bg-cyan-950/40 font-semibold text-cyan-300' : 'text-slate-300'
                      }`}
                    >
                      <td className="py-1.5 px-2">{row.label} {row.isCurrent ? '(Active)' : ''}</td>
                      <td className="py-1.5 px-2">({row.tabCenterX}, {row.tabCenterY})</td>
                      <td className="py-1.5 px-2">
                        {row.isCurrent ? `(${row.bubbleCenterX}, ${row.bubbleCenterY})` : '—'}
                      </td>
                      <td className="py-1.5 px-2">
                        {row.isCurrent ? `${row.diffX > 0 ? '+' : ''}${row.diffX} px` : '—'}
                      </td>
                      <td className="py-1.5 px-2">
                        {row.isCurrent ? `${row.diffY > 0 ? '+' : ''}${row.diffY} px` : '—'}
                      </td>
                      <td className="py-1.5 px-2">
                        {row.isCurrent ? (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              row.passed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {row.passed ? 'PASS' : 'FAIL'}
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Inactive</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 
          HIGH-CONTRAST CARD SEAM TEST BENCH (Directly positioned behind nav bar)
          Sharp dividing vertical seam between Vivid Crimson (#f43f5e) and Electric Cyan (#06b6d4)
        */}
          {/* Standard test pattern cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="h-36 rounded-2xl bg-gradient-to-tr from-pink-500 via-rose-500 to-amber-400 p-4 text-white font-bold flex items-end shadow-md">
              Vivid Rose & Sunset
            </div>
            <div className="h-36 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-4 text-white font-bold flex items-end shadow-md">
              Neon Cyber Indigo
            </div>
            <div className="h-36 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-4 text-white font-bold flex items-end shadow-md">
              Emerald Turquoise
            </div>
            <div className="h-36 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-600 to-red-600 p-4 text-white font-bold flex items-end shadow-md">
              Solar Flare Orange
            </div>
            <div className="h-36 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-500 to-emerald-400 p-4 text-white font-bold flex items-end shadow-md">
              Oceanic Azure
            </div>
            <div className="h-36 rounded-2xl bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-600 p-4 text-white font-bold flex items-end shadow-md">
              Electric Ultraviolet
            </div>
          </div>

          {/* 
            HIGH-CONTRAST CARD SEAM TEST BENCH (Positioned so scrolling places it directly behind the floating nav)
            Sharp dividing vertical seam between Vivid Crimson (#f43f5e) and Electric Cyan (#06b6d4)
          */}
          <div id="card-seam-test-bench" className="space-y-6 pt-4">
            <div className="p-4 rounded-3xl bg-[var(--surface)] border border-[var(--border)]">
              <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                Card Edge Blur Seam Benchmark
              </h2>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                The high-contrast split block below creates a razor-sharp vertical line between Crimson and Cyan.
                Scroll down to place the nav bar directly over this seam. In Full mode, optical diffusion softens the edge.
              </p>

              <div id="card-seam-target" className="h-48 w-full rounded-2xl flex overflow-hidden shadow-inner border border-slate-700/50">
                <div className="w-1/2 h-full bg-rose-600 flex items-center justify-center text-white font-black text-xl tracking-wider">
                  VIVID ROSE
                </div>
                <div className="w-1/2 h-full bg-cyan-400 flex items-center justify-center text-slate-900 font-black text-xl tracking-wider">
                  ELECTRIC CYAN
                </div>
              </div>
            </div>
          </div>
      </div>

      {/* Sibling navigation element: exclusive based on 1024px breakpoint */}
      {isDesktop ? (
        <SideRail activeIndex={activeTab} onSelectTab={setActiveTab} debug={isDebug} />
      ) : (
        <BottomBar activeIndex={activeTab} onSelectTab={setActiveTab} debug={isDebug} />
      )}
    </div>
  );
}

export default GlassTest;
