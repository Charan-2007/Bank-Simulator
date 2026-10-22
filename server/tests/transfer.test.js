import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Transaction } from '../src/models/Transaction.js';

describe('Transfer Service & Daily Limit in Asia/Kolkata', () => {
  let senderToken, senderId, senderAccount;
  let receiverToken, receiverId, receiverAccount;
  let pendingUserId, pendingUserPhone;

  beforeEach(async () => {
    await User.deleteMany({});
    await Transaction.deleteMany({});

    // Create Sender (Active, balance ₹10,000 = 1,000,000 paise)
    const regSender = await request(app).post('/api/auth/register').send({
      name: 'Sender User',
      dateOfBirth: '1995-05-10',
      phone: '+919111111111'
    });
    senderId = regSender.body.user.id;
    senderAccount = regSender.body.user.accountNumber;
    const pinSender = await request(app).post('/api/auth/pin').send({
      userId: senderId,
      pin: '123456'
    });
    senderToken = pinSender.body.accessToken;

    // Create Receiver (Active, balance ₹10,000)
    const regReceiver = await request(app).post('/api/auth/register').send({
      name: 'Receiver User',
      dateOfBirth: '1998-08-20',
      phone: '+919222222222'
    });
    receiverId = regReceiver.body.user.id;
    receiverAccount = regReceiver.body.user.accountNumber;
    const pinReceiver = await request(app).post('/api/auth/pin').send({
      userId: receiverId,
      pin: '654321'
    });
    receiverToken = pinReceiver.body.accessToken;

    // Create Pending User (Not activated)
    pendingUserPhone = '+919333333333';
    const regPending = await request(app).post('/api/auth/register').send({
      name: 'Pending User',
      dateOfBirth: '1999-09-09',
      phone: pendingUserPhone
    });
    pendingUserId = regPending.body.user.id;
  });

  it('1. Transfer success -> balances and records match; shared transferId', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientPhone: '+919222222222',
        amountPaise: 250000, // ₹2,500
        note: 'College project split',
        pin: '123456'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.transferId).toBeDefined();
    expect(res.body.referenceId).toMatch(/^NB\d+/);
    expect(res.body.balanceAfterPaise).toBe(750000); // 1,000,000 - 250,000

    // Verify Sender and Receiver in DB
    const senderDb = await User.findById(senderId);
    expect(senderDb.balancePaise).toBe(750000);

    const receiverDb = await User.findById(receiverId);
    expect(receiverDb.balancePaise).toBe(1250000);

    // Verify shared transferId across 2 Transaction records
    const txs = await Transaction.find({ transferId: res.body.transferId });
    expect(txs.length).toBe(2);
    const senderTx = txs.find(t => t.type === 'transfer_out');
    const receiverTx = txs.find(t => t.type === 'transfer_in');
    expect(senderTx.amountPaise).toBe(250000);
    expect(receiverTx.amountPaise).toBe(250000);
  });

  it('2. Insufficient balance -> 400, no balance change', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientAccount: receiverAccount,
        amountPaise: 2000000, // ₹20,000 (sender has ₹10,000)
        note: 'Too much money',
        pin: '123456'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.message).toMatch(/insufficient balance/i);

    const senderDb = await User.findById(senderId);
    expect(senderDb.balancePaise).toBe(1000000);
  });

  it('3. Transfer to pending user -> 404/400 (cannot transfer to inactive user)', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientPhone: pendingUserPhone,
        amountPaise: 50000,
        pin: '123456'
      });

    expect(res.status).toBe(404);
    expect(res.body.error.message).toMatch(/not found or inactive/i);
  });

  it('4. Exceeds daily transfer limit in Asia/Kolkata -> 400 rejected inside transaction', async () => {
    // Deposit extra money so sender can test the daily limit (e.g. ₹1,50,000)
    await User.findByIdAndUpdate(senderId, { balancePaise: 15000000 });

    // Transfer 1: ₹50,000 (maximum per single transfer)
    const res1 = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientAccount: receiverAccount,
        amountPaise: 5000000, // ₹50,000
        pin: '123456'
      });
    expect(res1.status).toBe(200);

    // Transfer 2: ₹50,000 (total ₹1,00,000 reached)
    const res2 = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientAccount: receiverAccount,
        amountPaise: 5000000, // ₹50,000
        pin: '123456'
      });
    expect(res2.status).toBe(200);

    // Transfer 3: ₹1 (Attempt to exceed ₹1,00,000 daily limit)
    const res3 = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientAccount: receiverAccount,
        amountPaise: 100, // ₹1
        pin: '123456'
      });

    expect(res3.status).toBe(400);
    expect(res3.body.error.message).toMatch(/daily transfer limit.*exceeded/i);
  });

  it('5. Wrong PIN -> increments failed attempts toward lockout', async () => {
    const res = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientAccount: receiverAccount,
        amountPaise: 10000,
        pin: '000000'
      });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/invalid pin/i);

    const senderDb = await User.findById(senderId);
    expect(senderDb.failedPinAttempts).toBe(1);
  });

  it('6. Idempotent retry -> original referenceId returned; no double debit', async () => {
    const idempotencyKey = 'unique-key-transfer-abc-123';

    // First attempt
    const res1 = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientAccount: receiverAccount,
        amountPaise: 100000, // ₹1,000
        pin: '123456',
        idempotencyKey
      });

    expect(res1.status).toBe(200);
    const refId1 = res1.body.referenceId;
    const balanceAfter1 = res1.body.balanceAfterPaise;

    // Retry with identical idempotencyKey
    const res2 = await request(app)
      .post('/api/transfers')
      .set('Authorization', `Bearer ${senderToken}`)
      .send({
        recipientAccount: receiverAccount,
        amountPaise: 100000,
        pin: '123456',
        idempotencyKey
      });

    expect(res2.status).toBe(200);
    expect(res2.body.referenceId).toBe(refId1);
    expect(res2.body.balanceAfterPaise).toBe(balanceAfter1);

    // Verify balance was only deducted once!
    const senderDb = await User.findById(senderId);
    expect(senderDb.balancePaise).toBe(900000); // 1,000,000 - 100,000
  });
});
