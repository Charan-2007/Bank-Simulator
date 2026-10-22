import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const hardTimeout = setTimeout(() => {
  console.error('Clean clone verification timed out after 120 seconds.');
  process.exit(1);
}, 120000);
hardTimeout.unref();

const tempDir = path.resolve(os.tmpdir(), `novabank-clean-${Date.now()}`);

console.log('\n========================================');
console.log('Clean-Clone Verification Check');
console.log(`Target Temp Dir: ${tempDir}`);
console.log('========================================\n');

let serverProcess = null;

try {
  // 1. Clone local git repo to temp directory
  console.log('1. Cloning git repository into temp directory...');
  execSync(`git clone "${rootDir}" "${tempDir}"`, { stdio: 'inherit' });

  // 2. Copy server/.env silently without printing any contents
  console.log('2. Copying server/.env into clean clone...');
  const srcEnv = path.resolve(rootDir, 'server/.env');
  const destEnv = path.resolve(tempDir, 'server/.env');
  if (fs.existsSync(srcEnv)) {
    fs.copyFileSync(srcEnv, destEnv);
  } else {
    throw new Error('server/.env not found in root workspace.');
  }

  // 3. Test clean npm ci from root
  console.log('3. Running npm --prefix server ci from clean clone root...');
  execSync('npm --prefix server ci', { cwd: tempDir, stdio: 'inherit' });

  // 4. Run server test suite in clean clone
  console.log('4. Running server test suite in clean clone...');
  execSync('npm --prefix server test', { cwd: tempDir, stdio: 'inherit' });

  // 5. Start detached server on port 3100 in clean clone
  console.log('5. Spawning detached server on port 3100...');
  serverProcess = spawn('node', ['src/index.js'], {
    cwd: path.resolve(tempDir, 'server'),
    env: { ...process.env, PORT: '3100', NODE_ENV: 'development' },
    stdio: 'ignore',
    detached: true
  });
  serverProcess.unref();

  const pid = serverProcess.pid;
  console.log(`   Server spawned with PID: ${pid}`);

  // 6. Poll GET /api/health up to 30s
  console.log('6. Polling http://localhost:3100/api/health...');
  let connected = false;
  const start = Date.now();

  while (Date.now() - start < 30000) {
    try {
      const res = await fetch('http://localhost:3100/api/health');
      if (res.ok) {
        const body = await res.json();
        console.log(`   Health check passed! Status: ${body.status}, DB: ${body.dbStatus}`);
        connected = true;
        break;
      }
    } catch {
      // Server not yet listening
    }
    await new Promise(r => setTimeout(r, 500));
  }

  if (!connected) {
    throw new Error('Server on port 3100 failed to respond within 30 seconds.');
  }

  // 7. Verify GET /api/cards returns 29 cards
  console.log('7. Verifying GET http://localhost:3100/api/cards...');
  const cardsRes = await fetch('http://localhost:3100/api/cards');
  if (!cardsRes.ok) throw new Error(`Cards endpoint failed with status ${cardsRes.status}`);
  const cardsBody = await cardsRes.json();
  if (!cardsBody.cards || cardsBody.cards.length !== 29) {
    throw new Error(`Expected 29 cards in manifest, received: ${cardsBody.cards?.length}`);
  }
  console.log(`   Cards manifest verified: exactly ${cardsBody.cards.length} cards returned.`);

  console.log('\n[PASS] Clean-clone verification succeeded completely!\n');
} catch (err) {
  console.error('\n[FAIL] Clean clone check failed:', err.message);
  process.exitCode = 1;
} finally {
  // Always stop spawned server PID
  if (serverProcess && serverProcess.pid) {
    console.log(`Cleaning up spawned server PID ${serverProcess.pid}...`);
    try {
      process.kill(serverProcess.pid, 'SIGTERM');
    } catch {
      // Already exited
    }
  }

  // Clean up temp directory
  if (fs.existsSync(tempDir)) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore temp folder locked handles on Windows
    }
  }
  process.exit(process.exitCode || 0);
}
