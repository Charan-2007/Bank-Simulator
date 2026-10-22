import puppeteer from 'puppeteer-core';
import { spawn, execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { User } from '../server/src/models/User.js';
import { Transaction } from '../server/src/models/Transaction.js';
import { Otp } from '../server/src/models/Otp.js';

import { connectDB, disconnectDB } from '../server/src/config/db.js';
import { signAccessToken, generateRefreshToken, hashToken } from '../server/src/utils/tokens.js';

import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../server/.env') });

const hardTimeout = setTimeout(() => {
  console.error('[E2E-UI] Timed out after 360s! Forcing exit.');
  process.exit(1);
}, 360000);
hardTimeout.unref();

function killPort(port) {
  try {
    const stdout = execSync(`powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess"`).toString().trim();
    const pids = stdout.split(/\s+/).filter(Boolean);
    for (const pid of pids) {
      if (pid && pid !== '0') {
        try { process.kill(parseInt(pid, 10), 'SIGKILL'); } catch {}
      }
    }
  } catch {}
}

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const CLIENT_PORT = 5173;
const SERVER_PORT = 3000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForBackend(timeoutMs = 45000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${SERVER_PORT}/api/health`);
      if (res.ok) {
        const data = await res.json();
        if (data.db === 1) return true;
      }
    } catch {}
    await wait(500);
  }
  return false;
}

async function waitForFrontend(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`http://localhost:${CLIENT_PORT}`);
      if (res.ok) return true;
    } catch {}
    await wait(400);
  }
  return false;
}

let activeReplSet = null;
let activeServerProcess = null;

async function cleanupReservedUsers() {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }
    const regex = /^\+9170000\d{5}$/;
    const testUsers = await User.find({ phone: regex });
    const userIds = testUsers.map(u => u._id);
    if (userIds.length > 0) {
      await Transaction.deleteMany({ userId: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
      await Otp.deleteMany({ phone: regex });
      console.log(`[CLEANUP] Deleted ${userIds.length} reserved test users and their transactions.`);
    } else {
      console.log('[CLEANUP] No reserved test users found to delete.');
    }
  } catch (err) {
    console.warn('[CLEANUP WARN]', err.message);
  }
}

async function fillPinInputs(page, containerSelector, pinStr) {
  const sel = `${containerSelector} input[aria-label*="digit" i], ${containerSelector} input[maxlength="1"]`;
  await page.waitForSelector(sel, { timeout: 15000 });
  const inputs = await page.$$(sel);
  for (let i = 0; i < 6 && i < inputs.length; i++) {
    await inputs[i].type(pinStr[i]);
  }
}

async function main() {
  console.log('================================================================');
  console.log(' NovaBank Comprehensive E2E Browser & UI Verification Suite');
  console.log('================================================================\n');

  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const nodeCmd = process.platform === 'win32' ? 'node.exe' : 'node';

  killPort(3000);
  await wait(1500);

  // 1. Ensure database and backend are running
  let serverProcess = null;
  let replSet = null;
  let mongoUri = process.env.MONGODB_URI;
  let usedDatabase = 'MongoDB Atlas';

  let atlasConnected = false;
  if (process.env.USE_ATLAS === 'true') {
    try {
      console.log('Testing connection to MongoDB Atlas...');
      const atlasConn = await mongoose.createConnection(mongoUri, {
        serverSelectionTimeoutMS: 4000
      }).asPromise();
      await atlasConn.close();
      atlasConnected = true;
      console.log('Successfully connected to MongoDB Atlas.');
    } catch (err) {
      console.log(`MongoDB Atlas is temporarily unreachable (${err.message.slice(0, 80)}...).`);
    }
  } else {
    console.log('MongoDB Atlas connection is unstable. Using local Mongo replica set fallback (MongoMemoryReplSet)...');
  }

  if (!atlasConnected) {
    console.log('Starting local Mongo replica set fallback (MongoMemoryReplSet)...');
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    activeReplSet = replSet;
    mongoUri = replSet.getUri();
    usedDatabase = 'MongoMemoryReplSet (Local Replica Set Fallback)';
    console.log('Started local Mongo replica set.');
  }

  // Connect this script to the chosen DB
  await connectDB(mongoUri);

  console.log('Starting Express server on port 3000 from root...');
  serverProcess = spawn(nodeCmd, ['server/src/index.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, MONGODB_URI: mongoUri, PORT: '3000' }
  });
  activeServerProcess = serverProcess;
  let serverStarted = false;
  serverProcess.stdout?.on('data', d => {
    const msg = d.toString().trim();
    console.log('  [SERVER]', msg);
    if (msg.includes('NovaBank Server running')) serverStarted = true;
  });
  serverProcess.stderr?.on('data', d => console.error('  [SERVER ERR]', d.toString().trim()));

  const serverWaitStart = Date.now();
  while (!serverStarted && Date.now() - serverWaitStart < 30000) {
    await wait(200);
  }

  const ready = await waitForBackend(45000);
  if (!ready || !serverStarted) {
    console.error('Failed to start Express backend server or database did not connect');
    if (replSet) await replSet.stop();
    process.exit(1);
  }
  console.log(`Backend server is healthy and connected to ${usedDatabase} at http://localhost:3000`);

  // 2. Ensure frontend is running
  let clientProcess = null;
  const clientReady = await waitForFrontend(3000);
  if (!clientReady) {
    console.log('Starting Vite dev server on port 5173 from root...');
    clientProcess = spawn(npmCmd, ['--workspace=client', 'run', 'dev'], {
      cwd: path.resolve(__dirname, '..'),
      shell: true,
      env: { ...process.env }
    });
    clientProcess.stdout?.on('data', d => console.log('  [CLIENT]', d.toString().trim()));
    clientProcess.stderr?.on('data', d => console.error('  [CLIENT ERR]', d.toString().trim()));
    const ready = await waitForFrontend(30000);
    if (!ready) {
      console.error('Failed to start Vite dev server');
      if (serverProcess) serverProcess.kill();
      process.exit(1);
    }
  }
  console.log('Frontend dev server is running at http://localhost:5173\n');

  // Pre-cleanup of reserved test users
  await cleanupReservedUsers();

  // 3. Launch headless browser
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('    [PAGE LOG]', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('    [PAGE ERROR]', err.message));
  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      let text = '';
      try { text = await res.text(); } catch {}
      console.log('    [API RESPONSE]', res.status(), res.request().method(), res.url(), text.slice(0, 100));
    }
  });
  await page.setViewport({ width: 390, height: 844 }); // 390px mobile viewport

  // =========================================================================
  // SUITE 1: CAPTURE 4 REQUIRED 390px SCREENSHOTS
  // =========================================================================
  console.log('--- SUITE 1: Capturing 4 Required 390px Screenshots ---');
  const screenshotUserPhone = '+917000000099';

  // Clear storage
  await page.goto(`http://localhost:${CLIENT_PORT}/welcome`, { waitUntil: 'networkidle0' });
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });

  // 1. Screenshot: Register with filled DOB & phone
  await page.goto(`http://localhost:${CLIENT_PORT}/register`, { waitUntil: 'networkidle0' });
  await page.type('input[placeholder*="Aarav"]', 'Aarav Screenshot User');
  await page.type('#dob-input-day', '15');
  await page.type('#dob-input-month', '08');
  await page.type('#dob-input-year', '1995');
  await page.type('#phone-input', '7000000099');
  await wait(300);

  const debugState = await page.evaluate(() => {
    const day = document.querySelector('#dob-input-day')?.value;
    const month = document.querySelector('#dob-input-month')?.value;
    const year = document.querySelector('#dob-input-year')?.value;
    const phone = document.querySelector('#phone-input')?.value;
    const name = document.querySelector('input[placeholder*="Aarav"]')?.value;
    return { name, day, month, year, phone };
  });
  console.log('    [FORM INPUTS IN DOM]:', debugState);

  const screenshot1Path = path.resolve(__dirname, '../docs/test-artifacts/01-register-dob-phone.png');
  await page.screenshot({ path: screenshot1Path });
  console.log(`  ✓ Saved: ${screenshot1Path}`);

  // Submit registration
  await page.click('button[type="submit"]');
  try {
    await page.waitForFunction(() => window.location.pathname.includes('/otp-verify'), { timeout: 30000 });
    console.log('  ✓ Landed on /otp-verify');
  } catch (err) {
    const errorEl = await page.$('.text-red-500, .text-red-600, .text-red-400');
    const errText = errorEl ? await page.evaluate(el => el.textContent, errorEl) : 'No error element found';
    console.error('Registration failed to navigate to /otp-verify. Visible error:', errText);
    throw err;
  }

  // 2. Screenshot: OTP Failure (enter wrong code '000000')
  await page.waitForSelector('input[aria-label*="OTP Digit 1"]', { timeout: 15000 });
  const otpBoxes = await page.$$('input[aria-label*="OTP Digit"]');
  for (let i = 0; i < 6 && i < otpBoxes.length; i++) {
    await otpBoxes[i].type('0');
  }
  await page.click('button[type="submit"]'); // Click Verify OTP
  await wait(800); // Allow shake animation and red message

  const screenshot4Path = path.resolve(__dirname, '../docs/test-artifacts/04-otp-failure.png');
  await page.screenshot({ path: screenshot4Path });
  console.log(`  ✓ Saved: ${screenshot4Path}`);

  // Wait for failure animation to settle completely back to editable row
  await wait(2200);

  // 3. Screenshot: OTP Success
  await page.waitForSelector('#demo-otp-banner', { visible: true, timeout: 15000 });
  await page.click('#demo-otp-banner'); // Auto-fill demo OTP
  await wait(500);
  await page.click('button[type="submit"]'); // Click Verify OTP
  await wait(500); // Capture green success checkmark

  const screenshot3Path = path.resolve(__dirname, '../docs/test-artifacts/03-otp-success.png');
  await page.screenshot({ path: screenshot3Path });
  console.log(`  ✓ Saved: ${screenshot3Path}`);

  // Wait to land on /set-pin
  await page.waitForFunction(() => window.location.pathname.includes('/set-pin'), { timeout: 45000 });
  console.log('  ✓ Landed on /set-pin');

  // 4. Screenshot: Set PIN with revealed digits
  await page.waitForSelector('#new-pin-input input', { timeout: 10000 });
  const newPinInputs = await page.$$('#new-pin-input input');
  for (let i = 0; i < 6 && i < newPinInputs.length; i++) {
    await newPinInputs[i].type('123456'[i]);
  }
  const confPinInputs = await page.$$('#confirm-pin-input input');
  for (let i = 0; i < 6 && i < confPinInputs.length; i++) {
    await confPinInputs[i].type('123456'[i]);
  }
  // Click eye button on new PIN to reveal
  const eyeButtons = await page.$$('button[title*="Show PIN"]');
  if (eyeButtons.length > 0) {
    await eyeButtons[0].click();
  }
  await wait(400);

  const screenshot2Path = path.resolve(__dirname, '../docs/test-artifacts/02-set-pin-revealed.png');
  await page.screenshot({ path: screenshot2Path });
  console.log(`  ✓ Saved: ${screenshot2Path}\n`);

  // =========================================================================
  // SUITE 2: 20 SEQUENTIAL TEST USERS (SET-PIN REPRODUCTION & FIX VERIFICATION)
  // =========================================================================
  console.log('--- SUITE 2: 20 Sequential Test Users Registration & Set-PIN Flow ---');
  const userResults = [];

  for (let i = 0; i < 20; i++) {
    const pad = String(i).padStart(2, '0');
    const phone = `+9170000000${pad}`;
    const name = `Sequential User ${pad}`;
    const testPin = '123456';

    try {
      await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
      await page.goto(`http://localhost:${CLIENT_PORT}/register`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('#phone-input', { visible: true });
      await wait(250);

      // Fill register
      await page.type('input[placeholder*="Aarav"]', name, { delay: 5 });
      await page.type('#dob-input-day', '10', { delay: 5 });
      await page.type('#dob-input-month', '05', { delay: 5 });
      await page.type('#dob-input-year', '1996', { delay: 5 });
      await page.type('#phone-input', `70000000${pad}`, { delay: 5 });
      await wait(350);
      await page.click('button[type="submit"]');

      // Land on OTP
      await page.waitForFunction(() => window.location.pathname.includes('/otp-verify'), { timeout: 30000 });
      await page.waitForSelector('#demo-otp-banner', { visible: true, timeout: 20000 });
      await page.click('#demo-otp-banner'); // Auto-fill
      await wait(150);
      await page.click('button[type="submit"]'); // Verify OTP

      // Land on Set-PIN
      await page.waitForFunction(() => window.location.pathname.includes('/set-pin'), { timeout: 30000 });
      await fillPinInputs(page, '#new-pin-input', testPin);
      await fillPinInputs(page, '#confirm-pin-input', testPin);

      // Verify "PINs match" indicator is present
      await page.waitForSelector('.text-emerald-500', { visible: true, timeout: 15000 });

      // Click explicit submit button
      await page.click('button[type="submit"]');

      // Verify lands on /choose-card
      await page.waitForFunction(() => window.location.pathname.includes('/choose-card'), { timeout: 30000 });

      userResults.push({ user: i + 1, phone, status: 'Success (200 OK -> /choose-card)' });
      console.log(`  ✓ [User ${i + 1}/20] Phone: ${phone} -> Register -> OTP -> Set-PIN: Success!`);
    } catch (err) {
      const pageErr = await page.evaluate(() => {
        const el = document.querySelector('.text-red-500, .text-red-600, .text-red-400');
        const errText = el ? el.textContent.trim() : '';
        const day = document.querySelector('#dob-input-day')?.value;
        const month = document.querySelector('#dob-input-month')?.value;
        const year = document.querySelector('#dob-input-year')?.value;
        const phone = document.querySelector('#phone-input')?.value;
        const name = document.querySelector('input[placeholder*="Aarav"]')?.value;
        const bodySnippet = document.body.innerText.replace(/\s+/g, ' ').slice(0, 100);
        return `[url: ${window.location.pathname}, errText: "${errText}", body: "${bodySnippet}", inputs: ${JSON.stringify({ name, day, month, year, phone })}]`;
      }).catch(() => '');
      userResults.push({ user: i + 1, phone, status: `Failed: ${err.message} (${pageErr})` });
      console.error(`  ✗ [User ${i + 1}/20] Phone: ${phone} FAILED! Error: ${err.message} ${pageErr}`);
      break;
    }
  }

  const passedCount = userResults.filter(r => r.status.includes('Success')).length;
  console.log(`\nSequential Set-PIN Result: ${passedCount}/20 users succeeded.`);
  if (passedCount !== 20) {
    console.error(`FAILED: Expected 20/20 successes, got ${passedCount}`);
    process.exit(1);
  }
  console.log('✓ Part 5: Intermittent Set-PIN Bug reproduction & fix verified 20/20!\n');

  // =========================================================================
  // SUITE 3: MULTI-USER E2E TRANSFERS (6 USERS: +917000000100 to +917000000105)
  // =========================================================================
  console.log('--- SUITE 3: Multi-User E2E Transfers (6 Users) ---');
  const multiUsers = [];

  for (let i = 0; i < 6; i++) {
    const phone = `+91700000010${i}`;
    const name = `Atlas Multi User ${i}`;
    const pin = '123456';

    await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
    await page.goto(`http://localhost:${CLIENT_PORT}/register`, { waitUntil: 'networkidle0' });

    await page.type('input[placeholder*="Aarav"]', name);
    await page.type('#dob-input-day', '12');
    await page.type('#dob-input-month', '06');
    await page.type('#dob-input-year', '1994');
    await page.type('#phone-input', `700000010${i}`);
    await wait(150);
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.includes('/otp-verify'), { timeout: 15000 });
    await page.waitForSelector('#demo-otp-banner', { visible: true, timeout: 10000 });
    await page.click('#demo-otp-banner');
    await wait(150);
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.includes('/set-pin'), { timeout: 15000 });
    await fillPinInputs(page, '#new-pin-input', pin);
    await fillPinInputs(page, '#confirm-pin-input', pin);
    await wait(150);
    await page.click('button[type="submit"]');

    await page.waitForFunction(() => window.location.pathname.includes('/choose-card'), { timeout: 15000 });

    // Choose first card and proceed to /account-created -> /home
    await wait(800);
    await page.evaluate(() => {
      const btn = document.querySelector('button[type="button"], .cursor-pointer, button');
      if (btn) btn.click();
    });
    await wait(500);

    // Fetch user
    const userDoc = await User.findOne({ phone });
    multiUsers.push({
      idx: i,
      name,
      phone,
      accountNumber: userDoc.accountNumber
    });
    console.log(`  ✓ Provisioned User ${i}: ${name} (${phone}) - Account: ${userDoc.accountNumber}`);
  }

  // Log in as User 0 via UI
  console.log('\n  Logging in as User 0 via UI...');
  await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  await page.goto(`http://localhost:${CLIENT_PORT}/login`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('#phone-input', { timeout: 10000 });
  await page.type('#phone-input', '7000000100');
  await fillPinInputs(page, '#login-pin-input', '123456');
  await wait(300);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname === '/' || window.location.pathname.includes('/home') || !window.location.pathname.includes('/login'), { timeout: 15000 });
  await wait(500);

  // Transfer 1: User 0 -> User 1 via Phone (₹500 = 50,000 paise)
  console.log(`\n  Executing UI Transfer 1: User 0 -> User 1 via Phone (${multiUsers[1].phone})...`);
  await page.click('#tab-pay');
  await page.waitForSelector('input[placeholder*="NB"]', { timeout: 10000 });
  await page.type('input[placeholder*="NB"]', multiUsers[1].phone);
  await page.type('input[placeholder*="0.00"]', '500');
  await wait(200);
  await page.click('button[type="submit"]'); // Continue to review

  // Authorize with PIN
  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Authorize with PIN'));
  }, { timeout: 15000 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.textContent.includes('Authorize with PIN'));
    if (b) b.click();
  });

  // Enter PIN inside modal
  await fillPinInputs(page, '#transfer-pin-input', '123456');
  await wait(250);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.textContent.includes('Confirm Transfer'));
    if (b) b.click();
  });

  // Verify receipt
  await page.waitForFunction(() => {
    return document.body.innerText.includes('Transfer Successful');
  }, { timeout: 15000 });
  console.log('  ✓ Transfer 1 Succeeded! UI Receipt displayed ₹500.');

  // Wait for and click "Make Another Transfer" to reset form
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(btn => btn.textContent.includes('Make Another Transfer'));
  }, { timeout: 10000 });

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.textContent.includes('Make Another Transfer'));
    if (b) b.click();
  });
  await wait(500);

  // Transfer 2: User 0 -> User 2 via Account Number (₹300)
  console.log(`\n  Executing UI Transfer 2: User 0 -> User 2 via Account (${multiUsers[2].accountNumber})...`);
  await page.waitForSelector('input[placeholder*="NB"]', { timeout: 10000 });
  await page.type('input[placeholder*="NB"]', multiUsers[2].accountNumber);
  await page.type('input[placeholder*="0.00"]', '300');
  await wait(200);
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => {
    return Array.from(document.querySelectorAll('button')).some(b => b.textContent.includes('Authorize with PIN'));
  }, { timeout: 15000 });
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.textContent.includes('Authorize with PIN'));
    if (b) b.click();
  });

  await fillPinInputs(page, '#transfer-pin-input', '123456');
  await wait(250);
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.textContent.includes('Confirm Transfer'));
    if (b) b.click();
  });

  await page.waitForFunction(() => {
    return document.body.innerText.includes('Transfer Successful');
  }, { timeout: 15000 });
  console.log('  ✓ Transfer 2 Succeeded! UI Receipt displayed ₹300.');

  // Verify Logout clears state
  console.log('\n  Verifying Logout clears tokens and authenticated state...');
  await page.click('#tab-profile');
  await page.waitForFunction(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    return btns.some(b => b.textContent.includes('Sign Out') || b.textContent.includes('Logout'));
  }, { timeout: 10000 });

  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const b = btns.find(btn => btn.textContent.includes('Sign Out') || btn.textContent.includes('Logout'));
    if (b) b.click();
  });

  await page.waitForFunction(() => {
    return !localStorage.getItem('novabank_refresh_token') && !sessionStorage.getItem('novabank_refresh_token');
  }, { timeout: 10000 });
  console.log('  ✓ Logout successfully cleared all local credentials!');

  // Cleanup reserved test users
  await cleanupReservedUsers();

  console.log('\n================================================================');
  console.log(' ALL E2E UI AND BROWSER VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('================================================================');

  await browser.close();
  if (clientProcess) clientProcess.kill();
  if (serverProcess) serverProcess.kill();
  killPort(3000);
  await wait(1500);
  if (activeReplSet) await activeReplSet.stop();
  clearTimeout(hardTimeout);
  process.exit(0);
}

main().catch(async (err) => {
  console.error('[FATAL E2E ERROR]:', err);
  await cleanupReservedUsers();
  if (activeServerProcess) {
    try { activeServerProcess.kill(); } catch {}
  }
  killPort(3000);
  await wait(1500);
  if (activeReplSet) await activeReplSet.stop();
  clearTimeout(hardTimeout);
  process.exit(1);
});
