/**
 * Generates and manages idempotency keys for banking operations.
 */
export function generateIdempotencyKey() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'ik-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
}
