import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load server/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProd = nodeEnv === 'production';

// Fail-fast verification for production deployments
if (isProd) {
  const missing = [];
  if (!process.env.MONGODB_URI || !process.env.MONGODB_URI.trim()) {
    missing.push('MONGODB_URI is required in production.');
  }
  const accessSecret = process.env.JWT_ACCESS_SECRET || '';
  if (!accessSecret || accessSecret.length < 64 || !/^[0-9a-fA-F]+$/.test(accessSecret)) {
    missing.push('JWT_ACCESS_SECRET is required in production and must be at least 64 hex characters.');
  }
  const refreshSecret = process.env.JWT_REFRESH_SECRET || '';
  if (!refreshSecret || refreshSecret.length < 64 || !/^[0-9a-fA-F]+$/.test(refreshSecret)) {
    missing.push('JWT_REFRESH_SECRET is required in production and must be at least 64 hex characters.');
  }
  const rawCors = process.env.CORS_ORIGINS || '';
  if (!rawCors.trim() || rawCors.includes('*')) {
    missing.push('CORS_ORIGINS is required in production as comma-separated exact origins with no wildcard (*).');
  }

  if (missing.length > 0) {
    console.error('FATAL CONFIGURATION ERROR: Server failed to start due to missing or invalid production settings:');
    for (const msg of missing) {
      console.error(`  - ${msg}`);
    }
    process.exit(1);
  }
}

const defaultDevCors = 'http://localhost:5273,http://localhost:5173,http://localhost:3100,http://localhost:3000';
const parsedCors = (process.env.CORS_ORIGINS || (isProd ? '' : defaultDevCors))
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv,
  mongoUri: process.env.MONGODB_URI || '',
  demoShowOtp: process.env.DEMO_SHOW_OTP === 'true',
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || (isProd ? '' : 'dev_fallback_access_secret_do_not_use_in_prod'),
    refreshSecret: process.env.JWT_REFRESH_SECRET || (isProd ? '' : 'dev_fallback_refresh_secret_do_not_use_in_prod'),
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
  },
  corsOrigins: parsedCors,
  viteApiBaseUrl: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
  viteMediaBaseUrl: process.env.VITE_MEDIA_BASE_URL || 'http://localhost:3000'
};
