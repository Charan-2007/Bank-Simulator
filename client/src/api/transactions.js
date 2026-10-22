import api from './client.js';

export async function listTransactions({ filter = 'all', page = 1, limit = 20 } = {}) {
  const params = new URLSearchParams();
  if (filter) params.set('filter', filter);
  if (page) params.set('page', page.toString());
  if (limit) params.set('limit', limit.toString());
  return api.get(`/api/transactions?${params.toString()}`);
}

export async function getTransaction(id) {
  return api.get(`/api/transactions/${id}`);
}
