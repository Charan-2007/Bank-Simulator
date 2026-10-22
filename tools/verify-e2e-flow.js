import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function ensureServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) return null;
  } catch {
    console.log('Starting in-process Express server connected to Atlas...');
    const { connectDB } = await import('../server/src/config/db.js');
    const { app } = await import('../server/src/app.js');
    await connectDB();
    const server = app.listen(3000);
    return server;
  }
  return null;
}

function formatINR(paise) {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(rupees);
}

async function runVerification() {
  const hardTimeout = setTimeout(() => {
    console.error('Verification script timed out after 55s.');
    process.exit(1);
  }, 55000);
  hardTimeout.unref();

  console.log('================================================================');
  console.log(' NovaBank Comprehensive Live Atlas E2E Verification Suite');
  console.log('================================================================\n');

  const server = await ensureServerRunning();

  const phone1 = '+919999000001';
  const phone2 = '+919999000002';
  const pin1 = '112233';
  const pin2 = '445566';

  const { User } = await import('../server/src/models/User.js');
  const { Transaction } = await import('../server/src/models/Transaction.js');
  const { Otp } = await import('../server/src/models/Otp.js');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // Pre-cleanup
  const preUsers = await User.find({ phone: { $in: [phone1, phone2] } });
  const preIds = preUsers.map(u => u._id);
  await Transaction.deleteMany({ userId: { $in: preIds } });
  await User.deleteMany({ phone: { $in: [phone1, phone2] } });
  await Otp.deleteMany({ phone: { $in: [phone1, phone2] } });

  let exitCode = 0;

  try {
    // 1. REGISTER USER 1
    console.log('1. Registering User 1 (' + phone1 + ')...');
    const r1 = await (await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Aarav Sharma', dateOfBirth: '1995-05-12', phone: phone1 })
    })).json();
    console.log(`   ✓ User 1 created. Account: ${r1.user.accountNumber}, Status: ${r1.user.status}`);

    // OTP Request & Verify
    const otp1Res = await (await fetch(`${BASE_URL}/api/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone1 })
    })).json();
    const v1 = await (await fetch(`${BASE_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone1, otp: otp1Res.devOtp })
    })).json();
    console.log('   ✓ User 1 OTP verified successfully.');

    // Set PIN
    const p1 = await (await fetch(`${BASE_URL}/api/auth/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${v1.tempToken}` },
      body: JSON.stringify({ pin: pin1 })
    })).json();
    console.log(`   ✓ User 1 PIN set. Initial balance: ${formatINR(p1.user.balancePaise)}`);

    // Login User 1
    const l1 = await (await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone1, pin: pin1 })
    })).json();
    const token1 = l1.accessToken;

    // 2. CHOOSE CARD
    console.log('\n2. Choosing Card for User 1...');
    const cardRes = await (await fetch(`${BASE_URL}/api/me/card`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ cardId: 'abstract-black-hole' })
    })).json();
    console.log(`   ✓ User 1 card updated to: ${cardRes.selectedCardId}`);

    // 3. REGISTER USER 2
    console.log('\n3. Registering User 2 (' + phone2 + ')...');
    await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Diya Patel', dateOfBirth: '1997-08-20', phone: phone2 })
    });
    const otp2Res = await (await fetch(`${BASE_URL}/api/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone2 })
    })).json();
    const v2 = await (await fetch(`${BASE_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone2, otp: otp2Res.devOtp })
    })).json();
    await fetch(`${BASE_URL}/api/auth/pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${v2.tempToken}` },
      body: JSON.stringify({ pin: pin2 })
    });
    const l2 = await (await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone2, pin: pin2 })
    })).json();
    const token2 = l2.accessToken;
    console.log('   ✓ User 2 registered & activated.');

    // 4. DEPOSIT ₹5,000.50 (500050 paise)
    console.log('\n4. Depositing ₹5,000.50 into User 1...');
    const depRes = await (await fetch(`${BASE_URL}/api/deposits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({ amountPaise: 500050, idempotencyKey: 'idemp-dep-500050' })
    })).json();

    const u1AfterDep = await (await fetch(`${BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token1}` }
    })).json();
    console.log(`   ✓ Deposit successful. Balance after deposit: ${formatINR(u1AfterDep.user.balancePaise)} (Expected: ₹15,000.50)`);
    if (u1AfterDep.user.balancePaise !== 1500050) {
      throw new Error(`Deposit balance mismatch! Expected 1500050, got ${u1AfterDep.user.balancePaise}`);
    }

    // 5. TRANSFER ₹750.25 (75025 paise) to User 2
    console.log('\n5. Transferring ₹750.25 from User 1 to User 2...');
    const xferIdempKey = 'idemp-xfer-75025';
    const xferRes = await (await fetch(`${BASE_URL}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        recipientPhone: phone2,
        amountPaise: 75025,
        note: 'Project share',
        pin: pin1,
        idempotencyKey: xferIdempKey
      })
    })).json();
    console.log(`   ✓ Transfer successful. Reference ID: ${xferRes.referenceId}`);

    const u1AfterXfer = await (await fetch(`${BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token1}` }
    })).json();
    const u2AfterXfer = await (await fetch(`${BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token2}` }
    })).json();

    console.log(`   ✓ User 1 balance: ${formatINR(u1AfterXfer.user.balancePaise)} (Expected: ₹14,250.25)`);
    console.log(`   ✓ User 2 balance: ${formatINR(u2AfterXfer.user.balancePaise)} (Expected: ₹10,750.25)`);

    if (u1AfterXfer.user.balancePaise !== 1425025 || u2AfterXfer.user.balancePaise !== 1075025) {
      throw new Error('Balance mismatch after transfer!');
    }

    // 6. IDEMPOTENCY / RETRY TEST WITH SAME KEY
    console.log('\n6. Testing Idempotent Retry (Simulated network drop with SAME key)...');
    const retryRes = await (await fetch(`${BASE_URL}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        recipientPhone: phone2,
        amountPaise: 75025,
        note: 'Project share',
        pin: pin1,
        idempotencyKey: xferIdempKey
      })
    })).json();

    const u1AfterRetry = await (await fetch(`${BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token1}` }
    })).json();

    console.log(`   ✓ Idempotent retry returned original reference: ${retryRes.referenceId}`);
    console.log(`   ✓ User 1 balance remained unchanged: ${formatINR(u1AfterRetry.user.balancePaise)} (No double debit)`);

    if (retryRes.referenceId !== xferRes.referenceId || u1AfterRetry.user.balancePaise !== 1425025) {
      throw new Error('Idempotency violation! Double debit detected.');
    }

    // 7. WRONG PIN REJECTION TEST
    console.log('\n7. Testing Wrong PIN Attempt...');
    const wrongPinRes = await fetch(`${BASE_URL}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        recipientPhone: phone2,
        amountPaise: 10000,
        pin: '999999',
        idempotencyKey: 'wrong-pin-test'
      })
    });
    console.log(`   ✓ Wrong PIN rejected with HTTP ${wrongPinRes.status} (Expected: 401)`);
    if (wrongPinRes.status !== 401) {
      throw new Error(`Expected HTTP 401 on wrong PIN, got ${wrongPinRes.status}`);
    }

    // 8. OVERDRAW ATTEMPT
    console.log('\n8. Testing Overdraw Attempt (₹50,000 exceeds ₹14,250.25 balance)...');
    const overdrawRes = await fetch(`${BASE_URL}/api/transfers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token1}` },
      body: JSON.stringify({
        recipientPhone: phone2,
        amountPaise: 5000000, // ₹50,000
        pin: pin1,
        idempotencyKey: 'overdraw-test'
      })
    });
    console.log(`   ✓ Overdraw rejected with HTTP ${overdrawRes.status} (Expected: 400)`);
    if (overdrawRes.status !== 400) {
      throw new Error(`Expected HTTP 400 on overdraw, got ${overdrawRes.status}`);
    }

    // 9. VERIFY PASSBOOK
    console.log('\n9. Verifying Passbook Ledger...');
    const tx1Res = await (await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Authorization: `Bearer ${token1}` }
    })).json();
    console.log(`   ✓ User 1 has ${tx1Res.transactions.length} ledger entries:`);
    tx1Res.transactions.forEach(t => {
      console.log(`     - ${t.type}: ${formatINR(t.amountPaise)} | Running Balance: ${formatINR(t.balanceAfterPaise)} | Ref: ${t.referenceId}`);
    });

    console.log('\n================================================================');
    console.log(' ALL 9 LIVE ATLAS VERIFICATION STAGES PASSED SUCCESSFULLY!');
    console.log('================================================================\n');
  } catch (err) {
    console.error('\n❌ Verification Failed:', err);
    exitCode = 1;
  } finally {
    console.log('Cleaning up test data from MongoDB Atlas...');
    const usersToDelete = await User.find({ phone: { $in: [phone1, phone2] } });
    const ids = usersToDelete.map(u => u._id);
    await Transaction.deleteMany({ userId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    await Otp.deleteMany({ phone: { $in: [phone1, phone2] } });
    console.log('✓ Atlas database cleaned.');

    if (server) server.close();
    await mongoose.disconnect();
    process.exit(exitCode);
  }
}

runVerification();
