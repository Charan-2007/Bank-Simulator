import crypto from 'node:crypto';

/**
 * Generates an account number in format "NB" + 10 random digits
 * Example: "NB8392019482"
 */
export function generateAccountNumber() {
  // Generate 5 random bytes (10 hex characters or random digits)
  // To ensure pure digits:
  let digits = '';
  while (digits.length < 10) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < 250) { // Unbiased modulo
      digits += (byte % 10).toString();
    }
  }
  return `NB${digits}`;
}
