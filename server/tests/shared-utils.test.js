import { describe, it, expect } from 'vitest';
import {
  isLeapYear,
  getDaysInMonth,
  isValidGregorianDate,
  validateBirthDate,
  parsePastedDate,
  calculateAgeInKolkata
} from '../../shared/dateUtils.js';
import {
  normalizeIndianPhone,
  formatIndianPhone,
  validateIndianPhone
} from '../../shared/phoneUtils.js';

describe('Shared Date Utilities', () => {
  it('correctly identifies leap years', () => {
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(2008)).toBe(true);
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2023)).toBe(false);
    expect(isLeapYear(2009)).toBe(false);
  });

  it('validates days in month including Feb 29 on leap years', () => {
    expect(getDaysInMonth(2008, 2)).toBe(29);
    expect(getDaysInMonth(2009, 2)).toBe(28);
    expect(isValidGregorianDate(29, 2, 2008)).toBe(true);
    expect(isValidGregorianDate(29, 2, 2009)).toBe(false);
    expect(isValidGregorianDate(31, 4, 2024)).toBe(false); // April has 30 days
  });

  it('validates age >= 16 in Asia/Kolkata timezone', () => {
    const validResult = validateBirthDate(1, 1, 2000, 16);
    expect(validResult.valid).toBe(true);

    const underageResult = validateBirthDate(1, 1, 2020, 16);
    expect(underageResult.valid).toBe(false);
    expect(underageResult.error).toContain('at least 16 years old');

    const futureResult = validateBirthDate(1, 1, 2099, 16);
    expect(futureResult.valid).toBe(false);
  });

  it('parses pasted date strings in DD/MM/YYYY, DD-MM-YYYY, and DDMMYYYY formats', () => {
    expect(parsePastedDate('29/02/2008')).toEqual({ day: '29', month: '02', year: '2008' });
    expect(parsePastedDate('15-08-1995')).toEqual({ day: '15', month: '08', year: '1995' });
    expect(parsePastedDate('01012000')).toEqual({ day: '01', month: '01', year: '2000' });
    expect(parsePastedDate('invalid')).toBeNull();
  });
});

describe('Shared Phone Utilities', () => {
  it('normalizes various Indian phone formats to canonical +91XXXXXXXXXX', () => {
    expect(normalizeIndianPhone('+91 98765 43210')).toBe('+919876543210');
    expect(normalizeIndianPhone('098765 43210')).toBe('+919876543210');
    expect(normalizeIndianPhone('9876543210')).toBe('+919876543210');
    expect(normalizeIndianPhone('+919876543210')).toBe('+919876543210');
    expect(normalizeIndianPhone('919876543210')).toBe('+919876543210');
    expect(normalizeIndianPhone('+91-98765-43210')).toBe('+919876543210');
  });

  it('rejects invalid numbers not starting with 6, 7, 8, or 9', () => {
    expect(normalizeIndianPhone('5876543210')).toBeNull();
    expect(normalizeIndianPhone('1876543210')).toBeNull();
    expect(normalizeIndianPhone('98765')).toBeNull();
  });

  it('formats canonical phone with spacing for readable display', () => {
    expect(formatIndianPhone('+919876543210')).toBe('+91 98765 43210');
  });

  it('provides structured validation result', () => {
    expect(validateIndianPhone('9876543210').valid).toBe(true);
    expect(validateIndianPhone('5876543210').valid).toBe(false);
    expect(validateIndianPhone('5876543210').error).toContain('start with 6, 7, 8 or 9');
  });
});
