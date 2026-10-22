import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORT = 4599;

const hardTimeout = setTimeout(() => {
  console.error('Contact sheet generation timed out after 45s.');
  process.exit(1);
}, 45000);
hardTimeout.unref();

const manifestPath = path.join(ROOT_DIR, 'server/data/cards.manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

// Build HTML page
function buildHtml() {
  const fontCss = `
    @import "/node_modules/@fontsource/dm-sans/400.css";
    @import "/node_modules/@fontsource/dm-sans/700.css";
    @import "/node_modules/@fontsource/orbitron/400.css";
    @import "/node_modules/@fontsource/orbitron/700.css";
    @import "/node_modules/@fontsource/anton/400.css";
    @import "/node_modules/@fontsource/press-start-2p/400.css";
    @import "/node_modules/@fontsource/bangers/400.css";
    @import "/node_modules/@fontsource/cinzel/400.css";
    @import "/node_modules/@fontsource/cinzel/700.css";
    @import "/node_modules/@fontsource/bebas-neue/400.css";

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #0b0f19;
      color: #f8fafc;
      font-family: 'DM Sans', sans-serif;
      padding: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .header {
      width: 358px;
      margin-bottom: 24px;
      text-align: center;
    }
    .header h1 { font-size: 20px; font-weight: 700; color: #38bdf8; margin-bottom: 6px; }
    .header p { font-size: 12px; color: #94a3b8; line-height: 1.4; }
    
    .card-entry {
      width: 358px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 16px;
      padding: 12px;
      margin-bottom: 24px;
    }
    .card-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      font-size: 11px;
    }
    .card-title { font-weight: 700; color: #f1f5f9; }
    .card-category {
      background: rgba(56, 189, 248, 0.15);
      color: #38bdf8;
      padding: 2px 8px;
      border-radius: 9999px;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 9px;
    }
    .card-font-info {
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 10px;
      line-height: 1.3;
    }
    .badge-override {
      background: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
      padding: 1px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    .card-preview-box {
      margin-bottom: 12px;
    }
    .card-preview-label {
      font-size: 10px;
      color: #94a3b8;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .card-face {
      position: relative;
      width: 100%;
      aspect-ratio: 1.586 / 1;
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid rgba(255,255,255,0.2);
      background: #111;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .card-bg {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      object-fit: cover;
    }
    .card-content {
      position: relative;
      z-index: 10;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 14px;
    }
    .card-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .bank-name {
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.06em;
    }
    .badge-virtual {
      font-size: 9px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      opacity: 0.8;
    }
    .card-bottom {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .card-number {
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.15em;
      font-weight: 600;
      font-size: 12.5px;
    }
    .card-label-name {
      font-size: 10px;
      opacity: 0.9;
      font-weight: 500;
      max-width: 110px;
      text-align: right;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  `;

  const cardsHtml = manifest.cards.map((card, idx) => {
    const isOverride = !!card.numberFont;
    const activeNumberFont = card.numberFont || card.fontFamily;
    const posterUrl = card.poster || card.image;
    const maskedNum = '9000 •••• •••• 9012';
    const revealedNum = '9000 1234 5678 9012';

    return `
      <div class="card-entry" id="card-${card.id}">
        <div class="card-meta">
          <span class="card-title">#${idx + 1} ${card.name}</span>
          <span class="card-category">${card.category}</span>
        </div>
        <div class="card-font-info">
          Theme font: <strong>${card.fontFamily}</strong><br>
          Number font: <strong>${activeNumberFont}</strong> 
          ${isOverride ? '<span class="badge-override">OVERRIDE (Legibility)</span>' : '<span style="color:#22c55e;">(Inherited)</span>'}
        </div>

        <!-- Masked View -->
        <div class="card-preview-box">
          <div class="card-preview-label">Masked:</div>
          <div class="card-face" style="font-family: ${card.fontFamily};">
            <img class="card-bg" src="${posterUrl}" style="object-position: ${card.objectPosition || 'center center'};" alt="" />
            <div class="card-content">
              <div class="card-top" style="color: ${card.textColor}; text-shadow: ${card.textShadow};">
                <span class="bank-name">NovaBank</span>
                <span class="badge-virtual">Virtual</span>
              </div>
              <div class="card-bottom" style="color: ${card.textColor}; text-shadow: ${card.textShadow};">
                <div class="card-number" style="font-family: ${activeNumberFont};">${maskedNum}</div>
                <div class="card-label-name">${card.name}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Revealed View -->
        <div class="card-preview-box">
          <div class="card-preview-label">Revealed:</div>
          <div class="card-face" style="font-family: ${card.fontFamily};">
            <img class="card-bg" src="${posterUrl}" style="object-position: ${card.objectPosition || 'center center'};" alt="" />
            <div class="card-content">
              <div class="card-top" style="color: ${card.textColor}; text-shadow: ${card.textShadow};">
                <span class="bank-name">NovaBank</span>
                <span class="badge-virtual">Virtual</span>
              </div>
              <div class="card-bottom" style="color: ${card.textColor}; text-shadow: ${card.textShadow};">
                <div class="card-number" style="font-family: ${activeNumberFont};">${revealedNum}</div>
                <div class="card-label-name">${card.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=390, initial-scale=1.0">
  <title>NovaBank 29-Card Contact Sheet (390px Viewport)</title>
  <style>${fontCss}</style>
</head>
<body>
  <div class="header">
    <h1>NovaBank Card Digits Audit</h1>
    <p>390px mobile viewport verification for all 29 cards.<br>Testing theme fonts vs masked & revealed digits.</p>
  </div>
  ${cardsHtml}
</body>
</html>`;
}

// Start local HTTP server to serve HTML, posters, and fonts
const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = '';

  if (url.pathname === '/' || url.pathname === '/contact-sheet.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(buildHtml());
    return;
  }

  if (url.pathname.startsWith('/media/')) {
    filePath = path.join(ROOT_DIR, 'server/public', url.pathname);
  } else if (url.pathname.startsWith('/node_modules/')) {
    filePath = path.join(ROOT_DIR, 'client', url.pathname);
  }

  if (filePath && fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.css': 'text/css',
      '.webp': 'image/webp',
      '.jpg': 'image/jpeg',
      '.png': 'image/png',
      '.woff2': 'font/woff2',
      '.woff': 'font/woff',
      '.ttf': 'font/ttf'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, async () => {
  console.log(`Contact sheet preview server listening on http://localhost:${PORT}`);

  const outputPath = path.join(ROOT_DIR, 'docs/screenshots/card-numbers-contact-sheet-390px.png');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  console.log('Taking 390px contact sheet screenshot with headless Edge...');
  const edgeArgs = [
    '--headless',
    '--disable-gpu',
    '--window-size=420,12000',
    `--screenshot=${outputPath}`,
    `http://localhost:${PORT}/contact-sheet.html`
  ];

  const edge = spawn(EDGE_PATH, edgeArgs);
  edge.on('close', (code) => {
    console.log(`Edge finished with code ${code}. Saved to ${outputPath}`);
    server.close(() => {
      process.exit(code === 0 ? 0 : 1);
    });
  });
  edge.on('error', (err) => {
    console.error('Failed to run Edge:', err);
    server.close(() => process.exit(1));
  });
});
