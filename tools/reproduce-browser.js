import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVER_PORT = 3100;
const CLIENT_PORT = 5273;

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const BROWSER_PATH = fs.existsSync(CHROME_PATH) ? CHROME_PATH : EDGE_PATH;

const hardTimeout = setTimeout(() => {
  console.error('[TIMEOUT] Hard timeout 90s reached in reproduce-browser.js');
  process.exit(1);
}, 90000);

let spawnedPids = [];

function killSpawned() {
  for (const pid of spawnedPids) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', String(pid)], { stdio: 'ignore' });
      } else {
        process.kill(pid, 'SIGKILL');
      }
    } catch {}
  }
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function pollUrl(url, timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {}
    await wait(300);
  }
  return false;
}

async function fillPinInputs(page, containerSelector, pinStr) {
  const sel = `${containerSelector} input[aria-label*="digit" i], ${containerSelector} input[maxlength="1"]`;
  await page.waitForSelector(sel, { timeout: 10000 });
  const inputs = await page.$$(sel);
  for (let i = 0; i < 6 && i < inputs.length; i++) {
    await inputs[i].type(pinStr[i]);
  }
}

async function main() {
  console.log('=== STEP 1: STARTING LOCAL REPLICA SET ===');
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const mongoUri = replSet.getUri();
  console.log('MongoMemoryReplSet started.');

  console.log(`=== STEP 2: SPAWNING SERVER ON PORT ${SERVER_PORT} ===`);
  const nodeCmd = process.platform === 'win32' ? 'node.exe' : 'node';
  const serverProc = spawn(nodeCmd, ['server/src/index.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(SERVER_PORT),
      MONGODB_URI: mongoUri,
      DEMO_SHOW_OTP: 'true',
      NODE_ENV: 'development',
      CORS_ORIGINS: `http://localhost:${CLIENT_PORT},http://localhost:5173`
    },
    detached: true,
    stdio: 'ignore'
  });
  serverProc.unref();
  spawnedPids.push(serverProc.pid);
  console.log(`Server process started (PID: ${serverProc.pid})`);

  const serverReady = await pollUrl(`http://localhost:${SERVER_PORT}/api/health`, 25000);
  if (!serverReady) {
    throw new Error(`Server failed to start on port ${SERVER_PORT}`);
  }
  console.log(`Server healthy on port ${SERVER_PORT}`);

  console.log(`=== STEP 3: SPAWNING VITE ON PORT ${CLIENT_PORT} ===`);
  const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const clientProc = spawn(npmCmd, ['--workspace=client', 'run', 'dev', '--', '--port', String(CLIENT_PORT), '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    shell: true,
    env: {
      ...process.env,
      VITE_PROXY_TARGET: `http://localhost:${SERVER_PORT}`,
      VITE_API_BASE_URL: `http://localhost:${SERVER_PORT}`
    },
    detached: true,
    stdio: 'ignore'
  });
  clientProc.unref();
  spawnedPids.push(clientProc.pid);
  console.log(`Client process started (PID: ${clientProc.pid})`);

  const clientReady = await pollUrl(`http://localhost:${CLIENT_PORT}`, 30000);
  if (!clientReady) {
    throw new Error(`Client failed to start on port ${CLIENT_PORT}`);
  }
  console.log(`Client ready on port ${CLIENT_PORT}`);

  console.log('=== STEP 4: LAUNCHING BROWSER FOR REPRODUCTIONS ===');
  const browser = await puppeteer.launch({
    executablePath: BROWSER_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844 });

  const networkLog = [];
  page.on('request', req => {
    if (req.url().includes('/api/')) {
      networkLog.push({ type: 'REQ', method: req.method(), url: req.url(), postData: req.postData() });
      console.log(`  -> [REQ] ${req.method()} ${req.url()}`, req.postData() || '');
    }
  });

  page.on('response', async res => {
    if (res.url().includes('/api/')) {
      let bodyText = '';
      try { bodyText = await res.text(); } catch {}
      networkLog.push({ type: 'RES', status: res.status(), url: res.url(), body: bodyText });
      console.log(`  <- [RES] ${res.status()} ${res.url()}`, bodyText);
    }
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[CLIENT') || text.includes('error') || text.includes('Error')) {
      console.log(`    [BROWSER CONSOLE] ${msg.type()}: ${text}`);
    }
  });

  // -------------------------------------------------------------
  // REPRODUCTION 1a: OTP Screen Issue
  // -------------------------------------------------------------
  console.log('\n--- REPRODUCING 1a: OTP Screen Flow with +917777777777 ---');
  await page.goto(`http://localhost:${CLIENT_PORT}/register`, { waitUntil: 'networkidle0' });
  await page.type('input[placeholder*="Aarav"]', 'Test OTP User');
  await page.type('#dob-input-day', '15');
  await page.type('#dob-input-month', '08');
  await page.type('#dob-input-year', '1995');
  await page.type('#phone-input', '77777 77777');
  await wait(300);
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => window.location.pathname.includes('/otp-verify'), { timeout: 10000 });
  await wait(1000); // Allow any auto-requests or re-renders

  const bannerText = await page.evaluate(() => {
    const el = document.querySelector('#demo-otp-banner');
    return el ? el.innerText : null;
  });
  console.log(`[1a Result] Demo OTP Banner text: ${JSON.stringify(bannerText)}`);

  // Click banner "Tap to fill"
  const bannerEl = await page.$('#demo-otp-banner');
  if (bannerEl) {
    await bannerEl.click();
    await wait(300);
  }

  const enteredCode = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input[maxlength="1"], input[aria-label*="digit" i]'));
    return inputs.map(i => i.value).join('');
  });
  console.log(`[1a Result] Entered code in UI: ${enteredCode}`);

  // Click Verify OTP
  await page.click('button[type="submit"]');
  await wait(1500);

  const otpError = await page.evaluate(() => {
    const el = document.querySelector('#otp-error-message') || document.querySelector('.text-red-600');
    return el ? el.innerText : null;
  });
  console.log(`[1a Result] OTP Verification error message on screen: ${JSON.stringify(otpError)}`);

  // -------------------------------------------------------------
  // REPRODUCTION 1b: Register Screen Issue
  // -------------------------------------------------------------
  console.log('\n--- REPRODUCING 1b: Register Screen Flow with "charan  gffff", DOB 05/04/1940, phone 88888 88888 ---');
  await page.goto(`http://localhost:${CLIENT_PORT}/register`, { waitUntil: 'networkidle0' });
  await page.type('input[placeholder*="Aarav"]', 'charan  gffff');
  await page.type('#dob-input-day', '05');
  await page.type('#dob-input-month', '04');
  await page.type('#dob-input-year', '1940');
  await page.type('#phone-input', '88888 88888');
  await wait(300);

  const regFormState = await page.evaluate(() => {
    const name = document.querySelector('input[placeholder*="Aarav"]')?.value;
    const day = document.querySelector('#dob-input-day')?.value;
    const month = document.querySelector('#dob-input-month')?.value;
    const year = document.querySelector('#dob-input-year')?.value;
    const phone = document.querySelector('#phone-input')?.value;
    const errors = Array.from(document.querySelectorAll('.text-red-600, .text-red-500')).map(e => e.innerText);
    return { name, day, month, year, phone, errors };
  });
  console.log('[1b State before click]:', JSON.stringify(regFormState));

  await page.click('button[type="submit"]');
  await wait(1500);

  const regErrorAfterClick = await page.evaluate(() => {
    const errors = Array.from(document.querySelectorAll('.text-red-600, .text-red-500')).map(e => e.innerText);
    return { path: window.location.pathname, errors };
  });
  console.log('[1b State after click]:', JSON.stringify(regErrorAfterClick));

  // -------------------------------------------------------------
  // REPRODUCTION 1c: "failed to set" PIN & "self transfers"
  // -------------------------------------------------------------
  console.log('\n--- REPRODUCING 1c: Set-PIN & Self-transfer diagnostics ---');

  // Let's test registering a fresh number +917100000001
  await page.goto(`http://localhost:${CLIENT_PORT}/register`, { waitUntil: 'networkidle0' });
  await page.type('input[placeholder*="Aarav"]', 'User One');
  await page.type('#dob-input-day', '10');
  await page.type('#dob-input-month', '10');
  await page.type('#dob-input-year', '1998');
  await page.type('#phone-input', '71000 00001');
  await wait(300);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.includes('/otp-verify'), { timeout: 10000 });
  await wait(500);
  await page.click('#demo-otp-banner');
  await wait(300);
  await page.click('button[type="submit"]');

  await page.waitForFunction(() => window.location.pathname.includes('/set-pin'), { timeout: 10000 });
  console.log('[1c] Successfully landed on /set-pin.');

  // What if user enters mismatching PINs or submits without valid tempToken?
  await fillPinInputs(page, '#new-pin-input', '123456');
  await fillPinInputs(page, '#confirm-pin-input', '654321');
  await wait(300);
  await page.click('button[type="submit"]');
  await wait(500);
  const pinMismatchError = await page.evaluate(() => {
    const el = document.querySelector('.text-amber-500, .text-red-600, .text-red-500');
    return el ? el.innerText : null;
  });
  console.log(`[1c Result] Set-PIN mismatch error: ${JSON.stringify(pinMismatchError)}`);

  // Now test correct PIN
  await fillPinInputs(page, '#confirm-pin-input', '123456');
  await wait(300);
  await page.click('button[type="submit"]');
  await page.waitForFunction(() => window.location.pathname.includes('/choose-card') || window.location.pathname === '/', { timeout: 10000 });
  console.log('[1c Result] Set-PIN with matching PIN succeeded to:', await page.evaluate(() => window.location.pathname));

  await browser.close();
  await replSet.stop();
  killSpawned();
  clearTimeout(hardTimeout);
  console.log('\n=== REPRODUCTIONS COMPLETE ===');
  process.exit(0);
}

main().catch(err => {
  console.error('[FATAL REPRO ERROR]:', err);
  killSpawned();
  clearTimeout(hardTimeout);
  process.exit(1);
});
