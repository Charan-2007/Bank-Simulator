import { describe, it, expect } from 'vitest';
import { toPaise, fromPaise } from '../src/utils/paise.js';
import { formatINR } from '../src/utils/formatCurrency.js';

describe('Currency and Money Conversion Logic', () => {
  describe('toPaise (string-based parse without floating point arithmetic)', () => {
    it('converts standard integer rupees to paise', () => {
      expect(toPaise('100')).toBe(10000);
      expect(toPaise('5000')).toBe(500000);
      expect(toPaise(100)).toBe(10000);
    });

    it('converts fractional rupee amounts to exact paise without precision loss', () => {
      expect(toPaise('0.10')).toBe(10);
      expect(toPaise('0.29')).toBe(29);
      expect(toPaise('5000.50')).toBe(500050);
      expect(toPaise('100000.50')).toBe(10000050);
      expect(toPaise('0.5')).toBe(50);
      expect(toPaise('0.05')).toBe(5);
    });

    it('handles commas gracefully', () => {
      expect(toPaise('1,00,000.50')).toBe(10000050);
      expect(toPaise('5,000')).toBe(500000);
    });

    it('rejects invalid, negative, zero, or excess precision input', () => {
      expect(() => toPaise('0')).toThrow(/greater than zero/i);
      expect(() => toPaise('0.00')).toThrow(/greater than zero/i);
      expect(() => toPaise('-50')).toThrow(/invalid amount/i);
      expect(() => toPaise('abc')).toThrow(/invalid amount/i);
      expect(() => toPaise('')).toThrow(/empty/i);
      expect(() => toPaise(null)).toThrow(/required/i);
      expect(() => toPaise('10.125')).toThrow(/more than 2 decimal places/i);
    });
  });

  describe('fromPaise', () => {
    it('formats paise to two-decimal string', () => {
      expect(fromPaise(10)).toBe('0.10');
      expect(fromPaise(29)).toBe('0.29');
      expect(fromPaise(500050)).toBe('5000.50');
      expect(fromPaise(10000050)).toBe('100000.50');
      expect(fromPaise(0)).toBe('0.00');
    });
  });

  describe('formatINR (Indian grouping and rupee symbol)', () => {
    it('formats amounts with Indian grouping', () => {
      expect(formatINR(10)).toBe('₹0.10');
      expect(formatINR(29)).toBe('₹0.29');
      expect(formatINR(2458050)).toBe('₹24,580.50');
      expect(formatINR(10000050)).toBe('₹1,00,000.50');
      expect(formatINR(1000000)).toBe('₹10,000.00');
      expect(formatINR(500000000)).toBe('₹50,00,000.00');
    });

    it('supports sign display options', () => {
      expect(formatINR(5000, { signDisplay: 'always' })).toBe('+₹50.00');
      expect(formatINR(-5000)).toBe('-₹50.00');
    });
  });
});
