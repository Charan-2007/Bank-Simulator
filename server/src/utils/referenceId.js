import crypto from 'node:crypto';

/**
 * Generates unique transaction reference ID
 * Format: "NB" + YYYYMMDDHHMMSS + 6 random hex characters
 * Example: "NB20261019124501A7C2E9"
 */
export function generateReferenceId() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const secs = String(now.getSeconds()).padStart(2, '0');
  const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();

  return `NB${year}${month}${day}${hours}${mins}${secs}${randomHex}`;
}
