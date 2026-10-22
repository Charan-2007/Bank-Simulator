import './ffmpeg-env.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const GOATS_DIR = path.resolve("Cards/GOAT's");
const OUTPUT_DIR = path.resolve('server/public/media/cards/images');

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

export const IMAGE_CONFIGS = [
  {
    sourceFile: 'cristiano-ronaldo-5120x2880-14055.png',
    outputFile: 'sports-cristiano-ronaldo.webp',
    cardId: 'sports-cristiano-ronaldo',
    name: 'Cristiano Ronaldo',
    category: 'sports-legends',
    cropOffset: null
  },
  {
    sourceFile: 'max-verstappen-3840x2160-23591.jpg',
    outputFile: 'sports-max-verstappen.webp',
    cardId: 'sports-max-verstappen',
    name: 'Max Verstappen',
    category: 'sports-legends',
    cropOffset: null
  },
  {
    sourceFile: 'prabhas.jpg',
    outputFile: 'sports-prabhas.webp',
    cardId: 'sports-prabhas',
    name: 'Prabhas',
    category: 'sports-legends',
    cropOffset: null
  },
  {
    sourceFile: 'rdj.jpg',
    outputFile: 'sports-rdj.webp',
    cardId: 'sports-rdj',
    name: 'Robert Downey Jr.',
    category: 'sports-legends',
    cropOffset: null
  },
  {
    sourceFile: 'vk.jpg',
    outputFile: 'sports-virat-kohli.webp',
    cardId: 'sports-virat-kohli',
    name: 'Virat Kohli',
    category: 'sports-legends',
    cropOffset: null
  }
];

export function processImages() {
  console.log(`Processing ${IMAGE_CONFIGS.length} GOAT's images to 1080px wide WebP (1080x680, 1.586:1 ratio, quality 85)...`);
  const results = [];

  for (let i = 0; i < IMAGE_CONFIGS.length; i++) {
    const config = IMAGE_CONFIGS[i];
    const srcPath = path.join(GOATS_DIR, config.sourceFile);
    const destPath = path.join(OUTPUT_DIR, config.outputFile);

    if (!fs.existsSync(srcPath)) {
      console.error(`[${i + 1}/${IMAGE_CONFIGS.length}] MISSING SOURCE: ${srcPath}`);
      results.push({ ...config, status: 'failed', error: 'Missing source file' });
      continue;
    }

    const srcStat = fs.statSync(srcPath);
    const srcSizeKB = (srcStat.size / 1024).toFixed(1);

    // 1080x680 maintains card ratio ~1.586:1
    let cropFilter = 'crop=1080:680';
    if (config.cropOffset) {
      const x = config.cropOffset.x ?? '(in_w-out_w)/2';
      const y = config.cropOffset.y ?? '(in_h-out_h)/2';
      cropFilter = `crop=1080:680:${x}:${y}`;
    }

    const vf = `scale=w=1080:h=680:force_original_aspect_ratio=increase,${cropFilter}`;
    const cmd = `ffmpeg -y -i "${srcPath}" -vf "${vf}" -c:v libwebp -lossless 0 -q:v 85 "${destPath}"`;

    try {
      execSync(cmd, { stdio: 'pipe' });
      const destStat = fs.statSync(destPath);
      const destSizeKB = (destStat.size / 1024).toFixed(1);

      // Verify dimensions
      const probeOut = execSync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of json "${destPath}"`
      ).toString();
      const probe = JSON.parse(probeOut);
      const width = probe.streams?.[0]?.width;
      const height = probe.streams?.[0]?.height;

      console.log(
        `[${i + 1}/${IMAGE_CONFIGS.length}] ${config.outputFile} | ${width}x${height} | In: ${srcSizeKB} KB -> Out: ${destSizeKB} KB [OK]`
      );

      results.push({
        ...config,
        srcSizeKB,
        destSizeKB,
        destSizeBytes: destStat.size,
        width,
        height,
        status: 'pass'
      });
    } catch (err) {
      console.error(`[${i + 1}/${IMAGE_CONFIGS.length}] FAILED ${config.outputFile}:`, err.message);
      results.push({ ...config, status: 'failed', error: err.message });
    }
  }

  const reportPath = path.resolve('tools/images-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  return results;
}

if (process.argv[1]?.endsWith('process-images.js')) {
  processImages();
}
