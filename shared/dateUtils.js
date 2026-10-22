import { SHARED_LIMITS } from './limits.js';

export function getKolkataToday() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: SHARED_LIMITS.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(new Date());
  return {
    year: parseInt(parts.find(p => p.type === 'year').value, 10),
    month: parseInt(parts.find(p => p.type === 'month').value, 10),
    day: parseInt(parts.find(p => p.type === 'day').value, 10)
  };
}

export function isLeapYear(year) {
  if (!year || isNaN(year)) return false;
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year, month) {
  if (month < 1 || month > 12) return 0;
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

export function isValidGregorianDate(day, month, year) {
  if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
    return false;
  }
  if (year < 1900 || year > 2200) return false;
  if (month < 1 || month > 12) return false;
  const maxDays = getDaysInMonth(year, month);
  if (day < 1 || day > maxDays) return false;
  return true;
}

export function isFutureDate(day, month, year) {
  const today = getKolkataToday();
  if (year > today.year) return true;
  if (year === today.year) {
    if (month > today.month) return true;
    if (month === today.month && day > today.day) return true;
  }
  return false;
}

export function calculateAgeInKolkata(day, month, year) {
  const today = getKolkataToday();
  let age = today.year - year;
  if (today.month < month || (today.month === month && today.day < day)) {
    age--;
  }
  return age;
}

export function validateBirthDate(day, month, year, minAge = SHARED_LIMITS.MIN_USER_AGE_YEARS, maxAge = 100) {
  if (!isValidGregorianDate(day, month, year)) {
    return { valid: false, error: 'Enter a valid date' };
  }
  if (isFutureDate(day, month, year)) {
    return { valid: false, error: 'Enter a valid date' };
  }
  const age = calculateAgeInKolkata(day, month, year);
  if (age < minAge) {
    return { valid: false, error: `You must be at least ${minAge} years old` };
  }
  if (age > maxAge) {
    return { valid: false, error: `Age cannot exceed ${maxAge} years` };
  }
  return { valid: true, error: null, age };
}

export function parsePastedDate(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim();

  // 1. DD/MM/YYYY
  let match = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match) {
    return {
      day: match[1].padStart(2, '0'),
      month: match[2].padStart(2, '0'),
      year: match[3]
    };
  }

  // 2. DD-MM-YYYY
  match = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match) {
    return {
      day: match[1].padStart(2, '0'),
      month: match[2].padStart(2, '0'),
      year: match[3]
    };
  }

  // 3. DDMMYYYY (8 digits)
  match = clean.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (match) {
    return {
      day: match[1],
      month: match[2],
      year: match[3]
    };
  }

  return null;
}

export function formatToIso(day, month, year) {
  const d = String(day).padStart(2, '0');
  const m = String(month).padStart(2, '0');
  const y = String(year);
  return `${y}-${m}-${d}`;
}

export function formatToIndian(day, month, year) {
  const d = String(day).padStart(2, '0');
  const m = String(month).padStart(2, '0');
  const y = String(year);
  return `${d}/${m}/${y}`;
}
