import { MongoMemoryReplSet } from 'mongodb-memory-server';
import request from 'supertest';
import { app } from '../server/src/app.js';
import { connectDB, disconnectDB } from '../server/src/config/db.js';
import { User } from '../server/src/models/User.js';
import { Transaction } from '../server/src/models/Transaction.js';

// Hard timeout: 180 seconds
const timeout = setTimeout(() => {
  console.error('[STRESS TEST] Timeout of 180s reached! Forcing exit.');
  process.exit(1);
}, 180000);

// Seeded Pseudo-Random Number Generator (Mulberry32)
const SEED = parseInt(process.env.SEED || Date.now().toString().slice(-8), 10);
console.log(`[STRESS TEST] SEED: ${SEED}`);

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = mulberry32(SEED);

function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

async function run() {
  let replSet;
  try {
    console.log('[STRESS TEST] Starting in-memory Mongo replica set...');
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    const uri = replSet.getUri();
    await connectDB(uri);
    console.log('[STRESS TEST] Connected to Mongo replica set.');

    // 1. Setup 10 Users via Real Flow
    console.log('[STRESS TEST] Provisioning 10 test users (+917000001000 - +917000001009)...');
    const users = [];
    const pin = '123456';

    for (let i = 0; i < 10; i++) {
      const phone = `+91700000100${i}`;
      const name = `Stress User ${i}`;
      const dob = '1995-06-15';

      // Register
      const regRes = await request(app).post('/api/auth/register').send({
        name,
        dateOfBirth: dob,
        phone,
        nationality: 'Indian'
      });
      const userId = regRes.body.user.id || regRes.body.user._id;

      // OTP Verify
      const otpRes = await request(app).post('/api/auth/otp/verify').send({
        phone,
        otp: regRes.body.devOtp || '123456'
      });

      // Set PIN
      const pinRes = await request(app).post('/api/auth/pin').send({
        userId,
        pin,
        confirmPin: pin
      });

      const token = pinRes.body.accessToken;
      const accountRes = await request(app).get('/api/me').set('Authorization', `Bearer ${token}`);

      users.push({
        id: userId,
        phone,
        name,
        accountNumber: accountRes.body.user.accountNumber,
        token
      });
    }

    console.log(`[STRESS TEST] 10 users registered successfully. Initial total balance: ₹1,00,000 (10 × ₹10,000).`);

    // 2. Run 1,000 Randomized Operations
    console.log('[STRESS TEST] Executing 1,000 randomized operations (deposits, withdrawals, transfers)...');
    let successfulOps = 0;
    let failedOps = 0;

    for (let op = 0; op < 1000; op++) {
      const uIdx = randomInt(0, 9);
      const sender = users[uIdx];
      const opType = randomInt(1, 3); // 1: Deposit, 2: Withdrawal, 3: Transfer

      if (opType === 1) {
        // Deposit up to ₹5,000 (500000 paise)
        const amt = randomInt(100, 5000) * 100;
        const res = await request(app)
          .post('/api/deposits')
          .set('Authorization', `Bearer ${sender.token}`)
          .send({ amountPaise: amt, idempotencyKey: `dep-${op}-${Date.now()}` });
        if (res.status === 200) successfulOps++; else failedOps++;
      } else if (opType === 2) {
        // Withdrawal up to ₹2,000 (200000 paise)
        const amt = randomInt(100, 2000) * 100;
        const res = await request(app)
          .post('/api/withdrawals')
          .set('Authorization', `Bearer ${sender.token}`)
          .send({ amountPaise: amt, idempotencyKey: `wth-${op}-${Date.now()}` });
        if (res.status === 200) successfulOps++; else failedOps++;
      } else {
        // Peer Transfer to another user
        let rIdx = randomInt(0, 9);
        while (rIdx === uIdx) rIdx = randomInt(0, 9);
        const recipient = users[rIdx];
        const amt = randomInt(50, 1500) * 100;

        const res = await request(app)
          .post('/api/transfers')
          .set('Authorization', `Bearer ${sender.token}`)
          .send({
            recipientAccount: recipient.accountNumber,
            amountPaise: amt,
            pin,
            note: `Stress transfer ${op}`,
            idempotencyKey: `tx-${op}-${Date.now()}`
          });
        if (res.status === 200) successfulOps++; else failedOps++;
      }

      if ((op + 1) % 250 === 0) {
        console.log(`[STRESS TEST] ... Completed ${op + 1}/1000 operations`);
      }
    }
    console.log(`[STRESS TEST] 1,000 operations finished: ${successfulOps} succeeded, ${failedOps} rejected (limits/insufficient funds).`);

    // 3. Run 300 Concurrent Transfers in Batches
    console.log('[STRESS TEST] Firing 300 concurrent transfers across 10 users in parallel...');
    const concurrentPromises = [];
    for (let c = 0; c < 300; c++) {
      const uIdx = c % 10;
      let rIdx = (c + 1) % 10;
      const sender = users[uIdx];
      const recipient = users[rIdx];
      const amt = 5000; // ₹50

      concurrentPromises.push(
        request(app)
          .post('/api/transfers')
          .set('Authorization', `Bearer ${sender.token}`)
          .send({
            recipientAccount: recipient.accountNumber,
            amountPaise: amt,
            pin,
            note: `Concurrent ${c}`,
            idempotencyKey: `conc-${c}-${Date.now()}`
          })
      );
    }

    const concurrentResults = await Promise.all(concurrentPromises);
    const concurrentSuccess = concurrentResults.filter(r => r.status === 200).length;
    console.log(`[STRESS TEST] 300 concurrent transfers completed: ${concurrentSuccess} succeeded, ${300 - concurrentSuccess} resolved with write conflict or limit checks.`);

    // 4. Assert Invariants A - G
    console.log('[STRESS TEST] Verifying Invariants A through G...');

    // Fetch all current user states
    const allDbUsers = await User.find({ phone: { $in: users.map(u => u.phone) } });
    const allTxs = await Transaction.find({ status: 'success' });

    // Invariant A: Conservation of Money
    // Sum of all initial balances: 10 * 10,000 * 100 = 10,000,000 paise
    const initialTotalPaise = 10 * 10000 * 100;
    const totalDeposited = allTxs
      .filter(t => t.type === 'deposit')
      .reduce((acc, t) => acc + t.amountPaise, 0);
    const totalWithdrawn = allTxs
      .filter(t => t.type === 'withdrawal')
      .reduce((acc, t) => acc + t.amountPaise, 0);
    const expectedTotalPaise = initialTotalPaise + totalDeposited - totalWithdrawn;
    const actualTotalPaise = allDbUsers.reduce((acc, u) => acc + u.balancePaise, 0);

    console.log(`[INVARIANT A] Conservation of Money: Expected = ${expectedTotalPaise} paise, Actual = ${actualTotalPaise} paise`);
    if (expectedTotalPaise !== actualTotalPaise) {
      throw new Error(`Invariant A Violation: Money conservation failed! Expected ${expectedTotalPaise}, got ${actualTotalPaise}`);
    }

    // Invariant B: Non-negative balances
    for (const u of allDbUsers) {
      if (u.balancePaise < 0) {
        throw new Error(`Invariant B Violation: User ${u.phone} has negative balance ${u.balancePaise}`);
      }
    }
    console.log('[INVARIANT B] All user balances >= 0.');

    // Invariant C: Transaction balance consistency
    for (const u of allDbUsers) {
      const userTxs = await Transaction.find({ userId: u._id, status: 'success' }).sort({ createdAt: 1 });
      let running = 1000000; // initial balance: ₹10,000
      for (const tx of userTxs) {
        if (tx.type === 'deposit' || tx.type === 'transfer_in') {
          running += tx.amountPaise;
        } else if (tx.type === 'withdrawal' || tx.type === 'transfer_out') {
          running -= tx.amountPaise;
        }
        if (running !== tx.balanceAfterPaise) {
          throw new Error(`Invariant C Violation: User ${u.phone} tx ${tx.referenceId} running ${running} != snapshot ${tx.balanceAfterPaise}`);
        }
      }
      if (running !== u.balancePaise) {
        throw new Error(`Invariant C Violation: Final running ${running} != current balance ${u.balancePaise}`);
      }
    }
    console.log('[INVARIANT C] Transaction running balance snapshots strictly match database balances.');

    // Invariant D: Transfer pair balance conservation
    const outTxs = allTxs.filter(t => t.type === 'transfer_out');
    const inTxs = allTxs.filter(t => t.type === 'transfer_in');
    if (outTxs.length !== inTxs.length) {
      throw new Error(`Invariant D Violation: Mismatched transfer pairs: ${outTxs.length} transfer_out vs ${inTxs.length} transfer_in`);
    }

    const inMap = new Map();
    for (const inTx of inTxs) {
      inMap.set(inTx.transferId, inTx);
    }
    for (const outTx of outTxs) {
      const match = inMap.get(outTx.transferId);
      if (!match) {
        throw new Error(`Invariant D Violation: Missing transfer_in for transferId ${outTx.transferId}`);
      }
      if (match.amountPaise !== outTx.amountPaise) {
        throw new Error(`Invariant D Violation: Transfer amount mismatch for ${outTx.transferId}`);
      }
    }
    console.log(`[INVARIANT D] All ${outTxs.length} transfer pairs share identical transferId and conserved amount.`);

    // Invariant E: Daily transfer limits respected (<= ₹1,00,000 outgoing transfers per day)
    for (const u of allDbUsers) {
      const outSum = allTxs
        .filter(t => t.userId.toString() === u._id.toString() && t.type === 'transfer_out')
        .reduce((acc, t) => acc + t.amountPaise, 0);
      if (outSum > 10000000) { // ₹1,00,000 = 10,000,000 paise
        throw new Error(`Invariant E Violation: User ${u.phone} exceeded daily limit: ${outSum} paise`);
      }
    }
    console.log('[INVARIANT E] Daily transfer limits respected across all users (<= ₹1,00,000/day).');

    // Invariant F: Single transaction limits respected (₹1 to ₹50,000)
    for (const tx of allTxs) {
      if (tx.type === 'transfer_out' || tx.type === 'transfer_in') {
        if (tx.amountPaise < 100 || tx.amountPaise > 5000000) {
          throw new Error(`Invariant F Violation: Tx ${tx.referenceId} amount out of bounds: ${tx.amountPaise} paise`);
        }
      }
    }
    console.log('[INVARIANT F] All transfers within single-transaction bounds (₹1 - ₹50,000).');

    // Invariant G: Idempotency keys uniqueness
    const seenKeys = new Set();
    for (const tx of allTxs) {
      if (tx.idempotencyKey) {
        const composite = `${tx.userId.toString()}:${tx.idempotencyKey}`;
        if (seenKeys.has(composite)) {
          throw new Error(`Invariant G Violation: Duplicate idempotency key execution for ${composite}`);
        }
        seenKeys.add(composite);
      }
    }
    console.log(`[INVARIANT G] All ${seenKeys.size} idempotency keys uniquely executed without duplicate transactions.`);

    console.log('\n========================================');
    console.log('🎉 ALL INVARIANTS A THROUGH G PASSED! 🎉');
    console.log('========================================\n');

    clearTimeout(timeout);
    await disconnectDB();
    if (replSet) await replSet.stop();
    process.exit(0);
  } catch (err) {
    console.error('[STRESS TEST FAILURE]:', err);
    clearTimeout(timeout);
    await disconnectDB();
    if (replSet) await replSet.stop();
    process.exit(1);
  }
}

run();
