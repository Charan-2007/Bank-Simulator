import puppeteer from 'puppeteer-core';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hardTimeout = setTimeout(() => {
  console.error('Timed out after 30s');
  process.exit(1);
}, 30000);
hardTimeout.unref();

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

  const ready = await waitForServer('http://localhost:5173/dev/glass-test');
  if (!ready) {
    console.error('Failed to start Vite');
    viteProcess.kill();
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--enable-gpu-rasterization']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  await page.goto('http://localhost:5173/dev/glass-test', { waitUntil: 'networkidle0' });

  // 1. Check Full Mode
  await page.click('#glass-btn-full');
  await new Promise((r) => setTimeout(r, 300));
  const fullInfo = await page.evaluate(() => {
    const el = document.querySelector('.nav');
    const cs = window.getComputedStyle(el);
    return {
      glassAttr: document.documentElement.getAttribute('data-glass'),
      backdropFilter: cs.backdropFilter,
      webkitBackdropFilter: cs.webkitBackdropFilter,
      background: cs.backgroundColor,
      borderRadius: cs.borderRadius
    };
  });
  console.log('FULL MODE COMPUTED:', fullInfo);

  // 2. Check Off Mode
  await page.click('#glass-btn-off');
  await new Promise((r) => setTimeout(r, 300));
  const offInfo = await page.evaluate(() => {
    const el = document.querySelector('.nav');
    const cs = window.getComputedStyle(el);
    return {
      glassAttr: document.documentElement.getAttribute('data-glass'),
      backdropFilter: cs.backdropFilter,
      webkitBackdropFilter: cs.webkitBackdropFilter,
      background: cs.backgroundColor,
      borderRadius: cs.borderRadius
    };
  });
  console.log('OFF MODE COMPUTED:', offInfo);

  await browser.close();
  viteProcess.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
