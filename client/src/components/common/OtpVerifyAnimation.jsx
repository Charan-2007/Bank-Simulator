import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { prefersReducedMotion } from '../../utils/motion.js';

export default function OtpVerifyAnimation({
  value = '',
  onChange,
  onVerify,
  status = 'idle', // 'idle' | 'verifying' | 'success' | 'failure'
  errorMessage = '',
  disabled = false,
  autoFocus = true
}) {
  const [digits, setDigits] = useState(() => {
    const arr = (value || '').split('').slice(0, 6);
    while (arr.length < 6) arr.push('');
    return arr;
  });

  const [phase, setPhase] = useState('idle'); // 'idle' | 'hexagon' | 'spin' | 'merge' | 'result'
  const [useFallback, setUseFallback] = useState(false);
  const inputRefs = useRef([]);
  const isReduced = prefersReducedMotion();

  useEffect(() => {
    const arr = (value || '').split('').slice(0, 6);
    while (arr.length < 6) arr.push('');
    setDigits(arr);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled && phase === 'idle') {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled, phase]);

  // Frame time check
  useEffect(() => {
    let start = performance.now();
    let frameId = requestAnimationFrame(() => {
      const duration = performance.now() - start;
      if (duration > 24) {
        setUseFallback(true);
      }
    });
    return () => cancelAnimationFrame(frameId);
  }, []);

  // Sequence orchestration when status changes
  useEffect(() => {
    if (status === 'verifying') {
      if (isReduced) {
        setPhase('merge');
        return;
      }
      if (useFallback) {
        setPhase('merge');
        return;
      }

      // Phase A: Hexagon
      setPhase('hexagon');
      const t1 = setTimeout(() => {
        // Phase B: Spin
        setPhase('spin');
      }, 400);

      const t2 = setTimeout(() => {
        // Phase C: Merge to spinner
        setPhase('merge');
      }, 900);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (status === 'success' || status === 'failure') {
      setPhase('result');
      if (status === 'failure') {
        const t3 = setTimeout(() => {
          setPhase('idle');
        }, 1600);
        return () => clearTimeout(t3);
      }
    } else if (status === 'idle') {
      setPhase('idle');
    }
  }, [status, isReduced, useFallback]);

  const handleChange = (index, val) => {
    if (disabled || phase !== 'idle') return;
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      if (onChange) onChange(next.join(''));
      return;
    }

    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const next = [...digits];
      for (let i = 0; i < 6; i++) {
        if (pasted[i]) next[i] = pasted[i];
      }
      setDigits(next);
      const combined = next.join('');
      if (onChange) onChange(combined);
      const focusIdx = Math.min(clean.length, 5);
      inputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...digits];
    next[index] = clean;
    setDigits(next);
    const combined = next.join('');
    if (onChange) onChange(combined);

    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (disabled || phase !== 'idle') return;
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
        if (onChange) onChange(next.join(''));
      } else if (digits[index]) {
        const next = [...digits];
        next[index] = '';
        setDigits(next);
        if (onChange) onChange(next.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      if (onVerify) {
        e.preventDefault();
        onVerify();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    if (phase !== 'idle') return;
    const pasted = e.clipboardData.getData('text');
    const clean = pasted.replace(/\D/g, '').slice(0, 6);
    if (!clean) return;
    const next = clean.split('');
    while (next.length < 6) next.push('');
    setDigits(next);
    if (onChange) onChange(clean);
    const focusIdx = Math.min(clean.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  // Hexagon layout coordinates (radius ~ 48px from center)
  const getHexagonOffset = (index) => {
    const angle = (index * 60) * (Math.PI / 180);
    const radius = 52;
    // Row layout offsets relative to container center
    // Digits row items are at x approx: (index - 2.5) * 52px
    const initialX = (index - 2.5) * 52;
    const targetX = Math.round(radius * Math.cos(angle));
    const targetY = Math.round(radius * Math.sin(angle));
    return {
      x: targetX - initialX,
      y: targetY
    };
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[140px] py-4 relative">
      <AnimatePresence mode="wait">
        {phase === 'idle' && (
          <motion.div
            key="idle-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.9 }}
            className="flex items-center justify-center gap-2 sm:gap-3"
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={el => (inputRefs.current[index] = el)}
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={disabled}
                onChange={e => handleChange(index, e.target.value)}
                onKeyDown={e => handleKeyDown(index, e)}
                onPaste={handlePaste}
                onFocus={e => e.target.select()}
                aria-label={`OTP Digit ${index + 1} of 6`}
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all duration-150 focus:outline-none bg-[var(--surface-subtle)] text-[var(--text-main)] ${
                  errorMessage
                    ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                    : digit
                    ? 'border-[#1b4f9c] focus:ring-2 focus:ring-[#1b4f9c]/20'
                    : 'border-[var(--border)] focus:border-[#1b4f9c] focus:ring-2 focus:ring-[#1b4f9c]/20'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              />
            ))}
          </motion.div>
        )}

        {(phase === 'hexagon' || phase === 'spin') && (
          <motion.div
            key="animation-hex"
            animate={phase === 'spin' ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="relative w-48 h-48 flex items-center justify-center"
          >
            {digits.map((digit, index) => {
              const offset = getHexagonOffset(index);
              return (
                <motion.div
                  key={index}
                  initial={{ x: 0, y: 0, scale: 1 }}
                  animate={{
                    x: offset.x,
                    y: offset.y,
                    scale: 0.9
                  }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.04,
                    ease: [0.16, 1, 0.3, 1]
                  }}
                  className="absolute w-10 h-10 rounded-xl bg-[#1b4f9c] text-white font-bold flex items-center justify-center text-lg shadow-lg border border-white/20"
                >
                  {digit || '•'}
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {phase === 'merge' && (
          <motion.div
            key="merged-spinner"
            initial={isReduced ? { opacity: 0 } : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="w-16 h-16 rounded-2xl bg-[#1b4f9c] flex items-center justify-center shadow-xl border border-white/30"
          >
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin" />
          </motion.div>
        )}

        {phase === 'result' && status === 'success' && (
          <motion.div
            key="result-success"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl"
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
            </svg>
          </motion.div>
        )}

        {phase === 'result' && status === 'failure' && (
          <motion.div
            key="result-failure"
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: 1,
              x: [0, -12, 12, -8, 8, -4, 4, 0]
            }}
            transition={{ duration: 0.6 }}
            className="w-16 h-16 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-xl"
          >
            <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      {errorMessage && phase === 'idle' && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 text-xs text-red-500 font-medium text-center"
        >
          {errorMessage}
        </motion.p>
      )}
    </div>
  );
}
