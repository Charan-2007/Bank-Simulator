import api from './client.js';

export async function getMe() {
  return api.get('/api/me');
}

export async function updateSettings(settings) {
  return api.patch('/api/me/settings', settings);
}

export async function updateCard(cardId) {
  return api.patch('/api/me/card', { cardId });
}

export async function lookupRecipient({ phone, account }) {
  const params = new URLSearchParams();
  if (phone) params.set('phone', phone);
  if (account) params.set('account', account);
  return api.get(`/api/accounts/lookup?${params.toString()}`);
}
