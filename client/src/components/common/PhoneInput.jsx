import React, { useState, useEffect } from 'react';
import { normalizeIndianPhone, formatIndianPhone, NATIONAL_PHONE_REGEX } from '@shared/phoneUtils.js';

export default function PhoneInput({
  value = '',
  onChange,
  onBlur,
  disabled = false,
  error = '',
  autoFocus = false,
  id = 'phone-input',
  name = 'phone',
  placeholder = '98765 43210',
  className = ''
}) {
  // Extract the 10 national digits from the incoming value
  const extractNational = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (str.startsWith('+91')) {
      return str.slice(3).replace(/\D/g, '').slice(0, 10);
    }
    const canonical = normalizeIndianPhone(str);
    if (canonical) return canonical.slice(3);
    const digits = str.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) return digits.slice(2, 12);
    if (digits.startsWith('0') && digits.length > 10) return digits.slice(1, 11);
    return digits.slice(0, 10);
  };

  const [national, setNational] = useState(() => extractNational(value));

  useEffect(() => {
    setNational(extractNational(value));
  }, [value]);

  const formatDisplay = (digits) => {
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    // Strip non-digits
    let digits = rawVal.replace(/\D/g, '');

    // Handle full paste like 919876543210 or 09876543210
    if (digits.startsWith('91') && digits.length > 10) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0') && digits.length > 10) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);

    setNational(digits);

    const isValid = digits.length === 10 && NATIONAL_PHONE_REGEX.test(digits);
    const canonical = isValid ? `+91${digits}` : (digits ? `+91${digits}` : '');

    if (onChange) {
      onChange(canonical, isValid, digits);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    let digits = pastedText.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length >= 12) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0') && digits.length >= 11) {
      digits = digits.slice(1);
    }
    digits = digits.slice(0, 10);
    setNational(digits);

    const isValid = digits.length === 10 && NATIONAL_PHONE_REGEX.test(digits);
    const canonical = isValid ? `+91${digits}` : (digits ? `+91${digits}` : '');
    if (onChange) {
      onChange(canonical, isValid, digits);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <div
        className={`relative flex items-center w-full rounded-xl border bg-[var(--surface-subtle)] transition-all ${
          error
            ? 'border-red-500 focus-within:ring-2 focus-within:ring-red-200'
            : 'border-[var(--border)] focus-within:border-[#1b4f9c] focus-within:ring-2 focus-within:ring-[#1b4f9c]/20'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Country code prefix pill */}
        <div className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-3 border-r border-[var(--border)] text-[var(--text-main)] font-semibold text-sm select-none shrink-0 bg-black/5 dark:bg-white/5 rounded-l-xl">
          <span className="text-base" role="img" aria-label="India flag">🇮🇳</span>
          <span>+91</span>
        </div>

        {/* 10-digit National Input */}
        <input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          maxLength={11} // 10 digits + 1 space
          disabled={disabled}
          autoFocus={autoFocus}
          value={formatDisplay(national)}
          onChange={handleInputChange}
          onPaste={handlePaste}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-label="10-digit Indian mobile number"
          className="w-full px-3.5 py-3 bg-transparent text-[var(--text-main)] placeholder-[var(--text-muted)] text-sm font-medium tracking-wider focus:outline-none disabled:cursor-not-allowed"
        />

        {/* Clear or valid badge */}
        {national.length === 10 && NATIONAL_PHONE_REGEX.test(national) && (
          <div className="pr-3 text-emerald-500 shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
