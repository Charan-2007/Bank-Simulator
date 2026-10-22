import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const hardTimeout = setTimeout(() => {
  console.error('Smoke test timed out after 30 seconds.');
  process.exit(1);
}, 30000);
hardTimeout.unref();

const apiUrl = process.argv[2]?.replace(/\/+$/, '');
const webUrl = process.argv[3]?.replace(/\/+$/, '');

if (!apiUrl || !webUrl) {
  console.error('Usage: node tools/smoke-prod.js <API_URL> <WEB_URL>');
  console.error('Example: node tools/smoke-prod.js http://localhost:3100 http://localhost:5273');
  process.exit(1);
}

console.log('\n========================================');
console.log('NovaBank Production Smoke Test Suite');
console.log(`Target API: ${apiUrl}`);
console.log(`Target Web: ${webUrl}`);
console.log('========================================\n');

async function runSmokeTests() {
  let passed = 0;
  let total = 0;

  async function check(name, fn) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}: ${err.message}`);
      throw err;
    }
  }

  // 1. Check /api/health
  await check('1. GET /api/health returns status ok', async () => {
    const res = await fetch(`${apiUrl}/api/health`);
    if (!res.ok) throw new Error(`Health check returned status ${res.status}`);
    const body = await res.json();
    if (body.status !== 'ok') throw new Error(`Expected status: 'ok', got: ${JSON.stringify(body.status)}`);
  });

  // 2. Check /api/cards returns exactly 29 cards
  let samplePoster = '/media/cards/posters/abstract-black-hole.webp';
  let sampleVideo = '/media/cards/videos/mid/abstract-black-hole.mp4';

  await check('2. GET /api/cards returns exactly 29 cards in manifest', async () => {
    const res = await fetch(`${apiUrl}/api/cards`);
    if (!res.ok) throw new Error(`Cards manifest returned status ${res.status}`);
    const body = await res.json();
    if (!body.cards || !Array.isArray(body.cards)) throw new Error('cards array missing in manifest');
    if (body.cards.length !== 29) throw new Error(`Expected 29 cards, got ${body.cards.length}`);

    const firstCard = body.cards[0];
    if (firstCard.poster) samplePoster = firstCard.poster;
    if (firstCard.videos?.mid) sampleVideo = firstCard.videos.mid;
  });

  // 3. CORS Preflight allowed from web origin
  await check(`3. CORS preflight allowed from web origin (${webUrl})`, async () => {
    const res = await fetch(`${apiUrl}/api/cards`, {
      method: 'OPTIONS',
      headers: {
        'Origin': webUrl,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin !== webUrl && allowOrigin !== '*') {
      throw new Error(`Expected Access-Control-Allow-Origin: ${webUrl}, got: ${allowOrigin}`);
    }
  });

  // 4. CORS Preflight blocked from unauthorized origin
  await check('4. CORS preflight rejected/blocked from unauthorized origin', async () => {
    const unauthorizedOrigin = 'https://unauthorized-malicious-domain.com';
    const res = await fetch(`${apiUrl}/api/cards`, {
      method: 'OPTIONS',
      headers: {
        'Origin': unauthorizedOrigin,
        'Access-Control-Request-Method': 'GET'
      }
    });
    const allowOrigin = res.headers.get('access-control-allow-origin');
    if (allowOrigin === unauthorizedOrigin) {
      throw new Error(`Security breach: unauthorized origin was permitted in Access-Control-Allow-Origin`);
    }
  });

  // 5. Poster still image from web URL
  await check(`5. Web URL serves poster still image (${samplePoster})`, async () => {
    const posterUrl = `${webUrl}${samplePoster.startsWith('/') ? samplePoster : `/${samplePoster}`}`;
    const res = await fetch(posterUrl);
    if (!res.ok) throw new Error(`Poster request failed with status ${res.status} from ${posterUrl}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('image/')) {
      throw new Error(`Expected image content-type, got: ${contentType}`);
    }
    const cacheControl = res.headers.get('cache-control') || '';
    if (!cacheControl.includes('max-age')) {
      console.warn(`    (Notice: Cache-Control header was '${cacheControl}')`);
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) throw new Error('Poster response body was empty');
  });

  // 6. Mid-tier video from web URL
  await check(`6. Web URL serves mid-tier video (${sampleVideo})`, async () => {
    const videoUrl = `${webUrl}${sampleVideo.startsWith('/') ? sampleVideo : `/${sampleVideo}`}`;
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error(`Video request failed with status ${res.status} from ${videoUrl}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('video/mp4') && !contentType.includes('video/')) {
      throw new Error(`Expected video content-type, got: ${contentType}`);
    }
    const cacheControl = res.headers.get('cache-control') || '';
    if (!cacheControl.includes('max-age')) {
      console.warn(`    (Notice: Cache-Control header was '${cacheControl}')`);
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0) throw new Error('Video response body was empty');
  });

  console.log(`\n========================================`);
  console.log(`Smoke Tests Complete: ${passed} / ${total} passed`);
  console.log(`========================================\n`);
  process.exit(0);
}

runSmokeTests().catch(err => {
  console.error('\nSmoke test suite failed:', err.message);
  process.exit(1);
});
