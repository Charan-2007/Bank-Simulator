import { fromPaise } from './paise.js';

/**
 * Formats integer paise into standard Indian Rupee representation (en-IN).
 * e.g. 2458050 -> "₹24,580.50"
 *      10000050 -> "₹1,00,000.50"
 *      10 -> "₹0.10"
 *      29 -> "₹0.29"
 */
export function formatINR(paise, { showSymbol = true, signDisplay = 'auto' } = {}) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return showSymbol ? '₹0.00' : '0.00';
  }

  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupeeString = fromPaise(absPaise);
  const [intPart, decPart] = rupeeString.split('.');

  // Format integer part using Indian number system (3 digits, then 2 digits)
  // e.g. 100000 -> 1,00,000
  let lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  const formattedAmount = `${formattedInteger}.${decPart}`;

  let sign = '';
  if (isNegative) {
    sign = '-';
  } else if (signDisplay === 'always' && paise > 0) {
    sign = '+';
  }

  return showSymbol ? `${sign}₹${formattedAmount}` : `${sign}${formattedAmount}`;
}
