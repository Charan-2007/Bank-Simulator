import React, { useState, useEffect, useRef } from 'react';
import {
  getKolkataToday,
  getDaysInMonth,
  validateBirthDate,
  parsePastedDate,
  formatToIso
} from '@shared/dateUtils.js';
import BottomSheet from './BottomSheet.jsx';
import Button from './Button.jsx';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DateOfBirthInput({
  value = '', // YYYY-MM-DD
  onChange,
  onBlur,
  disabled = false,
  error = '',
  id = 'dob-input',
  className = ''
}) {
  const parseIso = (val) => {
    if (!val || typeof val !== 'string') return { d: '', m: '', y: '' };
    const parts = val.split('-');
    if (parts.length === 3) {
      return {
        y: parts[0] || '',
        m: parts[1] || '',
        d: parts[2] || ''
      };
    }
    return { d: '', m: '', y: '' };
  };

  const initial = parseIso(value);
  const [day, setDay] = useState(initial.d);
  const [month, setMonth] = useState(initial.m);
  const [year, setYear] = useState(initial.y);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Wheel state
  const today = getKolkataToday();
  const maxYear = today.year - 16;
  const minYear = today.year - 100;

  const [wheelDay, setWheelDay] = useState(() => parseInt(initial.d, 10) || 1);
  const [wheelMonth, setWheelMonth] = useState(() => parseInt(initial.m, 10) || 1);
  const [wheelYear, setWheelYear] = useState(() => parseInt(initial.y, 10) || maxYear);

  const dayRef = useRef(null);
  const monthRef = useRef(null);
  const yearRef = useRef(null);

  useEffect(() => {
    const parsed = parseIso(value);
    setDay(parsed.d);
    setMonth(parsed.m);
    setYear(parsed.y);
    if (parsed.d && parsed.m && parsed.y) {
      setWheelDay(parseInt(parsed.d, 10));
      setWheelMonth(parseInt(parsed.m, 10));
      setWheelYear(parseInt(parsed.y, 10));
    }
  }, [value]);

  const notifyChange = (d, m, y) => {
    if (!d || !m || !y || y.length < 4) {
      if (onChange) onChange('', false, 'Please enter your complete date of birth');
      return;
    }
    const dNum = parseInt(d, 10);
    const mNum = parseInt(m, 10);
    const yNum = parseInt(y, 10);
    const validation = validateBirthDate(dNum, mNum, yNum);
    const iso = formatToIso(dNum, mNum, yNum);
    if (onChange) {
      onChange(iso, validation.valid, validation.error || '');
    }
  };

  const handleDayChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setDay(val);
    notifyChange(val, month, year);
    if (val.length === 2) {
      monthRef.current?.focus();
    }
  };

  const handleMonthChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    setMonth(val);
    notifyChange(day, val, year);
    if (val.length === 2) {
      yearRef.current?.focus();
    }
  };

  const handleYearChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setYear(val);
    notifyChange(day, month, val);
  };

  const handleKeyDown = (field, e) => {
    if (disabled) return;
    if (e.key === 'Backspace') {
      if (field === 'year' && !year) {
        monthRef.current?.focus();
      } else if (field === 'month' && !month) {
        dayRef.current?.focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text');
    const parsed = parsePastedDate(pasted);
    if (parsed) {
      setDay(parsed.day);
      setMonth(parsed.month);
      setYear(parsed.year);
      notifyChange(parsed.day, parsed.month, parsed.year);
      yearRef.current?.focus();
    }
  };

  const openSheet = () => {
    if (disabled) return;
    const dNum = parseInt(day, 10) || 1;
    const mNum = parseInt(month, 10) || 1;
    const yNum = parseInt(year, 10) || maxYear;
    setWheelDay(dNum);
    setWheelMonth(mNum);
    setWheelYear(yNum);
    setSheetOpen(true);
  };

  const applyWheelDate = () => {
    const dStr = String(wheelDay).padStart(2, '0');
    const mStr = String(wheelMonth).padStart(2, '0');
    const yStr = String(wheelYear);
    setDay(dStr);
    setMonth(mStr);
    setYear(yStr);
    notifyChange(dStr, mStr, yStr);
    setSheetOpen(false);
  };

  const daysInWheelMonth = getDaysInMonth(wheelYear, wheelMonth);

  // Generate Year options
  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  // Generate Day options
  const days = [];
  for (let d = 1; d <= daysInWheelMonth; d++) {
    days.push(d);
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-2">
        {/* 3 numeric boxes: DD / MM / YYYY */}
        <div
          className={`flex items-center flex-1 rounded-xl border bg-[var(--surface-subtle)] px-3 py-2.5 transition-all ${
            error
              ? 'border-red-500 ring-2 ring-red-200'
              : 'border-[var(--border)] focus-within:border-[#1b4f9c] focus-within:ring-2 focus-within:ring-[#1b4f9c]/20'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {/* Day box */}
          <input
            id={`${id}-day`}
            ref={dayRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            disabled={disabled}
            value={day}
            onChange={handleDayChange}
            onKeyDown={(e) => handleKeyDown('day', e)}
            onPaste={handlePaste}
            onBlur={onBlur}
            placeholder="DD"
            aria-label="Birth day (DD)"
            className="w-8 text-center text-sm font-semibold bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          <span className="text-[var(--text-muted)] select-none font-bold">/</span>

          {/* Month box */}
          <input
            id={`${id}-month`}
            ref={monthRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={2}
            disabled={disabled}
            value={month}
            onChange={handleMonthChange}
            onKeyDown={(e) => handleKeyDown('month', e)}
            onPaste={handlePaste}
            onBlur={onBlur}
            placeholder="MM"
            aria-label="Birth month (MM)"
            className="w-8 text-center text-sm font-semibold bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
          />
          <span className="text-[var(--text-muted)] select-none font-bold">/</span>

          {/* Year box */}
          <input
            id={`${id}-year`}
            ref={yearRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            disabled={disabled}
            value={year}
            onChange={handleYearChange}
            onKeyDown={(e) => handleKeyDown('year', e)}
            onPaste={handlePaste}
            onBlur={onBlur}
            placeholder="YYYY"
            aria-label="Birth year (YYYY)"
            className="w-14 text-center text-sm font-semibold bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] focus:outline-none"
          />
        </div>

        {/* Calendar Picker Trigger Button */}
        <button
          type="button"
          onClick={openSheet}
          disabled={disabled}
          title="Pick date from calendar"
          aria-label="Open date of birth calendar picker"
          className="h-11 px-3.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] hover:bg-[var(--border)]/20 text-[var(--text-main)] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <svg className="w-5 h-5 text-[#1b4f9c] dark:text-[#5c9dff]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
      )}

      {/* Date Picker Bottom Sheet */}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Select Date of Birth"
      >
        <div className="p-4 sm:p-6 flex flex-col gap-6">
          <p className="text-xs text-[var(--text-muted)] text-center">
            Must be at least 16 years old to open an account.
          </p>

          {/* 3 Wheel selectors */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 bg-black/5 dark:bg-white/5 p-3 rounded-2xl">
            {/* Day Wheel */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Day</span>
              <div className="h-44 w-full overflow-y-auto snap-y snap-mandatory border border-[var(--border)] rounded-xl bg-[var(--surface)] p-1 text-center scrollbar-thin">
                {days.map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setWheelDay(d)}
                    className={`w-full py-2 text-xs font-semibold rounded-lg snap-center transition-colors cursor-pointer ${
                      wheelDay === d
                        ? 'bg-[#1b4f9c] text-white'
                        : 'text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {String(d).padStart(2, '0')}
                  </button>
                ))}
              </div>
            </div>

            {/* Month Wheel */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Month</span>
              <div className="h-44 w-full overflow-y-auto snap-y snap-mandatory border border-[var(--border)] rounded-xl bg-[var(--surface)] p-1 text-center scrollbar-thin">
                {MONTH_NAMES.map((name, idx) => {
                  const mNum = idx + 1;
                  return (
                    <button
                      key={mNum}
                      type="button"
                      onClick={() => {
                        setWheelMonth(mNum);
                        const maxForNewMonth = getDaysInMonth(wheelYear, mNum);
                        if (wheelDay > maxForNewMonth) setWheelDay(maxForNewMonth);
                      }}
                      className={`w-full py-2 text-xs font-semibold rounded-lg snap-center transition-colors cursor-pointer truncate px-1 ${
                        wheelMonth === mNum
                          ? 'bg-[#1b4f9c] text-white'
                          : 'text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                      }`}
                    >
                      {name.slice(0, 3)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Year Wheel */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Year</span>
              <div className="h-44 w-full overflow-y-auto snap-y snap-mandatory border border-[var(--border)] rounded-xl bg-[var(--surface)] p-1 text-center scrollbar-thin">
                {years.map(y => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setWheelYear(y);
                      const maxForNewYear = getDaysInMonth(y, wheelMonth);
                      if (wheelDay > maxForNewYear) setWheelDay(maxForNewYear);
                    }}
                    className={`w-full py-2 text-xs font-semibold rounded-lg snap-center transition-colors cursor-pointer ${
                      wheelYear === y
                        ? 'bg-[#1b4f9c] text-white'
                        : 'text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Current Selection & Confirmation */}
          <div className="flex flex-col gap-3">
            <div className="text-center font-medium text-sm text-[var(--text-main)]">
              Selected: <span className="font-bold text-[#1b4f9c] dark:text-[#5c9dff]">
                {String(wheelDay).padStart(2, '0')} {MONTH_NAMES[wheelMonth - 1]} {wheelYear}
              </span>
            </div>
            <Button
              type="button"
              variant="primary"
              fullWidth
              onClick={applyWheelDate}
            >
              Confirm Date
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
