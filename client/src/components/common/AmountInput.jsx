import React, { useMemo } from 'react';
import { toPaise } from '../../utils/paise.js';
import { formatINR } from '../../utils/formatCurrency.js';

export default function AmountInput({
  value = '',
  onChange,
  onPaiseChange,
  maxPaise,
  disabled = false,
  error,
  label = 'Enter Amount',
  quickAmounts = [500, 1000, 2000, 5000],
  className = ''
}) {
  const currentPaise = useMemo(() => {
    try {
      if (!value || !value.trim()) return null;
      return toPaise(value);
    } catch {
      return null;
    }
  }, [value]);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    // Allow empty or digits with at most 1 decimal point and 2 decimals
    if (raw === '' || /^\d*\.?\d{0,2}$/.test(raw)) {
      if (onChange) onChange(raw);
      if (onPaiseChange) {
        try {
          const paise = raw ? toPaise(raw) : null;
          onPaiseChange(paise);
        } catch {
          onPaiseChange(null);
        }
      }
    }
  };

  const handleQuickAdd = (rupees) => {
    if (disabled) return;
    const current = currentPaise ? currentPaise / 100 : 0;
    const nextRupees = (current + rupees).toFixed(2).replace(/\.00$/, '');
    if (onChange) onChange(nextRupees);
    if (onPaiseChange) {
      try {
        onPaiseChange(toPaise(nextRupees));
      } catch {
        onPaiseChange(null);
      }
    }
  };

  return (
    <div className={`w-full flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          {label}
        </label>
      )}

      {/* Main input display */}
      <div className={`relative flex items-center bg-[var(--surface-subtle)] rounded-2xl border-2 transition-all p-3.5 ${
        error
          ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-200'
          : 'border-[var(--border)] focus-within:border-[#1b4f9c] focus-within:ring-2 focus-within:ring-[#1b4f9c]/20'
      }`}>
        <span className="text-2xl sm:text-3xl font-bold text-[#1b4f9c] select-none mr-2">
          ₹
        </span>
        <input
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={value}
          disabled={disabled}
          onChange={handleInputChange}
          className="w-full bg-transparent text-2xl sm:text-3xl font-bold text-[var(--text-main)] outline-none placeholder:text-[var(--text-muted)]/40"
        />
      </div>

      {/* Live Indian grouping preview */}
      <div className="flex items-center justify-between text-xs px-1 min-h-[20px]">
        {error ? (
          <span className="text-red-500 font-medium">{error}</span>
        ) : currentPaise !== null ? (
          <span className="text-[var(--text-muted)] font-medium">
            In words: <span className="text-[#1b4f9c] font-semibold">{formatINR(currentPaise)}</span>
          </span>
        ) : (
          <span className="text-[var(--text-muted)]">Enter amount in rupees</span>
        )}

        {maxPaise && (
          <span className="text-[var(--text-muted)]">
            Max: <span className="font-semibold">{formatINR(maxPaise)}</span>
          </span>
        )}
      </div>

      {/* Quick Amount Chips */}
      {quickAmounts && quickAmounts.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-1">
          {quickAmounts.map((amt) => (
            <button
              key={amt}
              type="button"
              disabled={disabled}
              onClick={() => handleQuickAdd(amt)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--surface-subtle)] hover:bg-[var(--border-subtle)] text-[var(--text-main)] border border-[var(--border)] transition-colors active:scale-95 disabled:opacity-40 cursor-pointer"
            >
              +₹{amt.toLocaleString('en-IN')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
