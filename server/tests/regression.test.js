import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Otp } from '../src/models/Otp.js';
import { Transaction } from '../src/models/Transaction.js';
import { resetRateLimiters } from '../src/middleware/rateLimiter.js';
import bcrypt from 'bcrypt';

describe('Production Bug Regressions & Rate Limiting Verification', () => {
  beforeEach(async () => {
    resetRateLimiters();
    await User.deleteMany({});
    await Otp.deleteMany({});
    await Transaction.deleteMany({});
  });

  // 1. OTP correct code on non-reserved number with limiters active
  it('1. OTP correct code on non-reserved number succeeds with limiters active', async () => {
    const phone = '+917100000010';
    // Register
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'Real User Test',
      dateOfBirth: '1995-06-20',
      phone,
      nationality: 'Indian'
    });
    expect(regRes.status).toBe(201);
    const devOtp = regRes.body.devOtp;
    expect(devOtp).toMatch(/^\d{6}$/);

    // Verify OTP using exact code
    const verifyRes = await request(app).post('/api/auth/otp/verify').send({
      phone,
      otp: devOtp
    });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.tempToken).toBeDefined();

    // Set PIN
    const pinRes = await request(app)
      .post('/api/auth/pin')
      .set('Authorization', `Bearer ${verifyRes.body.tempToken}`)
      .send({ pin: '456789' });
    expect(pinRes.status).toBe(200);
    expect(pinRes.body.user.status).toBe('active');
  });

  // 2. 10 OTP attempts across 2 minutes from 1 IP for different numbers (not blocked)
  it('2. 10 OTP attempts from 1 IP for different numbers are not blocked', async () => {
    for (let i = 1; i <= 10; i++) {
      const phone = `+9171000000${10 + i}`;
      const res = await request(app).post('/api/auth/otp/request').send({ phone });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });

  // 3. 6 wrong OTP guesses for 1 number (blocked with 429/lock message)
  it('3. 6 wrong OTP guesses for 1 number is blocked with 429 / limit message', async () => {
    const phone = '+917100000050';
    // Request OTP first
    await request(app).post('/api/auth/otp/request').send({ phone });

    // Send 5 wrong OTP guesses
    for (let i = 1; i <= 5; i++) {
      const res = await request(app).post('/api/auth/otp/verify').send({
        phone,
        otp: '000000'
      });
      // Should fail either with 400 (wrong code) or 429
      expect([400, 429]).toContain(res.status);
    }

    // 6th guess must be blocked with 429 (or lockout message)
    const res6 = await request(app).post('/api/auth/otp/verify').send({
      phone,
      otp: '000000'
    });
    expect([429, 400]).toContain(res6.status);
    if (res6.status === 429) {
      expect(res6.body.error.message).toMatch(/Too many attempts|wait/i);
    } else {
      expect(res6.body.error.message).toMatch(/Maximum OTP verification attempts exceeded/i);
    }
  });

  // 4. Register same number twice (409 message text)
  it('4. Register same number twice returns 409 with exact message text', async () => {
    const phone = '+917100000060';
    const regRes = await request(app).post('/api/auth/register').send({
      name: 'First Register',
      dateOfBirth: '1992-04-12',
      phone,
      nationality: 'Indian'
    });
    expect(regRes.status).toBe(201);

    // Complete activation
    await request(app).post('/api/auth/pin').send({
      userId: regRes.body.user.id,
      pin: '654321'
    });

    // Register same number again
    const dupeRes = await request(app).post('/api/auth/register').send({
      name: 'Duplicate Register',
      dateOfBirth: '1992-04-12',
      phone,
      nationality: 'Indian'
    });

    expect(dupeRes.status).toBe(409);
    expect(dupeRes.body.error.message).toBe('This number is already registered. Log in instead.');
  });

  // 5. Register with double-space name and DD/MM/YYYY DOB
  it('5. Register with double-space name and DD/MM/YYYY DOB succeeds with collapsed whitespace', async () => {
    const phone = '+917100000070';
    const res = await request(app).post('/api/auth/register').send({
      name: 'charan  gffff',
      dateOfBirth: '05/04/1940',
      phone,
      nationality: 'Indian'
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // Double space collapsed to single space
    expect(res.body.user.name).toBe('charan gffff');

    const dbUser = await User.findOne({ phone });
    expect(dbUser).toBeDefined();
    expect(dbUser.name).toBe('charan gffff');
  });

  // 6. Two users with shared phone prefixes sending to each other by phone, account, and QR
  it('6. Two users with shared phone prefixes can send to each other by phone, account, and QR', async () => {
    // Both users share prefix +9171000000
    const phone1 = '+917100000081';
    const phone2 = '+917100000082';

    const hash1 = await bcrypt.hash('123456', 10);
    const hash2 = await bcrypt.hash('654321', 10);

    const user1 = await User.create({
      name: 'Prefix User One',
      phone: phone1,
      dateOfBirth: new Date('1990-01-01'),
      status: 'active',
      pinHash: hash1,
      accountNumber: 'NB7100000081',
      balancePaise: 5000000 // ₹50,000
    });

    const user2 = await User.create({
      name: 'Prefix User Two',
      phone: phone2,
      dateOfBirth: new Date('1992-02-02'),
      status: 'active',
      pinHash: hash2,
      accountNumber: 'NB7100000082',
      balancePaise: 3000000 // ₹30,000
    });

    // Login user 1
    const login1 = await request(app).post('/api/auth/login').send({ phone: phone1, pin: '123456' });
    const token1 = login1.body.accessToken;

    // Login user 2
    const login2 = await request(app).post('/api/auth/login').send({ phone: phone2, pin: '654321' });
    const token2 = login2.body.accessToken;

    // Transfer 1: User 1 -> User 2 by phone
    const txByPhone = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        recipientPhone: phone2,
        amountPaise: 50000, // ₹500
        pin: '123456'
      });
    expect(txByPhone.status).toBe(200);
    expect(txByPhone.body.success).toBe(true);

    // Transfer 2: User 2 -> User 1 by account
    const txByAccount = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        recipientAccount: user1.accountNumber,
        amountPaise: 30000, // ₹300
        pin: '654321'
      });
    expect(txByAccount.status).toBe(200);
    expect(txByAccount.body.success).toBe(true);

    // Transfer 3: User 1 -> User 2 via QR payload (account resolution)
    const qrPayload = {
      type: 'novabank',
      accountNumber: user2.accountNumber,
      name: user2.name
    };
    const txByQr = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        recipientAccount: qrPayload.accountNumber,
        amountPaise: 20000, // ₹200
        pin: '123456'
      });
    expect(txByQr.status).toBe(200);
    expect(txByQr.body.success).toBe(true);
  });

  // 7. Self-transfer in every form blocked with clear message
  it('7. Self-transfer in every form (phone, account) is blocked with clear message', async () => {
    const phone = '+917100000095';
    const pin = '112233';
    const pinHash = await bcrypt.hash(pin, 10);

    const user = await User.create({
      name: 'Self Transfer Test',
      phone,
      dateOfBirth: new Date('1991-01-01'),
      status: 'active',
      pinHash,
      accountNumber: 'NB7100000095',
      balancePaise: 1000000
    });

    const loginRes = await request(app).post('/api/auth/login').send({ phone, pin });
    const token = loginRes.body.accessToken;

    // Form A: Send to own phone
    const resPhone = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipientPhone: phone,
        amountPaise: 10000,
        pin
      });
    expect(resPhone.status).toBe(400);
    expect(resPhone.body.error.message).toMatch(/Self-transfers are not permitted/i);

    // Form B: Send to own account
    const resAcc = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        recipientAccount: user.accountNumber,
        amountPaise: 10000,
        pin
      });
    expect(resAcc.status).toBe(400);
    expect(resAcc.body.error.message).toMatch(/Self-transfers are not permitted/i);
  });
});
