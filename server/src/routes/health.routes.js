import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

/**
 * GET /api/health
 * Returns service health and MongoDB connection state
 */
router.get('/', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    status: 'ok',
    db: readyState,
    dbStatus: stateMap[readyState] || 'unknown',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

export default router;
