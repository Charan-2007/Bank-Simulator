/**
 * Maps API errors into precise, user-facing error messages without swallowing server details.
 */
export function formatApiError(err, fallback = 'Operation failed. Please try again.') {
  if (!err) return fallback;

  // Network failure / server unreachable
  if (err.status === 0 || err.isNetwork || err.message === 'Could not reach the server' || err.message === 'Failed to fetch') {
    return 'Could not reach the server';
  }

  // 429 Rate Limiting
  if (err.status === 429) {
    const seconds = err.retryAfter || err.data?.error?.retryAfter || 60;
    return `Too many attempts. Try again in ${seconds} seconds.`;
  }

  // 423 Account Lockout
  if (err.status === 423) {
    return err.message || 'Account is temporarily locked due to failed PIN attempts.';
  }

  // 409 Conflict / Already registered
  if (err.status === 409) {
    if (err.data?.isPending || err.message?.toLowerCase().includes('pending') || err.message?.toLowerCase().includes('resume')) {
      return 'Registration already in progress. Resume registration.';
    }
    return 'This number is already registered. Log in instead.';
  }

  // 400 Validation Error with field details
  if (err.status === 400 && err.data?.error?.details && Array.isArray(err.data.error.details)) {
    const details = err.data.error.details;
    if (details.length > 0) {
      return details.map(d => d.message || `${d.field} is invalid`).join(', ');
    }
  }

  // Return server-provided error message directly
  if (err.message && err.message !== 'Request failed' && !err.message.startsWith('Request failed with status')) {
    return err.message;
  }

  return fallback;
}
