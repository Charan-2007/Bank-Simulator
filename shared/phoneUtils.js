/**
 * Shared Indian phone normalization and formatting utility
 */

export const NATIONAL_PHONE_REGEX = /^[6-9]\d{9}$/;
export const CANONICAL_PHONE_REGEX = /^\+91[6-9]\d{9}$/;

/**
 * Normalizes input phone to canonical +91XXXXXXXXXX
 * Handles:
 * - "+91 98765 43210" -> "+919876543210"
 * - "098765 43210" -> "+919876543210"
 * - "9876543210" -> "+919876543210"
 * - "+919876543210" -> "+919876543210"
 *
 * Returns canonical phone string or null if invalid.
 */
export function normalizeIndianPhone(input) {
  if (!input || typeof input !== 'string') return null;
  const raw = input.trim();
  if (!raw) return null;

  // Extract digits only
  const digits = raw.replace(/\D/g, '');

  let national = digits;

  // 1. If 12 digits starting with 91, strip 91
  if (digits.length === 12 && digits.startsWith('91')) {
    national = digits.slice(2);
  }
  // 2. If 11 digits starting with 0, strip 0
  else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  }

  // 3. Must be exactly 10 digits
  if (national.length !== 10) {
    return null;
  }

  // 4. Must start with 6, 7, 8, or 9
  if (!NATIONAL_PHONE_REGEX.test(national)) {
    return null;
  }

  return `+91${national}`;
}

/**
 * Formats a canonical or national phone as "+91 98765 43210"
 */
export function formatIndianPhone(phone) {
  const canonical = normalizeIndianPhone(phone);
  if (!canonical) return phone || '';
  const national = canonical.slice(3); // remove +91
  return `+91 ${national.slice(0, 5)} ${national.slice(5)}`;
}

/**
 * Returns structured validation result with exact messages
 */
export function validateIndianPhone(input) {
  if (!input || typeof input !== 'string') {
    return { valid: false, error: 'Enter a 10-digit mobile number' };
  }

  const digits = input.replace(/\D/g, '');
  let national = digits;

  if (digits.length === 12 && digits.startsWith('91')) {
    national = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    national = digits.slice(1);
  }

  if (national.length !== 10) {
    return { valid: false, error: 'Enter a 10-digit mobile number' };
  }

  if (!NATIONAL_PHONE_REGEX.test(national)) {
    return { valid: false, error: 'Mobile numbers start with 6, 7, 8 or 9' };
  }

  return {
    valid: true,
    error: null,
    national,
    canonical: `+91${national}`,
    formatted: `+91 ${national.slice(0, 5)} ${national.slice(5)}`
  };
}
