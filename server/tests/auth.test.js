import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Otp } from '../src/models/Otp.js';

describe('Auth Endpoints & Business Logic', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Otp.deleteMany({});
  });

  const validUserData = {
    name: 'Charan Test',
    dateOfBirth: '2000-01-15',
    phone: '+919876543210',
    nationality: 'Indian'
  };

  it('1. Register valid user -> creates user with status: "pending"', async () => {
    const res = await request(app).post('/api/auth/register').send(validUserData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.status).toBe('pending');
    expect(res.body.user.phone).toBe(validUserData.phone);
    expect(res.body.user.accountNumber).toMatch(/^NB\d{10}$/);

    const dbUser = await User.findOne({ phone: validUserData.phone });
    expect(dbUser).toBeDefined();
    expect(dbUser.status).toBe('pending');
  });

  it('2. Register existing phone while pending -> succeeds (restarts pending registration)', async () => {
    await request(app).post('/api/auth/register').send(validUserData);

    const restartData = {
      ...validUserData,
      name: 'Charan Restarted'
    };
    const res = await request(app).post('/api/auth/register').send(restartData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.isRestart).toBe(true);
    expect(res.body.user.name).toBe('Charan Restarted');
    expect(res.body.user.status).toBe('pending');
  });

  it('3. Register existing phone while active -> 409 Conflict', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    const userId = regRes.body.user.id;

    // Activate user
    await request(app).post('/api/auth/pin').send({ userId, pin: '123456' });

    // Attempt to register again
    const res = await request(app).post('/api/auth/register').send(validUserData);
    expect(res.status).toBe(409);
    expect(res.body.error).toBeDefined();
  });

  it('4. Underage (<16) registration -> 400', async () => {
    const underAgeData = {
      name: 'Young Kid',
      dateOfBirth: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 10 years old
      phone: '+919999988888'
    };

    const res = await request(app).post('/api/auth/register').send(underAgeData);
    expect(res.status).toBe(400);
  });

  it('5. Request OTP with DEMO_SHOW_OTP=true -> returns devOtp', async () => {
    const res = await request(app).post('/api/auth/otp/request').send({ phone: '+919876543210' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.devOtp).toBeDefined();
    expect(res.body.devOtp).toMatch(/^\d{6}$/);
  });

  it('6. Verify OTP and set PIN -> activates user (status: "active")', async () => {
    // 1. Register pending user
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    const userId = regRes.body.user.id;

    // 2. Request OTP
    const otpRes = await request(app).post('/api/auth/otp/request').send({ phone: validUserData.phone });
    const devOtp = otpRes.body.devOtp;

    // 3. Verify OTP
    const verifyRes = await request(app).post('/api/auth/otp/verify').send({ phone: validUserData.phone, otp: devOtp });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.tempToken).toBeDefined();

    // 4. Set PIN using tempToken
    const pinRes = await request(app)
      .post('/api/auth/pin')
      .set('Authorization', `Bearer ${verifyRes.body.tempToken}`)
      .send({ pin: '654321' });

    expect(pinRes.status).toBe(200);
    expect(pinRes.body.user.status).toBe('active');
    expect(pinRes.body.accessToken).toBeDefined();
    expect(pinRes.body.refreshToken).toBeDefined();

    const dbUser = await User.findById(userId);
    expect(dbUser.status).toBe('active');
  });

  it('7. Login with correct PIN -> returns tokens in body; SHA-256 hash stored', async () => {
    // Register and set PIN
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    await request(app).post('/api/auth/pin').send({ userId: regRes.body.user.id, pin: '112233' });

    const loginRes = await request(app).post('/api/auth/login').send({
      phone: validUserData.phone,
      pin: '112233'
    });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.accessToken).toBeDefined();
    expect(loginRes.body.refreshToken).toBeDefined();
    expect(loginRes.body.user.balancePaise).toBe(1000000); // ₹10,000

    // Verify SHA-256 hash stored in DB
    const dbUser = await User.findOne({ phone: validUserData.phone });
    expect(dbUser.refreshTokens.length).toBeGreaterThanOrEqual(1);
    expect(dbUser.refreshTokens[0].tokenHash).toHaveLength(64); // SHA-256 hex is 64 chars
  });

  it('8. Login with wrong PIN 5 times -> account locked for 15 minutes; 6th attempt rejected with 423', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    await request(app).post('/api/auth/pin').send({ userId: regRes.body.user.id, pin: '112233' });

    // 5 failed attempts
    for (let i = 1; i <= 5; i++) {
      const res = await request(app).post('/api/auth/login').send({
        phone: validUserData.phone,
        pin: '000000'
      });
      expect(res.status).toBe(401);
    }

    // 6th attempt should return 423 Locked
    const lockRes = await request(app).post('/api/auth/login').send({
      phone: validUserData.phone,
      pin: '112233' // even with correct PIN, account is locked!
    });
    expect(lockRes.status).toBe(423);
    expect(lockRes.body.error.message).toMatch(/locked/i);
    expect(lockRes.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  it('9. Change PIN with valid current PIN -> updates PIN', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    const pinRes = await request(app).post('/api/auth/pin').send({ userId: regRes.body.user.id, pin: '123456' });
    const token = pinRes.body.accessToken;

    const changeRes = await request(app)
      .post('/api/auth/pin/change')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPin: '123456',
        newPin: '998877',
        confirmPin: '998877'
      });

    expect(changeRes.status).toBe(200);
    expect(changeRes.body.message).toMatch(/changed/i);

    // Old PIN fails
    const oldLogin = await request(app).post('/api/auth/login').send({ phone: validUserData.phone, pin: '123456' });
    expect(oldLogin.status).toBe(401);

    // New PIN succeeds
    const newLogin = await request(app).post('/api/auth/login').send({ phone: validUserData.phone, pin: '998877' });
    expect(newLogin.status).toBe(200);
  });

  it('10. Change PIN with invalid current PIN -> rejects and increments failed attempts', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    const pinRes = await request(app).post('/api/auth/pin').send({ userId: regRes.body.user.id, pin: '123456' });
    const token = pinRes.body.accessToken;

    const changeRes = await request(app)
      .post('/api/auth/pin/change')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPin: '000000',
        newPin: '998877',
        confirmPin: '998877'
      });

    expect(changeRes.status).toBe(401);
    const dbUser = await User.findById(regRes.body.user.id);
    expect(dbUser.failedPinAttempts).toBe(1);
  });

  it('11. Refresh token with valid token -> issues new access token', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    const pinRes = await request(app).post('/api/auth/pin').send({ userId: regRes.body.user.id, pin: '123456' });
    const refreshToken = pinRes.body.refreshToken;

    const refreshRes = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.accessToken).toBeDefined();
  });

  it('12. Logout -> removes token hash; subsequent refresh with that token is rejected (401)', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    const pinRes = await request(app).post('/api/auth/pin').send({ userId: regRes.body.user.id, pin: '123456' });
    const accessToken = pinRes.body.accessToken;
    const refreshToken = pinRes.body.refreshToken;

    // Logout
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    // Refresh should now fail with 401
    const failRefresh = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(failRefresh.status).toBe(401);
  });
});
