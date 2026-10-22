import './ffmpeg-env.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SCRATCH_DIR = path.resolve('tools/scratch');
const DOCS_DIR = path.resolve('docs');
const VIDEOS_DIR = path.resolve('server/public/media/cards/videos');
const CARDS_DIR = path.resolve('Cards');

fs.mkdirSync(SCRATCH_DIR, { recursive: true });
fs.mkdirSync(DOCS_DIR, { recursive: true });

// 1. Frame difference check for 4 videos at mid tier (1s, 4s, 7s)
export function checkFrameDifferences() {
  const targetVideos = [
    { cardId: 'cars-nsx-gtr-rain', name: 'Honda NSX rain' },
    { cardId: 'cars-lamborghini', name: 'Lamborghini Neon' },
    { cardId: 'abstract-golden-crown', name: 'Gothic Golden Crown' },
    { cardId: 'superheroes-miles-morales-purple-city', name: 'Miles Morales Neon City' }
  ];

  console.log('\n=== Checking Frame Differences for 4 Mid-Tier Videos (1s, 4s, 7s) ===\n');
  const results = [];

  for (const v of targetVideos) {
    const videoPath = path.join(VIDEOS_DIR, 'mid', `${v.cardId}.mp4`);
    const f1 = path.join(SCRATCH_DIR, `${v.cardId}_1s.png`);
    const f4 = path.join(SCRATCH_DIR, `${v.cardId}_4s.png`);
    const f7 = path.join(SCRATCH_DIR, `${v.cardId}_7s.png`);

    // Extract frames at 1s, 4s, 7s
    execSync(`ffmpeg -y -ss 1.0 -i "${videoPath}" -vframes 1 "${f1}"`, { stdio: 'pipe' });
    execSync(`ffmpeg -y -ss 4.0 -i "${videoPath}" -vframes 1 "${f4}"`, { stdio: 'pipe' });
    execSync(`ffmpeg -y -ss 7.0 -i "${videoPath}" -vframes 1 "${f7}"`, { stdio: 'pipe' });

    // Compare 1s vs 4s, and 4s vs 7s using ffmpeg psnr filter
    function comparePsnr(imgA, imgB) {
      try {
        const out = execSync(
          `ffmpeg -i "${imgA}" -i "${imgB}" -filter_complex "psnr" -f null - 2>&1`,
          { stdio: 'pipe' }
        ).toString();
        let avgPsnr = 'N/A';
        if (out.includes('average:')) {
          const parts = out.split('average:');
          avgPsnr = parts[1].trim().split(' ')[0];
        }
        return avgPsnr;
      } catch (err) {
        return 'err';
      }
    }

    const psnr1_4 = comparePsnr(f1, f4);
    const psnr4_7 = comparePsnr(f4, f7);

    // Also compute byte difference
    const b1 = fs.readFileSync(f1);
    const b4 = fs.readFileSync(f4);
    const b7 = fs.readFileSync(f7);
    const bytesDiff1_4 = !b1.equals(b4);
    const bytesDiff4_7 = !b4.equals(b7);

    const isDistinct = psnr1_4 !== 'inf' && psnr4_7 !== 'inf' && bytesDiff1_4 && bytesDiff4_7;

    console.log(
      `${v.name} (${v.cardId}):\n  1s vs 4s PSNR: ${psnr1_4} dB | 4s vs 7s PSNR: ${psnr4_7} dB | Distinct: ${isDistinct ? 'YES (Active Animation)' : 'FROZEN'}`
    );

    results.push({
      cardId: v.cardId,
      name: v.name,
      psnr1_4,
      psnr4_7,
      isDistinct
    });
  }

  const reportPath = path.resolve('tools/frame-diff-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  return results;
}

// 2. Build 3 comparison composites: Original vs Max vs Low
export function buildComposites() {
  console.log('\n=== Building 3 Comparison Composites (Original vs Max vs Low) ===\n');

  const targets = [
    {
      type: 'Ultrawide',
      cardId: 'superheroes-spider-verse',
      srcPath: path.join(CARDS_DIR, 'Spider Man/spiderman-into-the-spiderverse-moewalls-com.mp4'),
      outName: 'comparison-ultrawide.webp',
      title: 'Ultrawide: Spider-Man Into the Spider-Verse'
    },
    {
      type: '4K',
      cardId: 'anime-itachi-sharingan',
      srcPath: path.join(CARDS_DIR, 'Naruto/itachi-sharingan-red-moon.3840x2160.mp4'),
      outName: 'comparison-4k.webp',
      title: '4K Anime: Itachi Sharingan'
    },
    {
      type: 'Car',
      cardId: 'cars-dodge-challenger-black-panther',
      srcPath: path.join(CARDS_DIR, 'Cars/dodge-challenger-black-panther-moewalls-com.mp4'),
      outName: 'comparison-car.webp',
      title: 'Car: Dodge Challenger Black Panther'
    }
  ];

  const results = [];

  for (const t of targets) {
    const maxVideo = path.join(VIDEOS_DIR, 'max', `${t.cardId}.mp4`);
    const lowVideo = path.join(VIDEOS_DIR, 'low', `${t.cardId}.mp4`);
    const outPath = path.join(DOCS_DIR, t.outName);

    // Extract frames at 2.0s
    const fOrig = path.join(SCRATCH_DIR, `${t.cardId}_orig.png`);
    const fMax = path.join(SCRATCH_DIR, `${t.cardId}_max.png`);
    const fLow = path.join(SCRATCH_DIR, `${t.cardId}_low.png`);

    execSync(`ffmpeg -y -ss 2.0 -i "${t.srcPath}" -vframes 1 "${fOrig}"`, { stdio: 'pipe' });
    execSync(`ffmpeg -y -ss 2.0 -i "${maxVideo}" -vframes 1 "${fMax}"`, { stdio: 'pipe' });
    execSync(`ffmpeg -y -ss 2.0 -i "${lowVideo}" -vframes 1 "${fLow}"`, { stdio: 'pipe' });

    // Build vertical stacked composite scaled to width 960
    // Using Arial font file with properly escaped path for Windows ffmpeg
    const fontArg = "fontfile='C\\:/Windows/Fonts/arial.ttf'";
    const filter = `
      [0:v]scale=960:-2,drawtext=${fontArg}:text='ORIGINAL SOURCE (Uncropped)':fontcolor=white:fontsize=28:box=1:boxcolor=black@0.6:boxborderw=8:x=20:y=20[v0];
      [1:v]scale=960:605,drawtext=${fontArg}:text='MAX TIER (1440x908 CRF 19 @ 30fps)':fontcolor=white:fontsize=28:box=1:boxcolor=black@0.6:boxborderw=8:x=20:y=20[v1];
      [2:v]scale=960:605,drawtext=${fontArg}:text='LOW TIER (480x302 CRF 27 @ 24fps - Display Upscaled)':fontcolor=white:fontsize=28:box=1:boxcolor=black@0.6:boxborderw=8:x=20:y=20[v2];
      [v0][v1][v2]vstack=inputs=3[out]
    `.replace(/\s+/g, ' ').trim();

    const cmd = `ffmpeg -y -i "${fOrig}" -i "${fMax}" -i "${fLow}" -filter_complex "${filter}" -map "[out]" -c:v libwebp -lossless 0 -q:v 85 "${outPath}"`;
    execSync(cmd, { stdio: 'pipe' });

    const stat = fs.statSync(outPath);
    console.log(`Generated composite: ${t.outName} (${(stat.size / 1024).toFixed(1)} KB)`);
    results.push({ ...t, outPath, sizeKB: (stat.size / 1024).toFixed(1) });
  }

  return results;
}

if (process.argv[1]?.endsWith('verify-frames.js')) {
  checkFrameDifferences();
  buildComposites();
}
