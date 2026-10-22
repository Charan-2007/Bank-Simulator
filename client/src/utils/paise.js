/**
 * Utility functions for precise currency handling without floating-point errors.
 * All monetary amounts in the API are stored and transferred as integer paise.
 */

/**
 * Converts a typed rupee string to integer paise strictly using string parsing and integer arithmetic.
 * Never uses floating-point multiplication (e.g. 0.1 + 0.2 is impossible).
 * 
 * Rules:
 * - Accepts strings or numbers
 * - Rejects empty, negative, non-numeric, or zero amounts
 * - Accepts at most 2 decimal places
 * - Returns a positive integer representing paise
 */
export function toPaise(rupeesInput) {
  if (rupeesInput === undefined || rupeesInput === null) {
    throw new Error('Amount is required');
  }

  const rawStr = String(rupeesInput).trim().replace(/,/g, '');
  if (!rawStr) {
    throw new Error('Amount cannot be empty');
  }

  // Strictly match positive numbers with at most 2 decimals
  const match = rawStr.match(/^(\d+)(?:\.(\d+))?$/);
  if (!match) {
    throw new Error('Invalid amount: please enter a valid positive number');
  }

  const [, integerPart, decimalPart = ''] = match;

  if (decimalPart.length > 2) {
    throw new Error('Amount cannot have more than 2 decimal places');
  }

  const paddedDecimal = decimalPart.padEnd(2, '0');
  const rupeesInt = parseInt(integerPart, 10);
  const paiseInt = parseInt(paddedDecimal, 10);

  const totalPaise = rupeesInt * 100 + paiseInt;

  if (totalPaise <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  return totalPaise;
}

/**
 * Converts integer paise to a two-decimal rupee string using integer math.
 * e.g. 10000050 -> "100000.50"
 */
export function fromPaise(paise) {
  if (typeof paise !== 'number' || isNaN(paise)) {
    return '0.00';
  }
  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const r = Math.floor(absPaise / 100);
  const p = String(absPaise % 100).padStart(2, '0');
  return `${isNegative ? '-' : ''}${r}.${p}`;
}
