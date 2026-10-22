import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Transaction } from '../src/models/Transaction.js';

describe('Concurrency & Double-Spend Prevention', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await Transaction.deleteMany({});
  });

  it('Two simultaneous transfers from same account attempting to overdraw -> exactly one succeeds, one fails', async () => {
    // 1. Create Sender with ₹10,000 (1,000,000 paise)
    const regSender = await request(app).post('/api/auth/register').send({
      name: 'Concurrent Sender',
      dateOfBirth: '1992-04-12',
      phone: '+919555555555'
    });
    const senderId = regSender.body.user.id;
    const pinSender = await request(app).post('/api/auth/pin').send({
      userId: senderId,
      pin: '123456'
    });
    const senderToken = pinSender.body.accessToken;

    // 2. Create Two Receivers
    const regR1 = await request(app).post('/api/auth/register').send({
      name: 'Receiver One',
      dateOfBirth: '1994-06-14',
      phone: '+919666666661'
    });
    await request(app).post('/api/auth/pin').send({ userId: regR1.body.user.id, pin: '111111' });

    const regR2 = await request(app).post('/api/auth/register').send({
      name: 'Receiver Two',
      dateOfBirth: '1996-08-16',
      phone: '+919666666662'
    });
    await request(app).post('/api/auth/pin').send({ userId: regR2.body.user.id, pin: '222222' });

    // 3. Initiate two concurrent transfers of ₹6,000 (600,000 paise) each.
    // Total attempted = ₹12,000 > available ₹10,000
    const transferReq1 = request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientPhone: '+919666666661',
        amountPaise: 600000, // ₹6,000
        pin: '123456',
        idempotencyKey: 'concurrent-tx-req-1'
      });

    const transferReq2 = request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientPhone: '+919666666662',
        amountPaise: 600000, // ₹6,000
        pin: '123456',
        idempotencyKey: 'concurrent-tx-req-2'
      });

    const [res1, res2] = await Promise.all([transferReq1, transferReq2]);

    const results = [res1, res2];
    const successes = results.filter(r => r.status === 200);
    const failures = results.filter(r => r.status >= 400);

    // Exactly one must succeed, one must fail
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(1);

    // Verify sender balance is exactly ₹4,000 (400,000 paise)
    const senderDb = await User.findById(senderId);
    expect(senderDb.balancePaise).toBe(400000);
  });
});
