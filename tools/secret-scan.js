import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const hardTimeout = setTimeout(() => {
  console.error('Scan timed out after 30 seconds.');
  process.exit(1);
}, 30000);
hardTimeout.unref();

// Read server/.env values safely in memory (NEVER PRINT VALUES)
const envPath = path.resolve(rootDir, 'server/.env');
const sensitiveSecrets = [];

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();

      // Only check real confidential secrets (URI, password, JWT secrets)
      if (['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'].includes(key) && val.length > 5) {
        sensitiveSecrets.push({ key, val });
        // Extract raw password if URI
        const passMatch = val.match(/mongodb\+srv:\/\/[^:]+:([^@]+)@/);
        if (passMatch && passMatch[1] && passMatch[1].length >= 4) {
          sensitiveSecrets.push({ key: 'MONGODB_PASSWORD', val: passMatch[1] });
        }
      }
    }
  }
}

// Ensure git index is updated
execSync('git add -A', { cwd: rootDir });
const output = execSync('git diff --cached --name-only', { cwd: rootDir, encoding: 'utf-8' });
const files = output.split('\n').map(s => s.trim()).filter(Boolean);

console.log(`\n========================================`);
console.log(`Scanning ${files.length} staged files for secrets and size...`);
console.log(`========================================\n`);

let violations = [];
let oversizedFiles = [];

for (const relPath of files) {
  // Never scan tools/secret-scan.js against itself
  if (relPath === 'tools/secret-scan.js' || relPath === 'tools/scan-audit.js') {
    continue;
  }

  const fullPath = path.resolve(rootDir, relPath);
  if (!fs.existsSync(fullPath)) continue;

  const stat = fs.statSync(fullPath);
  if (stat.size > 5 * 1024 * 1024) {
    oversizedFiles.push({
      file: relPath,
      sizeMB: (stat.size / (1024 * 1024)).toFixed(2)
    });
  }

  // Skip binary files
  if (/\.(png|jpg|jpeg|webp|ico|mp4|woff|woff2|ttf|eot)$/i.test(relPath)) {
    continue;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');

  // Check 1: mongodb+srv with real password (not placeholder)
  const uriMatches = content.match(/mongodb\+srv:\/\/[^\s"'`<>]+/g);
  if (uriMatches) {
    for (const match of uriMatches) {
      if (!match.includes('<password>') && !match.includes('<user>') && !match.includes('<username>')) {
        violations.push({ file: relPath, reason: 'Contains unredacted mongodb+srv:// connection string with password' });
        break;
      }
    }
  }

  // Check 2: Sensitive values from server/.env
  for (const { key, val } of sensitiveSecrets) {
    if (content.includes(val)) {
      violations.push({ file: relPath, reason: `Contains secret value matching server/.env (${key})` });
      break;
    }
  }
}

console.log('Secret Scan Results:');
if (violations.length === 0) {
  console.log('  [PASS] Clean: Zero unredacted mongodb+srv:// passwords or server/.env secrets found in tracked files.');
} else {
  console.error(`  [FAIL] Secrets found in ${violations.length} files:`);
  for (const v of violations) {
    console.error(`    - ${v.file}: ${v.reason}`);
  }
}

console.log('\nTracked Files Over 5 MB:');
if (oversizedFiles.length === 0) {
  console.log('  [PASS] Zero tracked files exceed 5 MB.');
} else {
  console.log(`  Found ${oversizedFiles.length} files over 5 MB:`);
  for (const f of oversizedFiles) {
    console.log(`    - ${f.file} (${f.sizeMB} MB)`);
  }
}

if (violations.length > 0) {
  console.error('\nScan failed with violations.\n');
  process.exit(1);
}

console.log('\n[PASS] Repository is clean and ready to commit.\n');
process.exit(0);
