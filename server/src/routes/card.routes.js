import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const manifestPath = path.resolve(__dirname, '../../data/cards.manifest.json');

let cachedManifest = null;

/**
 * GET /api/cards
 * Public endpoint to fetch all available cards manifest
 */
router.get('/', async (req, res, next) => {
  try {
    if (!cachedManifest) {
      const data = await fs.readFile(manifestPath, 'utf-8');
      cachedManifest = JSON.parse(data);
    }
    res.status(200).json(cachedManifest);
  } catch (err) {
    next(err);
  }
});

export default router;
