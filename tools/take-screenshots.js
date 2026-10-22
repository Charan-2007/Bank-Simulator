import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PREVIEW_PORT = 4173;
const SCREENSHOT_DIR = path.resolve(__dirname, '../docs/screenshots');

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function runCommand(cmd, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(cmd, args, { stdio: 'inherit' });
    proc.on('close', code => {
      if (code === 0) resolve();
      else reject(new Error(`Command ${cmd} exited with code ${code}`));
    });
    proc.on('error', reject);
  });
}

async function takeScreenshots() {
  const hardTimeout = setTimeout(() => {
    console.error('Screenshot script timed out after 35s.');
    process.exit(1);
  }, 35000);
  hardTimeout.unref();

  console.log('Starting client preview server on port 4173...');
  const preview = spawn('npx', ['vite', 'preview', '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: path.resolve(__dirname, '../client'),
    shell: true
  });

  await wait(2500);

  try {
    console.log('Capturing mobile welcome screenshot (390x844)...');
    await runCommand(EDGE_PATH, [
      '--headless',
      '--disable-gpu',
      `--window-size=390,844`,
      `--screenshot=${path.join(SCREENSHOT_DIR, 'welcome-mobile-390px.png')}`,
      `http://localhost:${PREVIEW_PORT}/welcome`
    ]);

    console.log('Capturing desktop welcome screenshot (1280x800)...');
    await runCommand(EDGE_PATH, [
      '--headless',
      '--disable-gpu',
      `--window-size=1280,800`,
      `--screenshot=${path.join(SCREENSHOT_DIR, 'welcome-desktop-1280px.png')}`,
      `http://localhost:${PREVIEW_PORT}/welcome`
    ]);

    console.log('Capturing mobile login screenshot (390x844)...');
    await runCommand(EDGE_PATH, [
      '--headless',
      '--disable-gpu',
      `--window-size=390,844`,
      `--screenshot=${path.join(SCREENSHOT_DIR, 'login-mobile-390px.png')}`,
      `http://localhost:${PREVIEW_PORT}/login`
    ]);

    console.log('Capturing glass test verification (390x844)...');
    await runCommand(EDGE_PATH, [
      '--headless',
      '--disable-gpu',
      `--window-size=390,844`,
      `--screenshot=${path.join(SCREENSHOT_DIR, 'glass-nav-390px.png')}`,
      `http://localhost:${PREVIEW_PORT}/dev/glass-test`
    ]);

    console.log('✓ All requested screenshots captured successfully.');
  } catch (err) {
    console.error('Screenshot capture failed:', err);
  } finally {
    preview.kill();
    process.exit(0);
  }
}

takeScreenshots();
