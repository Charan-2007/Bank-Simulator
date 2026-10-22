import { z } from 'zod';
import { LIMITS } from '../config/limits.js';
import { normalizeIndianPhone, CANONICAL_PHONE_REGEX } from '../../../shared/phoneUtils.js';

const accountRegex = /^NB\d{10}$/;
const pinRegex = /^\d{6}$/;

const recipientPhoneField = z
  .string()
  .trim()
  .transform(val => normalizeIndianPhone(val))
  .refine(val => val !== null && CANONICAL_PHONE_REGEX.test(val), {
    message: 'Invalid recipient Indian mobile phone format'
  })
  .optional();

export const transferSchema = z
  .object({
    recipientPhone: recipientPhoneField,
    recipientAccount: z.string().trim().regex(accountRegex, 'Invalid recipient account format').optional(),
    amountPaise: z
      .number({ invalid_type_error: 'Amount must be a number' })
      .int('Amount must be an integer')
      .min(LIMITS.TRANSFER_MIN_AMOUNT_PAISE, `Minimum transfer is ₹${LIMITS.TRANSFER_MIN_AMOUNT_PAISE / 100}`)
      .max(LIMITS.TRANSFER_MAX_AMOUNT_PAISE, `Maximum transfer is ₹${LIMITS.TRANSFER_MAX_AMOUNT_PAISE / 100}`),
    note: z.string().trim().max(200, 'Note cannot exceed 200 characters').optional().default(''),
    pin: z.string().trim().regex(pinRegex, 'PIN must be a 6-digit number'),
    idempotencyKey: z.string().trim().min(8, 'Idempotency key must be at least 8 characters').optional()
  })
  .refine(data => Boolean(data.recipientPhone || data.recipientAccount), {
    message: 'Either recipientPhone or recipientAccount must be provided',
    path: ['recipientAccount']
  });

export const depositSchema = z.object({
  amountPaise: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .int('Amount must be an integer')
    .min(100, 'Minimum deposit is ₹1')
    .max(LIMITS.DEPOSIT_MAX_AMOUNT_PAISE, `Maximum deposit is ₹${LIMITS.DEPOSIT_MAX_AMOUNT_PAISE / 100}`),
  idempotencyKey: z.string().trim().min(8).optional()
});

export const withdrawSchema = z.object({
  amountPaise: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .int('Amount must be an integer')
    .min(100, 'Minimum withdrawal is ₹1')
    .max(LIMITS.DEPOSIT_MAX_AMOUNT_PAISE, `Maximum withdrawal is ₹${LIMITS.DEPOSIT_MAX_AMOUNT_PAISE / 100}`),
  idempotencyKey: z.string().trim().min(8).optional()
});

export const transactionQuerySchema = z.object({
  filter: z.enum(['all', 'money_in', 'money_out']).optional().default('all'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20)
});

export const recipientLookupSchema = z
  .object({
    phone: recipientPhoneField,
    account: z.string().trim().regex(accountRegex).optional()
  })
  .refine(data => Boolean(data.phone || data.account), {
    message: 'Either phone or account query parameter must be provided'
  });
