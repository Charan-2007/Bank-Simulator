import crypto from 'node:crypto';

/**
 * Generates fictional demo card number with unassigned prefix 9000
 * Format: "9000 1234 5678 9012"
 */
export function generateDemoCardNumber() {
  const genGroup = () => {
    let digits = '';
    while (digits.length < 4) {
      const b = crypto.randomBytes(1)[0];
      if (b < 250) {
        digits += (b % 10).toString();
      }
    }
    return digits;
  };

  return `9000 ${genGroup()} ${genGroup()} ${genGroup()}`;
}

export const generateCardNumber = generateDemoCardNumber;

/**
 * Masks a 16-digit card number
 * Example: "9000 1234 5678 9012" -> "•••• •••• •••• 9012"
 */
export function maskCardNumber(cardNumber) {
  if (!cardNumber) return '•••• •••• •••• ••••';
  const clean = cardNumber.replace(/\s+/g, '');
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}
