import api from './client.js';

export async function sendTransfer({ recipientPhone, recipientAccount, amountPaise, note, pin, idempotencyKey }) {
  return api.post('/api/transfers', {
    recipientPhone,
    recipientAccount,
    amountPaise,
    note,
    pin,
    idempotencyKey
  });
}

export async function depositMoney({ amountPaise, idempotencyKey }) {
  return api.post('/api/deposits', {
    amountPaise,
    idempotencyKey
  });
}

export async function withdrawMoney({ amountPaise, idempotencyKey }) {
  return api.post('/api/withdrawals', {
    amountPaise,
    idempotencyKey
  });
}
