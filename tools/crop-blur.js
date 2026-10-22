import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hardTimeout = setTimeout(() => {
  console.error('Timed out after 30s');
  process.exit(1);
}, 30000);
hardTimeout.unref();

const screenshotDir = path.resolve(__dirname, '../docs/screenshots');
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
  const viteProcess = spawn('npx', ['vite', '--port', '5173'], {
    cwd: path.resolve(__dirname, '../client'),
    shell: true,
    stdio: 'ignore'
  });

  await waitForServer('http://localhost:5173/dev/glass-test');

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-gpu-rasterization']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/dev/glass-test', { waitUntil: 'networkidle0' });

  // Scroll card seam block directly behind bottom bar
  const scrollInfo = await page.evaluate(() => {
    const seam = document.querySelector('#card-seam-target');
    const bar = document.querySelector('#bottom-bar-container');
    if (!seam || !bar) return null;

    const barRect = bar.getBoundingClientRect();
    const seamRect = seam.getBoundingClientRect();
    const targetScrollY = window.scrollY + (seamRect.top + seamRect.height / 2) - (barRect.top + barRect.height / 2);
    window.scrollTo(0, targetScrollY);

    const finalBar = bar.getBoundingClientRect();
    const finalSeam = seam.getBoundingClientRect();
    return {
      barCenterY: finalBar.top + finalBar.height / 2,
      seamCenterY: finalSeam.top + finalSeam.height / 2,
      seamRect: { top: finalSeam.top, bottom: finalSeam.bottom, left: finalSeam.left, width: finalSeam.width }
    };
  });

  console.log('Scroll Alignment Result:', scrollInfo);
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

  // 1. FULL MODE
  await page.click('#glass-btn-full');
  await new Promise((r) => setTimeout(r, 400));
  const fullBackdropFilter = await page.evaluate(() => {
    const el = document.querySelector('.nav');
    return window.getComputedStyle(el).backdropFilter;
  });
  const fullPath = path.join(screenshotDir, 'blur-crop-full-2x.png');
  await page.screenshot({ path: fullPath, clip: barClip });
  console.log('FULL computed backdrop-filter:', fullBackdropFilter);

  // 2. OFF MODE
  await page.click('#glass-btn-off');
  await new Promise((r) => setTimeout(r, 400));
  const offBackdropFilter = await page.evaluate(() => {
    const el = document.querySelector('.nav');
    return window.getComputedStyle(el).backdropFilter;
  });
  const offPath = path.join(screenshotDir, 'blur-crop-off-2x.png');
  await page.screenshot({ path: offPath, clip: barClip });
  console.log('OFF computed backdrop-filter:', offBackdropFilter);

  // 3. Side-by-side composite canvas
  const fullBase64 = fs.readFileSync(fullPath).toString('base64');
  const offBase64 = fs.readFileSync(offPath).toString('base64');

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

  await browser.close();
  viteProcess.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
