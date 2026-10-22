import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const hardTimeout = setTimeout(() => {
  console.error('Smoke pair test timed out after 45 seconds.');
  process.exit(1);
}, 45000);
hardTimeout.unref();

console.log('\n========================================');
console.log('Running Smoke Test Against Local Pair (3100 & 5273)');
console.log('========================================\n');

let serverProcess = null;
let staticServer = null;

try {
  // 1. Start static server for deploy/web on 5273 using Express
  const deployWebDir = path.resolve(rootDir, 'deploy/web');
  if (!fs.existsSync(deployWebDir)) {
    throw new Error('deploy/web directory does not exist. Run build-web.js first.');
  }

  const webApp = express();

  // Cloudflare Pages header simulation
  webApp.use((req, res, next) => {
    if (req.path.startsWith('/media/')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (req.path === '/' || req.path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
    next();
  });

  webApp.use(express.static(deployWebDir));

  // SPA fallback
  webApp.use((req, res) => {
    res.sendFile(path.join(deployWebDir, 'index.html'));
  });

  staticServer = webApp.listen(5273);
  console.log('1. Static web server listening on http://localhost:5273 (serving deploy/web)');

  // 2. Start backend server on 3100
  console.log('2. Spawning backend server on port 3100...');
  serverProcess = spawn('node', ['src/index.js'], {
    cwd: path.resolve(rootDir, 'server'),
    env: {
      ...process.env,
      PORT: '3100',
      NODE_ENV: 'development',
      CORS_ORIGINS: 'http://localhost:5273,capacitor://localhost,http://localhost,https://localhost'
    },
    stdio: 'ignore',
    detached: true
  });
  serverProcess.unref();

  console.log(`   Backend server spawned with PID: ${serverProcess.pid}`);

  // 3. Poll http://localhost:3100/api/health
  console.log('3. Waiting for backend health check...');
  let apiReady = false;
  const start = Date.now();
  while (Date.now() - start < 30000) {
    try {
      const res = await fetch('http://localhost:3100/api/health');
      if (res.ok) {
        apiReady = true;
        break;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 400));
  }

  if (!apiReady) {
    throw new Error('Backend on port 3100 failed to respond within 30 seconds.');
  }
  console.log('   Backend is healthy!');

  // 4. Run tools/smoke-prod.js asynchronously so the event loop remains free for staticServer
  console.log('\n4. Executing tools/smoke-prod.js http://localhost:3100 http://localhost:5273...');
  await new Promise((resolve, reject) => {
    const smoke = spawn('node', ['tools/smoke-prod.js', 'http://localhost:3100', 'http://localhost:5273'], {
      cwd: rootDir,
      stdio: 'inherit'
    });
    smoke.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`smoke-prod.js exited with code ${code}`));
    });
  });

  console.log('\n[SUCCESS] Local pair smoke testing verified successfully!\n');
} catch (err) {
  console.error('\n[FAIL] Smoke pair testing failed:', err.message);
  process.exitCode = 1;
} finally {
  if (serverProcess && serverProcess.pid) {
    console.log(`Stopping backend server PID: ${serverProcess.pid}...`);
    try {
      process.kill(serverProcess.pid, 'SIGTERM');
    } catch {}
  }
  if (staticServer) {
    console.log('Closing static web server on 5273...');
    staticServer.close();
  }
  process.exit(process.exitCode || 0);
}
