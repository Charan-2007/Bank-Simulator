import api, { setAccessToken, setRefreshToken, clearAuthTokens, getRefreshToken } from './client.js';

export async function registerUser({ name, dateOfBirth, phone, nationality }) {
  return api.post('/api/auth/register', { name, dateOfBirth, phone, nationality });
}

export async function requestOtp(phone) {
  return api.post('/api/auth/otp/request', { phone });
}

export async function verifyOtp(phone, otp) {
  return api.post('/api/auth/otp/verify', { phone, otp });
}

export async function setPin({ pin, userId, tempToken }) {
  const headers = tempToken ? { Authorization: `Bearer ${tempToken}` } : {};
  const res = await api.post('/api/auth/pin', { pin, userId }, { headers });
  if (res.accessToken) setAccessToken(res.accessToken);
  if (res.refreshToken) setRefreshToken(res.refreshToken);
  return res;
}

export async function changePin({ currentPin, newPin, confirmPin }) {
  return api.post('/api/auth/pin/change', { currentPin, newPin, confirmPin });
}

export async function loginUser(phone, pin) {
  const res = await api.post('/api/auth/login', { phone, pin });
  if (res.accessToken) setAccessToken(res.accessToken);
  if (res.refreshToken) setRefreshToken(res.refreshToken);
  return res;
}

export async function logoutUser() {
  const token = getRefreshToken();
  try {
    if (token) {
      await api.post('/api/auth/logout', { refreshToken: token });
    }
  } catch (e) {
    // ignore server logout failure on client
  } finally {
    clearAuthTokens();
  }
}
