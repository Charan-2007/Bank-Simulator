import React, { useRef, useState, useEffect } from 'react';

export default function PinInput({
  id,
  value = '',
  onChange,
  onSubmit,
  disabled = false,
  error = false,
  showEye = true,
  autoFocus = false,
  ariaLabel = 'Security PIN',
  className = ''
}) {
  const [digits, setDigits] = useState(() => {
    const arr = (value || '').split('').slice(0, 6);
    while (arr.length < 6) arr.push('');
    return arr;
  });

  const [isMasked, setIsMasked] = useState(true);
  const inputRefs = useRef([]);
  const containerRef = useRef(null);
  const hideTimerRef = useRef(null);

  useEffect(() => {
    const arr = (value || '').split('').slice(0, 6);
    while (arr.length < 6) arr.push('');
    setDigits(arr);
  }, [value]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const triggerAutoHideTimer = () => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      setIsMasked(true);
    }, 10000); // 10 seconds
  };

  const toggleMask = () => {
    if (disabled) return;
    setIsMasked(prev => {
      const next = !prev;
      if (!next) {
        triggerAutoHideTimer();
      } else {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      }
      return next;
    });
  };

  const handleContainerBlur = (e) => {
    // If focus moves outside this container, re-mask immediately
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      setIsMasked(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    }
  };

  const handleChange = (index, val) => {
    if (disabled) return;
    const clean = val.replace(/\D/g, '');
    if (!clean) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      const combined = next.join('');
      if (onChange) onChange(combined);
      return;
    }

    // Handle paste or multiple chars
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

    // Auto-advance to next box (do NOT auto-submit)
    if (index < 5 && clean) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (disabled) return;
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
      if (onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const clean = pasted.replace(/\D/g, '').slice(0, 6);
    if (!clean) return;
    const next = clean.split('');
    while (next.length < 6) next.push('');
    setDigits(next);
    const combined = clean;
    if (onChange) onChange(combined);
    const focusIdx = Math.min(clean.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  return (
    <div
      id={id}
      ref={containerRef}
      onBlur={handleContainerBlur}
      className={`flex items-center justify-center gap-2 sm:gap-2.5 ${className}`}
    >
      <div className="flex items-center gap-1.5 sm:gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={el => (inputRefs.current[index] = el)}
            type={isMasked ? 'password' : 'tel'}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={e => handleChange(index, e.target.value)}
            onKeyDown={e => handleKeyDown(index, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            aria-label={`${ariaLabel} digit ${index + 1} of 6`}
            className={`w-10 h-12 sm:w-11 sm:h-13 text-center text-lg sm:text-xl font-bold rounded-xl border-2 transition-all duration-150 focus:outline-none bg-[var(--surface-subtle)] text-[var(--text-main)] ${
              error
                ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-200'
                : digit
                ? 'border-[#1b4f9c] focus:ring-2 focus:ring-[#1b4f9c]/20'
                : 'border-[var(--border)] focus:border-[#1b4f9c] focus:ring-2 focus:ring-[#1b4f9c]/20'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          />
        ))}
      </div>

      {showEye && (
        <button
          type="button"
          onClick={toggleMask}
          disabled={disabled}
          title={isMasked ? 'Show PIN' : 'Hide PIN'}
          aria-label={isMasked ? 'Show PIN' : 'Hide PIN'}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          {isMasked ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-[#1b4f9c] dark:text-[#5c9dff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
