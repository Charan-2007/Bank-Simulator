import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';
import { User } from '../src/models/User.js';
import { Transaction } from '../src/models/Transaction.js';

describe('Transactions, Deposits, Withdrawals & Account Endpoints', () => {
  let token, userId, accountNumber;

  beforeEach(async () => {
    await User.deleteMany({});
    await Transaction.deleteMany({});

    const reg = await request(app).post('/api/auth/register').send({
      name: 'Bank Customer',
      dateOfBirth: '1990-01-01',
      phone: '+919777777777'
    });
    userId = reg.body.user.id;
    accountNumber = reg.body.user.accountNumber;

    const pinRes = await request(app).post('/api/auth/pin').send({
      userId,
      pin: '987654'
    });
    token = pinRes.body.accessToken;
  });

  it('1. Deposit -> successfully adds demo funds up to ₹50,000 limit', async () => {
    const res = await request(app)
      .post('/api/deposits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amountPaise: 500000 // ₹5,000
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.balanceAfterPaise).toBe(1500000); // 10,000 + 5,000 = 15,000

    // Check exceeding ₹50,000 single deposit limit
    const overLimitRes = await request(app)
      .post('/api/deposits')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amountPaise: 6000000 // ₹60,000 > ₹50,000
      });
    expect(overLimitRes.status).toBe(400);
  });

  it('2. Withdrawal -> debits account; prevents overdraft', async () => {
    // Normal withdrawal
    const res = await request(app)
      .post('/api/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amountPaise: 200000 // ₹2,000
      });

    expect(res.status).toBe(200);
    expect(res.body.balanceAfterPaise).toBe(800000); // 10,000 - 2,000 = 8,000

    // Overdraft attempt (remaining balance is ₹8,000)
    const overRes = await request(app)
      .post('/api/withdrawals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amountPaise: 1000000 // ₹10,000 > 8,000
      });
    expect(overRes.status).toBe(400);
    expect(overRes.body.error.message).toMatch(/insufficient balance/i);
  });

  it('3. Passbook filters and pagination (all, money_in, money_out)', async () => {
    // Perform 2 deposits (money_in) and 1 withdrawal (money_out)
    await request(app).post('/api/deposits').set('Authorization', `Bearer ${token}`).send({ amountPaise: 100000 });
    await request(app).post('/api/deposits').set('Authorization', `Bearer ${token}`).send({ amountPaise: 200000 });
    await request(app).post('/api/withdrawals').set('Authorization', `Bearer ${token}`).send({ amountPaise: 50000 });

    // Filter: all
    const allRes = await request(app).get('/api/transactions?filter=all').set('Authorization', `Bearer ${token}`);
    expect(allRes.status).toBe(200);
    expect(allRes.body.transactions.length).toBe(3);
    expect(allRes.body.pagination.total).toBe(3);

    // Filter: money_in
    const inRes = await request(app).get('/api/transactions?filter=money_in').set('Authorization', `Bearer ${token}`);
    expect(inRes.status).toBe(200);
    expect(inRes.body.transactions.length).toBe(2);

    // Filter: money_out
    const outRes = await request(app).get('/api/transactions?filter=money_out').set('Authorization', `Bearer ${token}`);
    expect(outRes.status).toBe(200);
    expect(outRes.body.transactions.length).toBe(1);

    // Single transaction lookup
    const txId = allRes.body.transactions[0]._id;
    const singleTx = await request(app).get(`/api/transactions/${txId}`).set('Authorization', `Bearer ${token}`);
    expect(singleTx.status).toBe(200);
    expect(singleTx.body.transaction._id).toBe(txId);
  });

  it('4. User Profile, Settings, Card update and Recipient Lookup', async () => {
    // GET /api/me
    const meRes = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.user.name).toBe('Bank Customer');
    expect(meRes.body.user.pinHash).toBeUndefined(); // ensure pinHash not leaked

    // PATCH /api/me/settings
    const settingsRes = await request(app)
      .patch('/api/me/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        theme: 'dark',
        cardAnimation: 'high',
        reducedMotion: true
      });
    expect(settingsRes.status).toBe(200);
    expect(settingsRes.body.settings.theme).toBe('dark');
    expect(settingsRes.body.settings.cardAnimation).toBe('high');

    // PATCH /api/me/card
    const cardRes = await request(app)
      .patch('/api/me/card')
      .set('Authorization', `Bearer ${token}`)
      .send({ cardId: 'gaming-gta-6' });
    expect(cardRes.status).toBe(200);
    expect(cardRes.body.selectedCardId).toBe('gaming-gta-6');

    // GET /api/accounts/lookup?account=...
    const lookupRes = await request(app)
      .get(`/api/accounts/lookup?account=${accountNumber}`)
      .set('Authorization', `Bearer ${token}`);
    expect(lookupRes.status).toBe(200);
    expect(lookupRes.body.recipient.name).toBe('Bank Customer');
    expect(lookupRes.body.recipient.accountNumber).toBe(accountNumber);
  });
});
