import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { config } from './config/env.js';
import healthRouter from './routes/health.routes.js';
import cardRouter from './routes/card.routes.js';
import authRouter from './routes/auth.routes.js';
import accountRouter from './routes/account.routes.js';
import transferRouter from './routes/transfer.routes.js';
import transactionRouter from './routes/transaction.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createApp() {
  const app = express();

  // Enable trust proxy in production behind reverse proxies like Render
  if (config.nodeEnv === 'production') {
    app.set('trust proxy', 1);
  }

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      crossOriginEmbedderPolicy: false
    })
  );

  // CORS allow-list configuration
  const CAPACITOR_ORIGINS = ['capacitor://localhost', 'http://localhost', 'https://localhost'];
  const allowedOrigins = new Set([...config.corsOrigins, ...CAPACITOR_ORIGINS]);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
        if (!origin) return callback(null, true);

        if (allowedOrigins.has(origin)) {
          return callback(null, true);
        }

        // Allow localhost and local LAN IPs in development only
        if (
          config.nodeEnv === 'development' &&
          /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?$/.test(origin)
        ) {
          return callback(null, true);
        }

        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key']
    })
  );

  // General rate limiter for API routes
  app.use('/api', generalLimiter);

  // Body Parser
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Static Media Serving with long cache headers (31536000 seconds = 1 year)
  const publicDir = path.resolve(__dirname, '../public');
  const mediaDir = path.resolve(publicDir, 'media');

  app.use(
    '/media',
    express.static(mediaDir, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    })
  );

  // Fallback for general public directory
  app.use(express.static(publicDir));

  // Base API routes
  app.use('/api/health', healthRouter);
  app.use('/api/cards', cardRouter);
  app.use('/api/auth', authRouter);
  app.use('/api', accountRouter);
  app.use('/api', transferRouter);
  app.use('/api/transactions', transactionRouter);

  // 404 handler
  app.use((req, res, next) => {
    res.status(404).json({
      error: 'Not Found',
      message: `Cannot ${req.method} ${req.originalUrl}`
    });
  });

  // Central Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export default app;
