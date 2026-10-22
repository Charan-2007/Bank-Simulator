import fs from 'node:fs';
import path from 'node:path';

// Known WinGet ffmpeg bin paths
const potentialPaths = [
  'C:\\Users\\charan\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin',
];

for (const p of potentialPaths) {
  if (fs.existsSync(p)) {
    if (!process.env.PATH.includes(p)) {
      process.env.PATH = `${p};${process.env.PATH}`;
    }
  }
}

export function ensureFfmpegEnv() {
  return process.env.PATH;
}
