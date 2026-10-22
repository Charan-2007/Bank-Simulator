const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

let inMemoryAccessToken = null;
let onAuthFailedCallback = null;
let refreshPromise = null;

// Wake-up notification state
const wakingListeners = new Set();
let isServerWaking = false;
let activeWakingCount = 0;

function notifyWaking(waking) {
  if (isServerWaking !== waking) {
    isServerWaking = waking;
    for (const listener of wakingListeners) {
      try {
        listener(waking);
      } catch (e) {
        console.error('Error in wake-up listener:', e);
      }
    }
  }
}

export function subscribeServerWaking(callback) {
  wakingListeners.add(callback);
  callback(isServerWaking);
  return () => wakingListeners.delete(callback);
}

// Background health check on app load
export function initBackgroundHealthCheck() {
  fetch(`${API_BASE}/api/health`, { method: 'GET' }).catch(() => {});
}

export function setAccessToken(token) {
  inMemoryAccessToken = token;
}

export function getAccessToken() {
  return inMemoryAccessToken;
}

export function setOnAuthFailed(cb) {
  onAuthFailedCallback = cb;
}

export function getRefreshToken() {
  try {
    return sessionStorage.getItem('novabank_refresh_token') || localStorage.getItem('novabank_refresh_token');
  } catch (e) {
    return null;
  }
}

export function setRefreshToken(token) {
  try {
    if (token) {
      sessionStorage.setItem('novabank_refresh_token', token);
      localStorage.setItem('novabank_refresh_token', token);
    } else {
      sessionStorage.removeItem('novabank_refresh_token');
      localStorage.removeItem('novabank_refresh_token');
    }
  } catch (e) {
    // storage unavailable
  }
}

export function clearAuthTokens() {
  inMemoryAccessToken = null;
  setRefreshToken(null);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${API_BASE}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });

  if (!res.ok) {
    clearAuthTokens();
    if (onAuthFailedCallback) onAuthFailedCallback();
    throw new Error('Refresh token invalid or expired');
  }

  const data = await res.json();
  if (data.accessToken) {
    setAccessToken(data.accessToken);
    return data.accessToken;
  }
  throw new Error('No access token returned from refresh');
}

export async function apiClient(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  if (inMemoryAccessToken && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${inMemoryAccessToken}`;
  }

  // Set up 90-second timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 90000);

  // Set up 4-second wake-up detector
  let hasTriggeredWaking = false;
  const wakingTimer = setTimeout(() => {
    hasTriggeredWaking = true;
    activeWakingCount++;
    notifyWaking(true);
  }, 4000);

  const config = {
    ...options,
    headers,
    signal: controller.signal
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (networkErr) {
    clearTimeout(timeoutId);
    clearTimeout(wakingTimer);
    if (hasTriggeredWaking) {
      activeWakingCount = Math.max(0, activeWakingCount - 1);
      if (activeWakingCount === 0) notifyWaking(false);
    }

    // Auto-retry policy: ONLY GET requests and /api/health may auto-retry
    const isGet = method === 'GET';
    const isHealth = endpoint.includes('/health');
    const retryCount = options._retryCount || 0;

    if ((isGet || isHealth) && retryCount < 1) {
      await new Promise(r => setTimeout(r, 2000));
      return apiClient(endpoint, { ...options, _retryCount: retryCount + 1 });
    }

    // If aborted due to 90s timeout
    if (networkErr.name === 'AbortError') {
      const error = new Error('Server is unreachable after 90 seconds. Please refresh or try again later.');
      error.status = 0;
      error.isNetwork = true;
      throw error;
    }

    const error = new Error('Could not reach the server');
    error.status = 0;
    error.isNetwork = true;
    throw error;
  } finally {
    clearTimeout(timeoutId);
    clearTimeout(wakingTimer);
    if (hasTriggeredWaking) {
      activeWakingCount = Math.max(0, activeWakingCount - 1);
      if (activeWakingCount === 0) notifyWaking(false);
    }
  }

  // Handle 401: try refresh once, unless it was an auth endpoint like login or refresh itself
  if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh') && !options._isRetry) {
    try {
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newAccessToken = await refreshPromise;
      // Retry request once with new token
      headers['Authorization'] = `Bearer ${newAccessToken}`;
      return apiClient(endpoint, { ...options, headers, _isRetry: true });
    } catch (err) {
      clearAuthTokens();
      if (onAuthFailedCallback) onAuthFailedCallback();
      const error = new Error('Session expired');
      error.status = 401;
      throw error;
    }
  }

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const retryHeader = response.headers.get('Retry-After');
    const retryAfter = retryHeader ? parseInt(retryHeader, 10) : (data?.error?.retryAfter || null);
    const errorMsg =
      data?.error?.message ||
      data?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      (typeof data === 'string' ? data : `Request failed with status ${response.status}`);
    const error = new Error(errorMsg);
    error.status = response.status;
    error.retryAfter = retryAfter;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  get: (url, options = {}) => apiClient(url, { ...options, method: 'GET' }),
  post: (url, body, options = {}) => apiClient(url, { ...options, method: 'POST', body }),
  patch: (url, body, options = {}) => apiClient(url, { ...options, method: 'PATCH', body }),
  put: (url, body, options = {}) => apiClient(url, { ...options, method: 'PUT', body }),
  delete: (url, options = {}) => apiClient(url, { ...options, method: 'DELETE' })
};

export default api;
