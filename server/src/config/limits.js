import { SHARED_LIMITS } from '../../../shared/limits.js';

/**
 * Configurable banking limits and rules for NovaBank
 */
export const LIMITS = {
  // Transfer limits
  TRANSFER_MIN_AMOUNT_PAISE: parseInt(process.env.TRANSFER_MIN_AMOUNT_PAISE || '100', 10), // ₹1
  TRANSFER_MAX_AMOUNT_PAISE: parseInt(process.env.TRANSFER_MAX_AMOUNT_PAISE || '5000000', 10), // ₹50,000
  DAILY_TRANSFER_LIMIT_PAISE: parseInt(process.env.DAILY_TRANSFER_LIMIT_PAISE || '10000000', 10), // ₹1,00,000

  // Deposit & Withdrawal limits
  DEPOSIT_MAX_AMOUNT_PAISE: parseInt(process.env.DEPOSIT_MAX_AMOUNT_PAISE || '5000000', 10), // ₹50,000
  STARTING_BALANCE_PAISE: parseInt(process.env.STARTING_BALANCE_PAISE || '1000000', 10), // ₹10,000

  // Age restriction (minimum 16 years old)
  MIN_USER_AGE_YEARS: parseInt(process.env.MIN_USER_AGE_YEARS || String(SHARED_LIMITS.MIN_USER_AGE_YEARS), 10),

  // PIN security & lockout
  PIN_MAX_FAILED_ATTEMPTS: parseInt(process.env.PIN_MAX_FAILED_ATTEMPTS || '5', 10),
  PIN_LOCKOUT_MINUTES: parseInt(process.env.PIN_LOCKOUT_MINUTES || '15', 10),

  // Banking timezone
  TIMEZONE: process.env.TIMEZONE || SHARED_LIMITS.TIMEZONE
};

/**
 * Returns Start-Of-Day Date in Asia/Kolkata timezone
 */
export function getStartOfDayInKolkata(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: LIMITS.TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year').value;
  const month = parts.find(p => p.type === 'month').value;
  const day = parts.find(p => p.type === 'day').value;

  // Asia/Kolkata is UTC+05:30. Midnight in IST is (00:00:00 +05:30) = (previous day 18:30:00Z)
  return new Date(`${year}-${month}-${day}T00:00:00.000+05:30`);
}
