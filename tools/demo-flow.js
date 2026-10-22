import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server environment
dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const BASE_URL = process.env.VITE_API_BASE_URL || 'http://localhost:3000';

async function ensureServerRunning() {
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) return null;
  } catch {
    // Server is not running externally; start app in-process
    console.log('Server not detected on port 3000. Starting in-process server with Atlas connection...');
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

async function runDemoFlow() {
  const hardTimeout = setTimeout(() => {
    console.error('Demo flow timed out after 55 seconds.');
    process.exit(1);
  }, 55000);
  hardTimeout.unref();

  console.log('=== NovaBank End-to-End Demo Flow (Connected to Atlas) ===\n');
  const server = await ensureServerRunning();

  const phone1 = '+919000000001';
  const phone2 = '+919000000002';
  const pin1 = '123456';
  const pin2 = '654321';

  // Import models for pre-cleaning and post-cleaning
  const { User } = await import('../server/src/models/User.js');
  const { Transaction } = await import('../server/src/models/Transaction.js');
  const { Otp } = await import('../server/src/models/Otp.js');

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // Pre-cleanup in case of prior partial runs
  const preUsers = await User.find({ phone: { $in: [phone1, phone2] } });
  const preUserIds = preUsers.map(u => u._id);
  await Transaction.deleteMany({ userId: { $in: preUserIds } });
  await User.deleteMany({ phone: { $in: [phone1, phone2] } });
  await Otp.deleteMany({ phone: { $in: [phone1, phone2] } });

  try {
    // --- 1. USER 1 ONBOARDING ---
    console.log('1. Registering User 1 (' + phone1 + ')...');
    const reg1Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Demo User 1',
        dateOfBirth: '1998-03-15',
        phone: phone1,
        nationality: 'Indian'
      })
    });
    const reg1Data = await reg1Res.json();
    console.log(`   Registered User 1: Account Number = ${reg1Data.user.accountNumber}, Status = ${reg1Data.user.status}`);

    // Request & Verify OTP for User 1
    const otp1Res = await fetch(`${BASE_URL}/api/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone1 })
    });
    const otp1Data = await otp1Res.json();
    const devOtp1 = otp1Data.devOtp;
    console.log(`   OTP received: ${devOtp1}`);

    const verify1Res = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone1, otp: devOtp1 })
    });
    const verify1Data = await verify1Res.json();
    console.log('   OTP verified successfully.');

    // Set PIN for User 1
    console.log('   Setting PIN for User 1: ***');
    const pin1Res = await fetch(`${BASE_URL}/api/auth/pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verify1Data.tempToken}`
      },
      body: JSON.stringify({ pin: pin1 })
    });
    const pin1Data = await pin1Res.json();
    console.log(`   User 1 Activated. Status = ${pin1Data.user.status}, Initial Balance = ${formatINR(pin1Data.user.balancePaise)}`);

    // Log in User 1
    console.log('   Logging in User 1 with PIN: ***');
    const login1Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone1, pin: pin1 })
    });
    const login1Data = await login1Res.json();
    const token1 = login1Data.accessToken;
    console.log('   Access Token received: *** (Bearer token)');

    // --- 2. USER 2 ONBOARDING ---
    console.log('\n2. Registering User 2 (' + phone2 + ')...');
    const reg2Res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Demo User 2',
        dateOfBirth: '1999-07-22',
        phone: phone2,
        nationality: 'Indian'
      })
    });
    const reg2Data = await reg2Res.json();
    console.log(`   Registered User 2: Account Number = ${reg2Data.user.accountNumber}, Status = ${reg2Data.user.status}`);

    // Request & Verify OTP for User 2
    const otp2Res = await fetch(`${BASE_URL}/api/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone2 })
    });
    const otp2Data = await otp2Res.json();
    const devOtp2 = otp2Data.devOtp;
    console.log(`   OTP received: ${devOtp2}`);

    const verify2Res = await fetch(`${BASE_URL}/api/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone2, otp: devOtp2 })
    });
    const verify2Data = await verify2Res.json();
    console.log('   OTP verified successfully.');

    // Set PIN for User 2
    console.log('   Setting PIN for User 2: ***');
    const pin2Res = await fetch(`${BASE_URL}/api/auth/pin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${verify2Data.tempToken}`
      },
      body: JSON.stringify({ pin: pin2 })
    });
    const pin2Data = await pin2Res.json();
    console.log(`   User 2 Activated. Status = ${pin2Data.user.status}, Initial Balance = ${formatINR(pin2Data.user.balancePaise)}`);

    // Log in User 2
    console.log('   Logging in User 2 with PIN: ***');
    const login2Res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: phone2, pin: pin2 })
    });
    const login2Data = await login2Res.json();
    const token2 = login2Data.accessToken;
    console.log('   Access Token received: *** (Bearer token)');

    // --- 3. BANKING OPERATIONS ---
    console.log('\n3. Depositing ₹5,000 into User 1...');
    const depRes = await fetch(`${BASE_URL}/api/deposits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        amountPaise: 500000, // ₹5,000
        idempotencyKey: 'demo-dep-u1-5000'
      })
    });
    const depData = await depRes.json();
    console.log(`   Deposit Success! Ref: ${depData.referenceId}, New Balance: ${formatINR(depData.balanceAfterPaise)}`);

    console.log('\n4. Transferring ₹750 from User 1 to User 2 with PIN: ***...');
    const xferRes = await fetch(`${BASE_URL}/api/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token1}`
      },
      body: JSON.stringify({
        recipientPhone: phone2,
        amountPaise: 75000, // ₹750
        note: 'Project contribution',
        pin: pin1,
        idempotencyKey: 'demo-xfer-u1-to-u2-750'
      })
    });
    const xferData = await xferRes.json();
    console.log(`   Transfer Success! Ref: ${xferData.referenceId}, TransferId: ${xferData.transferId}`);

    // --- 4. BALANCES AND PASSBOOK ---
    console.log('\n================ FINAL RESULTS ================');

    // User 1
    const me1Res = await fetch(`${BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const me1 = (await me1Res.json()).user;

    const tx1Res = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Authorization: `Bearer ${token1}` }
    });
    const tx1List = (await tx1Res.json()).transactions;

    console.log(`\nUser 1 (${me1.name} | ${me1.phone}):`);
    console.log(`Current Balance: ${formatINR(me1.balancePaise)}`);
    console.log('Passbook Entries:');
    tx1List.forEach((t, i) => {
      const typeStr = t.type === 'deposit' ? '[+] DEPOSIT' : t.type === 'transfer_out' ? '[-] TRANSFER OUT' : t.type;
      console.log(`  ${i + 1}. ${typeStr}: ${formatINR(t.amountPaise)} | Bal: ${formatINR(t.balanceAfterPaise)} | Ref: ${t.referenceId} | Note: "${t.note || ''}"`);
    });

    // User 2
    const me2Res = await fetch(`${BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const me2 = (await me2Res.json()).user;

    const tx2Res = await fetch(`${BASE_URL}/api/transactions`, {
      headers: { Authorization: `Bearer ${token2}` }
    });
    const tx2List = (await tx2Res.json()).transactions;

    console.log(`\nUser 2 (${me2.name} | ${me2.phone}):`);
    console.log(`Current Balance: ${formatINR(me2.balancePaise)}`);
    console.log('Passbook Entries:');
    tx2List.forEach((t, i) => {
      const typeStr = t.type === 'transfer_in' ? '[+] TRANSFER IN' : t.type;
      console.log(`  ${i + 1}. ${typeStr}: ${formatINR(t.amountPaise)} | Bal: ${formatINR(t.balanceAfterPaise)} | Ref: ${t.referenceId} | From: ${t.counterpartyName}`);
    });

    console.log('================================================\n');

    // --- 5. CLEANUP ---
    console.log('Cleaning up demo users and transactions from database...');
    const usersToDelete = await User.find({ phone: { $in: [phone1, phone2] } });
    const ids = usersToDelete.map(u => u._id);
    await Transaction.deleteMany({ userId: { $in: ids } });
    await User.deleteMany({ _id: { $in: ids } });
    await Otp.deleteMany({ phone: { $in: [phone1, phone2] } });
    console.log('Cleanup completed successfully. Database restored to prior state.\n');
  } catch (err) {
    console.error('Demo flow failed:', err);
  } finally {
    if (server) {
      server.close();
    }
    await mongoose.disconnect();
    process.exit(0);
  }
}

runDemoFlow();
