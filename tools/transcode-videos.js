import './ffmpeg-env.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const CARDS_DIR = path.resolve('Cards');
const VIDEOS_DIR = path.resolve('server/public/media/cards/videos');
const CROP_FOCUS_FILE = path.resolve('tools/crop-focus.json');
const REPORT_FILE = path.resolve('tools/transcode-report.json');

export const TIERS = {
  low: {
    name: 'low',
    width: 480,
    height: 302,
    fps: 24,
    initialCrf: 27,
    preset: 'slow',
    maxSizeBytes: Math.floor(1.5 * 1024 * 1024),
    extraArgs: ''
  },
  mid: {
    name: 'mid',
    width: 720,
    height: 454,
    fps: 30,
    initialCrf: 23,
    preset: 'slow',
    maxSizeBytes: Math.floor(4 * 1024 * 1024),
    extraArgs: ''
  },
  high: {
    name: 'high',
    width: 1080,
    height: 680,
    fps: 30,
    initialCrf: 21,
    preset: 'medium',
    maxSizeBytes: Math.floor(8 * 1024 * 1024),
    extraArgs: ''
  },
  max: {
    name: 'max',
    width: 1440,
    height: 908,
    fps: 30,
    initialCrf: 19,
    preset: 'medium',
    maxSizeBytes: Math.floor(14 * 1024 * 1024),
    extraArgs: '-maxrate 12M -bufsize 24M'
  }
};

export const VIDEO_CONFIGS = [
  // Abstract (5)
  {
    folder: 'Abstract',
    sourceFile: 'black-hole-monochrome-moewalls-com.mp4',
    cardId: 'abstract-black-hole',
    name: 'Black Hole Monochrome',
    category: 'abstract'
  },
  {
    folder: 'Abstract',
    sourceFile: 'gothic-golden-crown-king-moewalls-com.mp4',
    cardId: 'abstract-golden-crown',
    name: 'Gothic Golden Crown',
    category: 'abstract'
  },
  {
    folder: 'Abstract',
    sourceFile: 'silent-blade-samurai-monochrome-moewalls-com.mp4',
    cardId: 'abstract-silent-blade-samurai',
    name: 'Silent Blade Samurai',
    category: 'abstract'
  },
  {
    folder: 'Abstract',
    sourceFile: 'snake-skeleton-chains-moewalls-com.mp4',
    cardId: 'abstract-snake-skeleton',
    name: 'Snake Skeleton & Chains',
    category: 'abstract'
  },
  {
    folder: 'Abstract',
    sourceFile: 'spider-man-symbiote-moewalls-com.mp4',
    cardId: 'abstract-spiderman-symbiote',
    name: 'Symbiote Monochrome',
    category: 'abstract'
  },

  // Cars (6)
  {
    folder: 'Cars',
    sourceFile: 'dodge-challenger-black-panther-moewalls-com.mp4',
    cardId: 'cars-dodge-challenger-black-panther',
    name: 'Dodge Challenger Black Panther',
    category: 'cars'
  },
  {
    folder: 'Cars',
    sourceFile: 'dodge-challenger-shadow-runner-moewalls-com.mp4',
    cardId: 'cars-dodge-challenger-shadow-runner',
    name: 'Dodge Challenger Shadow Runner',
    category: 'cars'
  },
  {
    folder: 'Cars',
    sourceFile: 'ford-mustang-gt-gta-5-moewalls-com.mp4',
    cardId: 'cars-ford-mustang-gt',
    name: 'Ford Mustang GT',
    category: 'cars'
  },
  {
    folder: 'Cars',
    sourceFile: 'honda-nsx-x-nissan-gt-r-r34-in-the-rain-moewalls-com.mp4',
    cardId: 'cars-nsx-gtr-rain',
    name: 'Honda NSX & Nissan GT-R',
    category: 'cars'
  },
  {
    folder: 'Cars',
    sourceFile: 'lamborghini-moewalls-com.mp4',
    cardId: 'cars-lamborghini',
    name: 'Lamborghini Neon',
    category: 'cars'
  },
  {
    folder: 'Cars',
    sourceFile: 'mclaren-765lt-spider-blossom-street-moewalls-com.mp4',
    cardId: 'cars-mclaren-765lt-spider',
    name: 'McLaren 765LT Spider',
    category: 'cars'
  },

  // Gaming (3)
  {
    folder: 'Game',
    sourceFile: 'cherry-blossom-haven-minecraft-moewalls-com.mp4',
    cardId: 'gaming-minecraft-cherry-blossom',
    name: 'Minecraft Cherry Blossom',
    category: 'gaming'
  },
  {
    folder: 'Game',
    sourceFile: 'grand-theft-auto-vi-gta-6-moewalls-com.mp4',
    cardId: 'gaming-gta-6',
    name: 'GTA VI Vice City',
    category: 'gaming'
  },
  {
    folder: 'Game',
    sourceFile: 'train-forest-minecraft-moewalls-com.mp4',
    cardId: 'gaming-minecraft-train-forest',
    name: 'Minecraft Forest Train',
    category: 'gaming'
  },

  // Anime (5: 4 Naruto + Frieren)
  {
    folder: 'Naruto',
    sourceFile: 'itachi-sharingan-red-moon.3840x2160.mp4',
    cardId: 'anime-itachi-sharingan',
    name: 'Itachi Sharingan',
    category: 'anime'
  },
  {
    folder: 'Naruto',
    sourceFile: 'itachi-shillouette-in-front-of-the-red-moon.3840x2160.mp4',
    cardId: 'anime-itachi-silhouette',
    name: 'Itachi Red Moon Silhouette',
    category: 'anime'
  },
  {
    folder: 'Naruto',
    sourceFile: 'naruto-and-sasuke.3840x2160.mp4',
    cardId: 'anime-naruto-sasuke',
    name: 'Naruto & Sasuke Final Valley',
    category: 'anime'
  },
  {
    folder: 'Naruto',
    sourceFile: 'obito-uchiha-broken-mask.1920x1080.mp4',
    cardId: 'anime-obito-broken-mask',
    name: 'Obito Broken Mask',
    category: 'anime'
  },
  {
    folder: 'Others',
    sourceFile: 'frieren-eyes-beyond-journeys-end-moewalls-com.mp4',
    cardId: 'anime-frieren-eyes',
    name: 'Frieren Beyond Journey',
    category: 'anime'
  },

  // Superheroes (5: The Batman + 4 Spider Man)
  {
    folder: 'Others',
    sourceFile: 'the-batman-monochrome-moewalls-com.mp4',
    cardId: 'superheroes-the-batman',
    name: 'The Batman Monochrome',
    category: 'superheroes'
  },
  {
    folder: 'Spider Man',
    sourceFile: 'dark-spiderman-neon-moewalls-com.mp4',
    cardId: 'superheroes-dark-spiderman-neon',
    name: 'Dark Spider-Man Neon',
    category: 'superheroes'
  },
  {
    folder: 'Spider Man',
    sourceFile: 'miles-morales-falling-purple-sky-spiderman-across-the-spider-verse-moewalls-com.mp4',
    cardId: 'superheroes-miles-morales-falling',
    name: 'Miles Morales Skyfall',
    category: 'superheroes'
  },
  {
    folder: 'Spider Man',
    sourceFile: 'miles-morales-neon-purple-city-spider-man-into-the-spider-verse-moewalls-com.mp4',
    cardId: 'superheroes-miles-morales-purple-city',
    name: 'Miles Morales Neon City',
    category: 'superheroes'
  },
  {
    folder: 'Spider Man',
    sourceFile: 'spiderman-into-the-spiderverse-moewalls-com.mp4',
    cardId: 'superheroes-spider-verse',
    name: 'Spider-Verse Leap',
    category: 'superheroes'
  }
];

export function probeVideo(filePath) {
  try {
    const out = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration,bit_rate -show_entries format=duration,size,bit_rate -of json "${filePath}"`
    ).toString();
    const data = JSON.parse(out);
    const stream = data.streams?.[0] || {};
    const format = data.format || {};

    let fps = 0;
    if (stream.r_frame_rate) {
      const [num, den] = stream.r_frame_rate.split('/').map(Number);
      fps = den ? Math.round(num / den) : 0;
    }

    const duration = parseFloat(stream.duration || format.duration || 0);
    const sizeBytes = parseInt(format.size || fs.statSync(filePath).size, 10);
    const bitRate = parseInt(stream.bit_rate || format.bit_rate || 0, 10);

    return {
      valid: !!(stream.width && stream.height && duration > 0),
      width: stream.width,
      height: stream.height,
      fps,
      duration: duration.toFixed(2),
      sizeBytes,
      sizeMB: (sizeBytes / (1024 * 1024)).toFixed(2),
      bitRateKbps: Math.round(bitRate / 1000)
    };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

export function transcodeAll() {
  console.log(`Starting 4-tier transcoding for ${VIDEO_CONFIGS.length} videos (96 files total)...`);
  
  // Ensure directories exist
  for (const tierKey of Object.keys(TIERS)) {
    fs.mkdirSync(path.join(VIDEOS_DIR, tierKey), { recursive: true });
  }

  // Load crop focus map
  let cropFocusMap = {};
  if (fs.existsSync(CROP_FOCUS_FILE)) {
    cropFocusMap = JSON.parse(fs.readFileSync(CROP_FOCUS_FILE, 'utf-8'));
  }

  const tierKeys = ['low', 'mid', 'high', 'max'];
  const allResults = [];
  let totalProcessed = 0;
  const totalToProcess = VIDEO_CONFIGS.length * tierKeys.length;

  for (const config of VIDEO_CONFIGS) {
    const srcPath = path.join(CARDS_DIR, config.folder, config.sourceFile);
    if (!fs.existsSync(srcPath)) {
      console.error(`SOURCE MISSING: ${srcPath}`);
      continue;
    }

    const fx = cropFocusMap[config.cardId] ?? 0.5;

    for (const tierKey of tierKeys) {
      totalProcessed++;
      const tier = TIERS[tierKey];
      const destDir = path.join(VIDEOS_DIR, tierKey);
      const destPath = path.join(destDir, `${config.cardId}.mp4`);

      // Check if file already exists and passes probe check
      if (fs.existsSync(destPath)) {
        const probe = probeVideo(destPath);
        if (
          probe.valid &&
          probe.width === tier.width &&
          probe.height === tier.height &&
          probe.sizeBytes <= tier.maxSizeBytes
        ) {
          console.log(`[${totalProcessed}/${totalToProcess}] SKIP [${tierKey}] ${config.cardId}: Already valid (${probe.sizeMB} MB, ${probe.width}x${probe.height})`);
          allResults.push({
            cardId: config.cardId,
            name: config.name,
            tier: tierKey,
            filePath: destPath,
            width: probe.width,
            height: probe.height,
            fps: probe.fps,
            duration: probe.duration,
            sizeBytes: probe.sizeBytes,
            sizeMB: probe.sizeMB,
            bitRateKbps: probe.bitRateKbps,
            crf: tier.initialCrf,
            crfBumped: false,
            status: 'pass'
          });
          continue;
        }
      }

      // Encode with iterative CRF bump if needed
      let crf = tier.initialCrf;
      let pass = false;
      let attempts = 0;
      let lastProbe = null;

      while (!pass && attempts < 8) {
        attempts++;
        const vf = `scale=${tier.width}:${tier.height}:force_original_aspect_ratio=increase,crop=${tier.width}:${tier.height}:(iw-${tier.width})*${fx}:(ih-${tier.height})*0.5,fps=${tier.fps}`;
        const extra = tier.extraArgs ? `${tier.extraArgs} ` : '';
        const cmd = `ffmpeg -y -t 8 -i "${srcPath}" -an -vf "${vf}" -c:v libx264 -profile:v high -pix_fmt yuv420p -crf ${crf} -preset ${tier.preset} ${extra}-movflags +faststart "${destPath}"`;

        const t0 = Date.now();
        try {
          execSync(cmd, { stdio: 'pipe' });
          const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
          lastProbe = probeVideo(destPath);

          if (!lastProbe.valid) {
            throw new Error('Output video failed validation probe');
          }

          if (lastProbe.sizeBytes <= tier.maxSizeBytes) {
            pass = true;
            const bumped = crf !== tier.initialCrf;
            console.log(
              `[${totalProcessed}/${totalToProcess}] OK [${tierKey}] ${config.cardId} | ${tier.width}x${tier.height} @ ${tier.fps}fps | CRF ${crf}${bumped ? ' (BUMPED)' : ''} | ${lastProbe.sizeMB} MB / ${(tier.maxSizeBytes / 1024 / 1024).toFixed(1)} MB | ${elapsed}s`
            );
            allResults.push({
              cardId: config.cardId,
              name: config.name,
              tier: tierKey,
              filePath: destPath,
              width: lastProbe.width,
              height: lastProbe.height,
              fps: lastProbe.fps,
              duration: lastProbe.duration,
              sizeBytes: lastProbe.sizeBytes,
              sizeMB: lastProbe.sizeMB,
              bitRateKbps: lastProbe.bitRateKbps,
              crf,
              crfBumped: bumped,
              status: 'pass'
            });
          } else {
            console.warn(
              `[${totalProcessed}/${totalToProcess}] OVERSIZE [${tierKey}] ${config.cardId}: ${lastProbe.sizeMB} MB > ${(tier.maxSizeBytes / 1024 / 1024).toFixed(1)} MB with CRF ${crf}. Bumping CRF by 2...`
            );
            crf += 2;
          }
        } catch (err) {
          console.error(`[${totalProcessed}/${totalToProcess}] ERROR [${tierKey}] ${config.cardId}:`, err.message);
          allResults.push({
            cardId: config.cardId,
            name: config.name,
            tier: tierKey,
            status: 'failed',
            error: err.message
          });
          break;
        }
      }
    }
  }

  fs.writeFileSync(REPORT_FILE, JSON.stringify(allResults, null, 2));
  console.log(`\nTranscoding complete. Report saved to ${REPORT_FILE}`);
  return allResults;
}

if (process.argv[1]?.endsWith('transcode-videos.js')) {
  transcodeAll();
}
