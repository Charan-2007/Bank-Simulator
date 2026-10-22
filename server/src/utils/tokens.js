import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../config/env.js';

/**
 * Sign a short-lived access token (JWT)
 */
export function signAccessToken(userId) {
  return jwt.sign(
    { sub: userId.toString() },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );
}

/**
 * Verify an access token (JWT)
 */
export function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

/**
 * Generate a cryptographically secure random refresh token (40-byte hex)
 * Returns the raw token and its SHA-256 hash
 */
export function generateRefreshToken() {
  const token = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(token);
  return { token, tokenHash };
}

/**
 * Compute SHA-256 hash of a token
 */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}
