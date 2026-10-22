import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Otp } from '../src/models/Otp.js';
import { Transaction } from '../src/models/Transaction.js';
import bcrypt from 'bcrypt';

describe('Boundary & Edge Cases (Part 11)', () => {
  let userA, userB, userPending;
  let tokenA;
  const pinA = '123456';
  const pinB = '654321';

  beforeEach(async () => {
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await Otp.deleteMany({});

    // Create active user A
    const pinHashA = await bcrypt.hash(pinA, 10);
    userA = await User.create({
      name: 'User Boundary A',
      phone: '+917000000088',
      dateOfBirth: new Date('1990-01-01'),
      status: 'active',
      pinHash: pinHashA,
      accountNumber: 'NB7000000088',
      balancePaise: 5000000 // ₹50,000
    });

    // Create active user B
    const pinHashB = await bcrypt.hash(pinB, 10);
    userB = await User.create({
      name: 'User Boundary B',
      phone: '+917000000089',
      dateOfBirth: new Date('1992-05-15'),
      status: 'active',
      pinHash: pinHashB,
      accountNumber: 'NB7000000089',
      balancePaise: 2000000 // ₹20,000
    });

    // Create pending user (never finished setting PIN)
    userPending = await User.create({
      name: 'User Pending C',
      phone: '+917000000099',
      dateOfBirth: new Date('1995-10-10'),
      status: 'pending',
      accountNumber: 'NB7000000099',
      balancePaise: 1000000
    });

    // Log in user A to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ phone: '+91 70000 00088', pin: pinA });
    tokenA = loginRes.body.accessToken;
  });

  describe('1. PIN Lockout Recovery with Controlled Time Advance', () => {
    it('locks account after 5 failed PIN attempts and recovers after lockout time expires', async () => {
      // 5 wrong attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send({ phone: userA.phone, pin: '999999' });
      }

      // 6th attempt -> 423 Locked
      const lockedRes = await request(app)
        .post('/api/auth/login')
        .send({ phone: userA.phone, pin: pinA });
      expect(lockedRes.status).toBe(423);
      expect(lockedRes.body.error.message).toContain('Account is temporarily locked');

      // Controlled time advance: manually set pinLockedUntil to the past
      await User.findByIdAndUpdate(userA._id, {
        pinLockedUntil: new Date(Date.now() - 1000)
      });

      // Now login with correct PIN succeeds and resets lockout
      const recoveredRes = await request(app)
        .post('/api/auth/login')
        .send({ phone: userA.phone, pin: pinA });
      expect(recoveredRes.status).toBe(200);
      expect(recoveredRes.body.accessToken).toBeDefined();

      const refreshedUser = await User.findById(userA._id);
      expect(refreshedUser.failedPinAttempts).toBe(0);
      expect(refreshedUser.pinLockedUntil).toBeNull();
    });
  });

  describe('2. Pending User Excluded from Lookup & Transfers', () => {
    it('excludes pending users from recipient lookup', async () => {
      const res = await request(app)
        .get(`/api/accounts/lookup?phone=${userPending.phone}`)
        .set('Authorization', `Bearer ${tokenA}`);
      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('Recipient account not found');
    });

    it('rejects transfers targeting a pending user', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          recipientPhone: userPending.phone,
          amountPaise: 10000,
          pin: pinA,
          idempotencyKey: 'test-pending-transfer-key'
        });
      expect(res.status).toBe(404);
      expect(res.body.error.message).toContain('Recipient account not found or inactive');
    });
  });

  describe('3. Self-Transfer Rejection', () => {
    it('rejects self-transfer by account number', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          recipientAccount: userA.accountNumber,
          amountPaise: 50000,
          pin: pinA,
          idempotencyKey: 'test-self-acc-key'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Self-transfers are not permitted');
    });

    it('rejects self-transfer by phone number (in any format)', async () => {
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          recipientPhone: '7000000088', // raw 10 digits
          amountPaise: 50000,
          pin: pinA,
          idempotencyKey: 'test-self-phone-key'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('Self-transfers are not permitted');
    });
  });

  describe('4. Exact Set-PIN Error Responses', () => {
    it('returns "PIN already set, log in instead" if user is already active', async () => {
      const res = await request(app)
        .post('/api/auth/pin')
        .send({
          userId: userA._id.toString(),
          pin: '888888',
          confirmPin: '888888'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('PIN already set, log in instead');
    });

    it('returns "OTP not verified or expired, verify again" if userId is missing or invalid', async () => {
      const res = await request(app)
        .post('/api/auth/pin')
        .send({
          pin: '888888',
          confirmPin: '888888'
        });
      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('OTP not verified or expired, verify again');
    });

    it('returns "PINs do not match" if pin and confirmPin differ', async () => {
      const res = await request(app)
        .post('/api/auth/pin')
        .send({
          userId: userPending._id.toString(),
          pin: '123456',
          confirmPin: '654321'
        });
      expect(res.status).toBe(400);
      expect(res.body.error.message).toBe('PINs do not match');
    });
  });

  describe('5. Midnight Asia/Kolkata Daily Limit Boundary', () => {
    it('does not count transfers from previous days towards today daily limit', async () => {
      // Insert a historical transfer for user A with yesterday's timestamp
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000);
      await Transaction.create({
        userId: userA._id,
        type: 'transfer_out',
        amountPaise: 8000000, // ₹80,000 yesterday
        balanceAfterPaise: 5000000,
        counterpartyUserId: userB._id,
        counterpartyName: userB.name,
        status: 'success',
        referenceId: 'NB_HISTORICAL_TRANSFER_1',
        transferId: 'TR_HISTORICAL_1',
        createdAt: yesterday
      });

      // Today, user A sends ₹30,000 (which is <= ₹50,000 txn limit and ₹1,00,000 daily limit)
      const res = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({
          recipientAccount: userB.accountNumber,
          amountPaise: 3000000,
          pin: pinA,
          idempotencyKey: 'test-midnight-boundary-today-1'
        });
      expect(res.status).toBe(200);
      expect(res.body.transferId).toBeDefined();
    });
  });
});
