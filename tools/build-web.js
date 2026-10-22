import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Hard timeout 120s
const hardTimeout = setTimeout(() => {
  console.error('Timed out after 120 seconds.');
  process.exit(1);
}, 120000);
hardTimeout.unref();

const apiUrl = process.argv[2];
const mediaUrl = process.argv[3] || '';

if (!apiUrl) {
  console.error('Usage: node tools/build-web.js <API_URL> [MEDIA_URL]');
  console.error('Example: node tools/build-web.js https://novabank-api.onrender.com');
  process.exit(1);
}

console.log(`\n========================================`);
console.log(`Building NovaBank Web for Cloudflare Pages`);
console.log(`API URL:   ${apiUrl}`);
console.log(`Media URL: ${mediaUrl ? mediaUrl : '(Same Origin /media/cards)'}`);
console.log(`========================================\n`);

const clientDir = path.resolve(rootDir, 'client');
const distDir = path.resolve(clientDir, 'dist');
const deployWebDir = path.resolve(rootDir, 'deploy/web');
const mediaSourceDir = path.resolve(rootDir, 'server/public/media/cards');

try {
  // 1. Build client with Vite
  console.log('1. Running Vite client build...');
  execSync('npm --prefix client run build', {
    cwd: rootDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_API_BASE_URL: apiUrl,
      VITE_MEDIA_BASE_URL: mediaUrl
    }
  });

  if (!fs.existsSync(distDir)) {
    throw new Error('client/dist directory was not created by Vite build.');
  }

  // 2. Prepare deploy/web directory
  console.log('\n2. Preparing deploy/web directory...');
  if (fs.existsSync(deployWebDir)) {
    fs.rmSync(deployWebDir, { recursive: true, force: true });
  }
  fs.mkdirSync(deployWebDir, { recursive: true });

  // 3. Copy client/dist into deploy/web
  console.log('3. Copying web application bundle to deploy/web...');
  fs.cpSync(distDir, deployWebDir, { recursive: true });

  // 4. Copy server/public/media/cards into deploy/web/media/cards
  const deployCardsDir = path.resolve(deployWebDir, 'media/cards');
  if (fs.existsSync(mediaSourceDir)) {
    console.log('4. Copying card media (videos, posters, images) to deploy/web/media/cards...');
    fs.mkdirSync(deployCardsDir, { recursive: true });
    fs.cpSync(mediaSourceDir, deployCardsDir, { recursive: true });
  } else {
    console.warn('Warning: server/public/media/cards not found; skipping media bundle copy.');
  }

  // 5. Create Cloudflare Pages _headers file
  console.log('5. Creating Cloudflare Pages _headers configuration...');
  const headersContent = [
    '/media/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/index.html',
    '  Cache-Control: no-cache',
    '/*'
  ].join('\n') + '\n';
  fs.writeFileSync(path.resolve(deployWebDir, '_headers'), headersContent, 'utf-8');

  // 6. Create Cloudflare Pages _redirects SPA fallback
  console.log('6. Creating Cloudflare Pages _redirects SPA fallback...');
  const redirectsContent = '/*    /index.html   200\n';
  fs.writeFileSync(path.resolve(deployWebDir, '_redirects'), redirectsContent, 'utf-8');

  // 7. Verify Cloudflare Pages limits
  console.log('7. Verifying Cloudflare Pages limits (<= 25 MiB per file, < 20,000 files)...');
  let fileCount = 0;
  let totalBytes = 0;
  const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MiB
  const MAX_FILE_COUNT = 20000;
  const oversizedFiles = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.resolve(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        fileCount++;
        const stat = fs.statSync(fullPath);
        totalBytes += stat.size;
        if (stat.size > MAX_FILE_SIZE) {
          oversizedFiles.push({
            file: path.relative(deployWebDir, fullPath),
            sizeMB: (stat.size / (1024 * 1024)).toFixed(2)
          });
        }
      }
    }
  }

  scanDir(deployWebDir);

  const totalSizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
  console.log(`\nBuild Verification Results:`);
  console.log(`- Total Files:  ${fileCount.toLocaleString()} / 20,000 max`);
  console.log(`- Total Size:   ${totalSizeMB} MB`);

  if (fileCount >= MAX_FILE_COUNT) {
    throw new Error(`Cloudflare Pages file count limit exceeded: ${fileCount} >= ${MAX_FILE_COUNT}`);
  }

  if (oversizedFiles.length > 0) {
    console.error('ERROR: Files exceeding Cloudflare Pages 25 MiB limit:');
    for (const f of oversizedFiles) {
      console.error(`  - ${f.file} (${f.sizeMB} MB)`);
    }
    throw new Error('Oversized files detected.');
  }

  console.log('\n[SUCCESS] deploy/web is ready for Cloudflare Pages deployment.\n');
  process.exit(0);
} catch (err) {
  console.error('\n[ERROR] build-web failed:', err.message);
  process.exit(1);
}
