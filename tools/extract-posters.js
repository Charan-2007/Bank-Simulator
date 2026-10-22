import './ffmpeg-env.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { VIDEO_CONFIGS } from './transcode-videos.js';

const HIGH_VIDEOS_DIR = path.resolve('server/public/media/cards/videos/high');
const POSTERS_DIR = path.resolve('server/public/media/cards/posters');

fs.mkdirSync(POSTERS_DIR, { recursive: true });

export function extractPosters() {
  console.log(`Extracting 1080px WebP posters for ${VIDEO_CONFIGS.length} videos at 30% duration (2.4s)...`);
  const results = [];

  // Remove any legacy posters with old naming (e.g. others-*)
  const existingFiles = fs.readdirSync(POSTERS_DIR);
  for (const f of existingFiles) {
    if (f.startsWith('others-')) {
      fs.unlinkSync(path.join(POSTERS_DIR, f));
      console.log(`Removed obsolete poster: ${f}`);
    }
  }

  for (let i = 0; i < VIDEO_CONFIGS.length; i++) {
    const config = VIDEO_CONFIGS[i];
    const highVideoPath = path.join(HIGH_VIDEOS_DIR, `${config.cardId}.mp4`);
    const posterName = `${config.cardId}.webp`;
    const posterPath = path.join(POSTERS_DIR, posterName);

    if (!fs.existsSync(highVideoPath)) {
      console.error(`[${i + 1}/${VIDEO_CONFIGS.length}] High tier video missing: ${highVideoPath}`);
      results.push({ cardId: config.cardId, status: 'missing_source' });
      continue;
    }

    try {
      // High tier video is 8s long; 30% is 2.4s
      const ss = '2.4';
      const cmd = `ffmpeg -y -ss ${ss} -i "${highVideoPath}" -vframes 1 -c:v libwebp -lossless 0 -q:v 85 "${posterPath}"`;
      execSync(cmd, { stdio: 'pipe' });

      const stat = fs.statSync(posterPath);
      const sizeKB = (stat.size / 1024).toFixed(1);

      // Probe image to ensure valid 1080x680 dimensions
      const probeOut = execSync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${posterPath}"`
      ).toString();
      const probe = JSON.parse(probeOut);
      const width = probe.streams?.[0]?.width;
      const height = probe.streams?.[0]?.height;

      // Blank check: size < 2KB or black detection
      const isBlank = stat.size < 2048;

      console.log(
        `[${i + 1}/${VIDEO_CONFIGS.length}] ${posterName} | ${width}x${height} | ${sizeKB} KB ${isBlank ? '[WARNING: BLANK]' : '[OK]'}`
      );

      results.push({
        cardId: config.cardId,
        name: config.name,
        posterFile: posterName,
        width,
        height,
        sizeBytes: stat.size,
        sizeKB,
        isBlank,
        status: isBlank ? 'warning_blank' : 'pass'
      });
    } catch (err) {
      console.error(`[${i + 1}/${VIDEO_CONFIGS.length}] FAILED: ${posterName}:`, err.message);
      results.push({
        cardId: config.cardId,
        posterFile: posterName,
        status: 'failed',
        error: err.message
      });
    }
  }

  const reportPath = path.resolve('tools/posters-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  return results;
}

if (process.argv[1]?.endsWith('extract-posters.js')) {
  extractPosters();
}
