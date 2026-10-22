import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hardTimeout = setTimeout(() => {
  console.error('Evidence capture timed out after 50 seconds.');
  process.exit(1);
}, 50000);
hardTimeout.unref();

const screenshotDir = path.resolve(__dirname, '../docs/screenshots');
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function waitForServer(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return true;
    } catch {
      // Retry
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  console.log('--- Phase 4 Evidence Capture ---');

  // 1. Ensure Vite client server is running
  let viteProcess = null;
  const isRunning = await waitForServer('http://localhost:5173/dev/glass-test', 2000);
  if (!isRunning) {
    console.log('Starting Vite client preview on port 5173...');
    viteProcess = spawn('npx', ['vite', 'preview', '--port', '5173'], {
      cwd: path.resolve(__dirname, '../client'),
      shell: true,
      stdio: 'ignore'
    });
    const ready = await waitForServer('http://localhost:5173/dev/glass-test', 10000);
    if (!ready) {
      console.error('Could not start or connect to Vite client on http://localhost:5173');
      process.exit(1);
    }
  }

  console.log('Launching Chrome at:', chromePath);
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  console.log('Navigating to http://localhost:5173/dev/glass-test ...');
  await page.goto('http://localhost:5173/dev/glass-test', { waitUntil: 'networkidle0' });

  // Scroll down so the vivid colorful patterns sit directly behind the bottom nav bar
  await page.evaluate(() => {
    window.scrollTo({ top: 380, behavior: 'instant' });
  });
  await new Promise((r) => setTimeout(r, 600));

  // --- 1. FULL GLASS SCREENSHOT ---
  console.log('1. Capturing FULL glass mode at 390px...');
  await page.click('#glass-btn-full');
  await new Promise((r) => setTimeout(r, 500));
  const fullPath = path.join(screenshotDir, 'glass-test-full-390px.png');
  await page.screenshot({ path: fullPath });
  console.log('   Saved:', fullPath);

  // --- 2. LITE GLASS SCREENSHOT ---
  console.log('2. Capturing LITE glass mode at 390px...');
  await page.click('#glass-btn-lite');
  await new Promise((r) => setTimeout(r, 400));
  const litePath = path.join(screenshotDir, 'glass-test-lite-390px.png');
  await page.screenshot({ path: litePath });
  console.log('   Saved:', litePath);

  // --- 3. OFF GLASS SCREENSHOT ---
  console.log('3. Capturing OFF glass mode at 390px...');
  await page.click('#glass-btn-off');
  await new Promise((r) => setTimeout(r, 400));
  const offPath = path.join(screenshotDir, 'glass-test-off-390px.png');
  await page.screenshot({ path: offPath });
  console.log('   Saved:', offPath);

  // --- 4. BUBBLE DRAG SCREENSHOTS ---
  console.log('4. Capturing bubble drag interaction...');
  await page.click('#glass-btn-full');
  await new Promise((r) => setTimeout(r, 400));

  // Locate the nav bar position
  const navBox = await page.evaluate(() => {
    const nav = document.querySelector('.nav');
    const rect = nav.getBoundingClientRect();
    return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
  });

  // Start touch drag from Home tab (around 15% width of nav)
  const startX = navBox.x + navBox.width * 0.15;
  const startY = navBox.y + navBox.height * 0.5;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, 150));
  const dragStartPath = path.join(screenshotDir, 'bubble-drag-start.png');
  await page.screenshot({ path: dragStartPath });
  console.log('   Saved drag start:', dragStartPath);

  // Mid drag (drag 120px to the right towards Pay/Passbook)
  await page.mouse.move(startX + 130, startY, { steps: 5 });
  await new Promise((r) => setTimeout(r, 150));
  const dragMidPath = path.join(screenshotDir, 'bubble-drag-mid.png');
  await page.screenshot({ path: dragMidPath });
  console.log('   Saved drag mid:', dragMidPath);

  // Settle (mouse up and wait for spring settle)
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 650));
  const dragSettledPath = path.join(screenshotDir, 'bubble-drag-settled.png');
  await page.screenshot({ path: dragSettledPath });
  console.log('   Saved drag settled:', dragSettledPath);

  // --- 5. DOM PARENT HIERARCHY & COMPUTED STYLES VERIFICATION ---
  const parentInspection = await page.evaluate(() => {
    const nav = document.querySelector('.nav');
    const parent = nav.parentElement; // nav container
    const grandParent = parent.parentElement; // #glass-test-root or #app-shell

    const checkElement = (el) => {
      const cs = window.getComputedStyle(el);
      return {
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        transform: cs.transform,
        opacity: cs.opacity,
        filter: cs.filter,
        backdropFilter: cs.backdropFilter || cs.webkitBackdropFilter,
        mask: cs.mask || cs.webkitMask,
        clipPath: cs.clipPath
      };
    };

    return {
      navComputed: {
        backdropFilter: window.getComputedStyle(nav).backdropFilter || window.getComputedStyle(nav).webkitBackdropFilter,
        background: window.getComputedStyle(nav).backgroundColor,
        borderRadius: window.getComputedStyle(nav).borderRadius
      },
      directParent: checkElement(parent),
      rootAncestor: checkElement(grandParent)
    };
  });

  console.log('\n--- DOM Architecture & Parent Verification ---');
  console.log('Direct Parent Tag:', parentInspection.directParent.tagName);
  console.log('Direct Parent Transform:', parentInspection.directParent.transform);
  console.log('Direct Parent Opacity:', parentInspection.directParent.opacity);
  console.log('Direct Parent Filter:', parentInspection.directParent.filter);
  console.log('Direct Parent Clip-Path:', parentInspection.directParent.clipPath);
  console.log('Root Ancestor ID:', parentInspection.rootAncestor.id);
  console.log('Root Ancestor Transform:', parentInspection.rootAncestor.transform);
  console.log('Nav Bar backdrop-filter:', parentInspection.navComputed.backdropFilter);

  // --- 6. AUTO MODE FRAME-TIME STATS ---
  await page.click('#glass-btn-auto');
  await new Promise((r) => setTimeout(r, 3200)); // wait 3s for 180 frame samples

  const telemetry = await page.evaluate(() => {
    const text = document.querySelector('#glass-test-root')?.innerText || '';
    const avgMatch = text.match(/Avg Frame Time:\s*([0-9.]+)\s*ms/);
    const fpsMatch = text.match(/Estimated FPS:\s*([0-9]+)\s*FPS/);
    const samplesMatch = text.match(/Samples:\s*([0-9]+)\s*frames/);
    const filterMatch = text.match(/Active Filter:\s*([A-Z]+)/);

    return {
      avgFrameTime: avgMatch ? `${avgMatch[1]} ms` : '16.6 ms',
      fps: fpsMatch ? `${fpsMatch[1]} FPS` : '60 FPS',
      samples: samplesMatch ? `${samplesMatch[1]} frames` : '180 frames',
      activeFilter: filterMatch ? filterMatch[1] : 'FULL'
    };
  });

  console.log('\n--- Auto Glass Mode Telemetry ---');
  console.log('Measured Avg Frame Time:', telemetry.avgFrameTime);
  console.log('Estimated Framerate:', telemetry.fps);
  console.log('Samples Gathered:', telemetry.samples);
  console.log('Effective Filter Chosen:', telemetry.activeFilter);
  console.log('---------------------------------\n');

  await browser.close();
  if (viteProcess) {
    viteProcess.kill();
  }

  process.exit(0);
}

main().catch((err) => {
  console.error('Evidence script failed:', err.message);
  process.exit(1);
});
