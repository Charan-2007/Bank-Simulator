import './ffmpeg-env.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { VIDEO_CONFIGS } from './transcode-videos.js';

const IMAGES_DIR = path.resolve('server/public/media/cards/images');
const POSTERS_DIR = path.resolve('server/public/media/cards/posters');
const DOCS_DIR = path.resolve('docs');

fs.mkdirSync(DOCS_DIR, { recursive: true });

export function generateContactSheets() {
  // 1. Generate 5-card image contact sheet (horizontal stack of all 5 images at 320x201)
  const imageFiles = [
    'sports-cristiano-ronaldo.webp',
    'sports-max-verstappen.webp',
    'sports-prabhas.webp',
    'sports-rdj.webp',
    'sports-virat-kohli.webp'
  ];

  const imgInputs = imageFiles.map(f => `-i "${path.join(IMAGES_DIR, f)}"`).join(' ');
  const scaleFilters = imageFiles.map((_, i) => `[${i}:v]scale=320:201[v${i}]`).join(';');
  const stackInputs = imageFiles.map((_, i) => `[v${i}]`).join('');
  const imgCmd = `ffmpeg -y ${imgInputs} -filter_complex "${scaleFilters};${stackInputs}hstack=inputs=${imageFiles.length}" "${path.join(DOCS_DIR, 'images-contact-sheet.webp')}"`;

  console.log('Generating images contact sheet...');
  execSync(imgCmd, { stdio: 'inherit' });

  // 2. Generate 24-video poster contact sheet (4 rows of 6 posters at 320x201)
  // Ensure we use the exact order of the 24 video configs
  const posterFiles = VIDEO_CONFIGS.map(c => `${c.cardId}.webp`);
  const posterInputs = posterFiles.map(f => `-i "${path.join(POSTERS_DIR, f)}"`).join(' ');
  const pScaleFilters = posterFiles.map((_, i) => `[${i}:v]scale=320:201[p${i}]`).join(';');

  // 4 rows of 6
  const row0 = '[p0][p1][p2][p3][p4][p5]hstack=inputs=6[r0]';
  const row1 = '[p6][p7][p8][p9][p10][p11]hstack=inputs=6[r1]';
  const row2 = '[p12][p13][p14][p15][p16][p17]hstack=inputs=6[r2]';
  const row3 = '[p18][p19][p20][p21][p22][p23]hstack=inputs=6[r3]';
  const vstack = '[r0][r1][r2][r3]vstack=inputs=4';

  const posterCmd = `ffmpeg -y ${posterInputs} -filter_complex "${pScaleFilters};${row0};${row1};${row2};${row3};${vstack}" "${path.join(DOCS_DIR, 'posters-contact-sheet.webp')}"`;

  console.log('Generating 24 posters contact sheet (1920x804)...');
  execSync(posterCmd, { stdio: 'inherit' });

  console.log('Contact sheets generated successfully.');
}

if (process.argv[1]?.endsWith('generate-contact-sheet.js')) {
  generateContactSheets();
}
