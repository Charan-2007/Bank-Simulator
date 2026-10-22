import { z } from 'zod';
import { LIMITS } from '../config/limits.js';
import { validateBirthDate, formatToIso } from '../../../shared/dateUtils.js';
import { normalizeIndianPhone, CANONICAL_PHONE_REGEX } from '../../../shared/phoneUtils.js';

const pinRegex = /^\d{6}$/;
const otpRegex = /^\d{6}$/;

const phoneField = z
  .string()
  .trim()
  .transform(val => normalizeIndianPhone(val))
  .refine(val => val !== null && CANONICAL_PHONE_REGEX.test(val), {
    message: 'Valid Indian mobile number (+91 followed by 10 digits starting with 6-9) is required'
  });

const dobField = z
  .string()
  .trim()
  .transform(val => {
    if (!val) return val;
    if (val.includes('/')) {
      const parts = val.split('/').map(Number);
      if (parts.length === 3 && parts[2] > 1000) {
        return formatToIso(parts[0], parts[1], parts[2]);
      }
    } else if (val.includes('-')) {
      const parts = val.split('-').map(Number);
      if (parts.length === 3) {
        if (parts[0] > 1000) {
          return val; // Already YYYY-MM-DD
        } else if (parts[2] > 1000) {
          return formatToIso(parts[0], parts[1], parts[2]); // DD-MM-YYYY
        }
      }
    }
    return val;
  })
  .refine(val => {
    const parts = val.split('-');
    if (parts.length !== 3) return false;
    const [y, m, d] = parts.map(Number);
    const result = validateBirthDate(d, m, y, LIMITS.MIN_USER_AGE_YEARS, 100);
    return result.valid;
  }, {
    message: `User must be between ${LIMITS.MIN_USER_AGE_YEARS} and 100 years old with a valid Gregorian date`
  });

export const registerSchema = z.object({
  name: z
    .string()
    .transform(val => val.replace(/\s+/g, ' ').trim())
    .refine(val => /^[A-Za-z\s]{2,100}$/.test(val), {
      message: 'Name must be 2-100 characters containing letters and spaces only'
    }),
  dateOfBirth: dobField,
  phone: phoneField,
  nationality: z.string().trim().optional().default('Indian')
});

export const otpRequestSchema = z.object({
  phone: phoneField
});

export const otpVerifySchema = z.object({
  phone: phoneField,
  otp: z.string().trim().regex(otpRegex, 'OTP must be a 6-digit number')
});

export const setPinSchema = z
  .object({
    pin: z.string().trim().regex(pinRegex, 'PIN must be a 6-digit number'),
    confirmPin: z.string().trim().regex(pinRegex, 'Confirm PIN must be a 6-digit number').optional(),
    userId: z.string().optional()
  })
  .refine(data => !data.confirmPin || data.pin === data.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin']
  });

export const changePinSchema = z
  .object({
    currentPin: z.string().trim().regex(pinRegex, 'Current PIN must be a 6-digit number'),
    newPin: z.string().trim().regex(pinRegex, 'New PIN must be a 6-digit number'),
    confirmPin: z.string().trim().regex(pinRegex, 'Confirm PIN must be a 6-digit number')
  })
  .refine(data => data.newPin === data.confirmPin, {
    message: 'New PIN and Confirm PIN must match',
    path: ['confirmPin']
  });

export const loginSchema = z.object({
  phone: phoneField,
  pin: z.string().trim().regex(pinRegex, 'PIN must be a 6-digit number')
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().trim().min(1, 'Refresh token is required')
});
