import { config } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    error: {
      message: statusCode >= 500 && config.nodeEnv === 'production' ? 'An unexpected error occurred' : message,
      code: err.code || (statusCode === 423 ? 'ACCOUNT_LOCKED' : 'ERROR'),
      details: err.details || null,
      ...(config.nodeEnv !== 'production' && statusCode >= 500 ? { stack: err.stack } : {})
    }
  });
}
