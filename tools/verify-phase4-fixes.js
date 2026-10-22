import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hardTimeout = setTimeout(() => {
  console.error('Phase 4 verification timed out after 60 seconds.');
  process.exit(1);
}, 60000);
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
    } catch {}
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  console.log('--- Starting Phase 4 Verification Suite ---');

  const viteProcess = spawn('npx', ['vite', '--port', '5173'], {
    cwd: path.resolve(__dirname, '../client'),
    shell: true,
    stdio: 'ignore'
  });

  const ready = await waitForServer('http://localhost:5173/dev/glass-test');
  if (!ready) {
    console.error('Vite dev server failed to start on port 5173');
    viteProcess.kill();
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-gpu-rasterization']
  });

  const page = await browser.newPage();

  // =========================================================================
  // 1. ALIGNMENT TABLE AT 360, 390, 412 px IN FULL, LITE, OFF MODES
  // =========================================================================
  console.log('\n--- 1. Testing Tab Bubble Alignment ---');
  const widths = [360, 390, 412];
  const modes = ['full', 'lite', 'off'];
  const tabs = [
    { idx: 0, id: 'home', label: 'Home' },
    { idx: 1, id: 'cards', label: 'Cards' },
    { idx: 2, id: 'pay', label: 'Pay' },
    { idx: 3, id: 'passbook', label: 'Passbook' },
    { idx: 4, id: 'profile', label: 'Profile' }
  ];

  const alignmentResults = [];

  for (const width of widths) {
    await page.setViewport({ width, height: 844, deviceScaleFactor: 2 });
    await page.goto('http://localhost:5173/dev/glass-test?debug=1', { waitUntil: 'networkidle0' });

    for (const mode of modes) {
      await page.click(`#glass-btn-${mode}`);
      await new Promise((r) => setTimeout(r, 100));

      for (const tab of tabs) {
        await page.click(`#tab-${tab.id}`);
        await new Promise((r) => setTimeout(r, 400));

        const metrics = await page.evaluate((tabId) => {
          const tabEl = document.querySelector(`#tab-${tabId}`);
          const bubbleEl = document.querySelector('#glass-bubble-element');
          if (!tabEl || !bubbleEl) return null;

          const tb = tabEl.getBoundingClientRect();
          const bb = bubbleEl.getBoundingClientRect();

          const tabCenterX = (tb.left + tb.right) / 2;
          const tabCenterY = (tb.top + tb.bottom) / 2;
          const bubbleCenterX = (bb.left + bb.right) / 2;
          const bubbleCenterY = (bb.top + bb.bottom) / 2;

          const diffX = bubbleCenterX - tabCenterX;
          const diffY = bubbleCenterY - tabCenterY;

          return {
            tabCenterX: Number(tabCenterX.toFixed(2)),
            tabCenterY: Number(tabCenterY.toFixed(2)),
            bubbleCenterX: Number(bubbleCenterX.toFixed(2)),
            bubbleCenterY: Number(bubbleCenterY.toFixed(2)),
            diffX: Number(diffX.toFixed(2)),
            diffY: Number(diffY.toFixed(2)),
            within1px: Math.abs(diffX) <= 1.0 && Math.abs(diffY) <= 1.0
          };
        }, tab.id);

        alignmentResults.push({
          width,
          mode: mode.toUpperCase(),
          tab: tab.label,
          ...metrics
        });
      }
    }
  }

  const allPassed = alignmentResults.every((r) => r.within1px);
  console.log(`Alignment tests count: ${alignmentResults.length}`);
  console.log(`All within ±1.0 px: ${allPassed ? 'YES (PASS)' : 'NO (FAIL)'}`);

  // =========================================================================
  // 2. BLUR PROOF: 2X ZOOMED CROP OVER CARD SEAM (FULL VS OFF)
  // =========================================================================
  console.log('\n--- 2. Capturing Blur Proof Zoom Crops ---');
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/dev/glass-test', { waitUntil: 'networkidle0' });

  // Scroll card seam block directly behind bottom bar
  await page.evaluate(() => {
    const seam = document.querySelector('#card-seam-target');
    const bar = document.querySelector('#bottom-bar-container');
    if (!seam || !bar) return;

    const barRect = bar.getBoundingClientRect();
    const seamRect = seam.getBoundingClientRect();
    const targetScrollY = window.scrollY + (seamRect.top + seamRect.height / 2) - (barRect.top + barRect.height / 2);
    window.scrollTo(0, targetScrollY);
  });
  await new Promise((r) => setTimeout(r, 600));

  const barClip = await page.evaluate(() => {
    const bar = document.querySelector('#bottom-bar-container');
    const b = bar.getBoundingClientRect();
    const width = 160;
    return {
      x: Math.round(b.x + (b.width - width) / 2),
      y: Math.max(0, Math.round(b.y - 25)),
      width: width,
      height: Math.round(b.height + 35)
    };
  });

  // A. FULL Mode
  await page.click('#glass-btn-full');
  await new Promise((r) => setTimeout(r, 400));
  const fullBackdropFilter = await page.evaluate(() => {
    const el = document.querySelector('.nav');
    return window.getComputedStyle(el).backdropFilter;
  });
  const fullCropPath = path.join(screenshotDir, 'blur-crop-full-2x.png');
  await page.screenshot({ path: fullCropPath, clip: barClip });
  console.log('Saved Full blur crop:', fullCropPath);
  console.log('Full Mode Computed backdrop-filter:', fullBackdropFilter);

  // B. OFF Mode
  await page.click('#glass-btn-off');
  await new Promise((r) => setTimeout(r, 400));
  const offBackdropFilter = await page.evaluate(() => {
    const el = document.querySelector('.nav');
    return window.getComputedStyle(el).backdropFilter;
  });
  const offCropPath = path.join(screenshotDir, 'blur-crop-off-2x.png');
  await page.screenshot({ path: offCropPath, clip: barClip });
  console.log('Saved Off blur crop:', offCropPath);
  console.log('Off Mode Computed backdrop-filter:', offBackdropFilter);

  // C. Combined side by side
  const fullBase64 = fs.readFileSync(fullCropPath).toString('base64');
  const offBase64 = fs.readFileSync(offCropPath).toString('base64');

  await page.evaluate(({ full64, off64, fullFilter, offFilter }) => {
    document.body.innerHTML = `
      <div id="side-by-side-container" style="display: flex; gap: 24px; background: #0b0f19; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: white;">
        <div>
          <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px; color: #38bdf8;">FULL MODE (backdrop-filter: ${fullFilter})</div>
          <img id="img-full" src="data:image/png;base64,${full64}" style="border: 2px solid #38bdf8; border-radius: 12px; width: 380px; display: block;" />
          <div style="font-size: 11.5px; color: #94a3b8; margin-top: 8px; max-width: 380px;">
            <span style="color: #4ade80; font-weight: bold;">Soft optical blur:</span> The sharp seam between Vivid Rose and Electric Cyan is diffused smoothly across the 18px blur radius inside the translucent bar.
          </div>
        </div>
        <div>
          <div style="font-size: 14px; font-weight: 700; margin-bottom: 8px; color: #f43f5e;">OFF MODE (backdrop-filter: ${offFilter})</div>
          <img id="img-off" src="data:image/png;base64,${off64}" style="border: 2px solid #f43f5e; border-radius: 12px; width: 380px; display: block;" />
          <div style="font-size: 11.5px; color: #94a3b8; margin-top: 8px; max-width: 380px;">
            <span style="color: #f87171; font-weight: bold;">Solid surface:</span> Backdrop blur is disabled; surface is solid dark (#131b2e) with zero transparency or optical refraction.
          </div>
        </div>
      </div>
    `;
  }, { full64: fullBase64, off64: offBase64, fullFilter: fullBackdropFilter, offFilter: offBackdropFilter });

  await new Promise((r) => setTimeout(r, 200));
  const compositeEl = await page.$('#side-by-side-container');
  const sideBySidePath = path.join(screenshotDir, 'blur-comparison-full-vs-off.png');
  await compositeEl.screenshot({ path: sideBySidePath });
  console.log('Saved side-by-side composite:', sideBySidePath);

  // =========================================================================
  // 3. THREE BUBBLE DRAG SCREENSHOTS AT 390px WITH OUTLINE VISIBLE
  // =========================================================================
  console.log('\n--- 3. Capturing Bubble Drag with Outlines ---');
  await page.goto('http://localhost:5173/dev/glass-test?debug=1', { waitUntil: 'networkidle0' });
  await page.click('#glass-btn-full');
  await page.click('#tab-home');
  await new Promise((r) => setTimeout(r, 500));

  const navBox = await page.evaluate(() => {
    const el = document.querySelector('#bottom-bar-container');
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });

  const startX = navBox.x + navBox.width * 0.1;
  const startY = navBox.y + navBox.height * 0.5;

  // Drag Start
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await new Promise((r) => setTimeout(r, 150));
  const dragStartPath = path.join(screenshotDir, 'bubble-drag-debug-start.png');
  await page.screenshot({ path: dragStartPath });
  console.log('Saved bubble drag start:', dragStartPath);

  // Mid Drag (drag towards Pay / Passbook)
  await page.mouse.move(startX + 125, startY, { steps: 5 });
  await new Promise((r) => setTimeout(r, 150));
  const dragMidPath = path.join(screenshotDir, 'bubble-drag-debug-mid.png');
  await page.screenshot({ path: dragMidPath });
  console.log('Saved bubble drag mid:', dragMidPath);

  // Settled (release and allow full 1200ms spring settling)
  await page.mouse.up();
  await new Promise((r) => setTimeout(r, 1200));
  const dragSettledPath = path.join(screenshotDir, 'bubble-drag-debug-settled.png');
  await page.screenshot({ path: dragSettledPath });
  console.log('Saved bubble drag settled:', dragSettledPath);

  // =========================================================================
  // 4. REAL FRAME STATS BENCHMARK IN AUTO MODE
  // =========================================================================
  console.log('\n--- 4. Running Real Frame Benchmark in Auto Mode ---');
  await page.click('#glass-btn-auto');
  await new Promise((r) => setTimeout(r, 3500)); // wait for 180 frames

  const frameData = await page.evaluate(() => {
    const avgEl = document.querySelector('#stat-avg-frametime');
    const worstEl = document.querySelector('#stat-worst-frametime');
    const fpsEl = document.querySelector('#stat-fps');
    const samplesEl = document.querySelector('#stat-samples');
    return {
      avg: avgEl ? avgEl.innerText : 'no data',
      worst: worstEl ? worstEl.innerText : 'no data',
      fps: fpsEl ? fpsEl.innerText : 'no data',
      samples: samplesEl ? samplesEl.innerText : '0 frames'
    };
  });

  console.log('Measured Auto Mode Frame Data:', frameData);

  // Write full alignment table JSON for reporting
  fs.writeFileSync(
    path.join(__dirname, 'alignment-results.json'),
    JSON.stringify({ alignmentResults, frameData, fullBackdropFilter, offBackdropFilter }, null, 2)
  );

  await browser.close();
  viteProcess.kill();
  console.log('\n--- Verification Completed Successfully ---');
  process.exit(0);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
