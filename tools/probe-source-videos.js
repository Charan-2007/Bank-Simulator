import './ffmpeg-env.js';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const cardsDir = path.resolve('Cards');
const folders = ['Abstract', 'Cars', 'Game', 'Naruto', 'Others', 'Spider Man'];

const results = [];

for (const folder of folders) {
  const dir = path.join(cardsDir, folder);
  if (!fs.existsSync(dir)) continue;
  const files = fs.readdirSync(dir).filter(f => f.toLowerCase().endsWith('.mp4'));

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const probeOut = execSync(
        `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,duration,r_frame_rate -show_entries format=duration,size -of json "${filePath}"`
      ).toString();
      const data = JSON.parse(probeOut);
      const stream = data.streams?.[0] || {};
      const format = data.format || {};
      const duration = parseFloat(stream.duration || format.duration || '0');
      const sizeBytes = parseInt(format.size || '0', 10);
      const sizeMB = (sizeBytes / (1024 * 1024)).toFixed(2);

      results.push({
        folder,
        file,
        width: stream.width,
        height: stream.height,
        duration: duration.toFixed(2),
        sizeBytes,
        sizeMB,
        fps: stream.r_frame_rate
      });
    } catch (err) {
      console.error(`Error probing ${folder}/${file}:`, err.message);
    }
  }
}

console.log(JSON.stringify(results, null, 2));
