import { Transaction } from '../models/Transaction.js';

export async function listTransactions(userId, { filter = 'all', page = 1, limit = 20 }) {
  const query = { userId };

  if (filter === 'money_in') {
    query.type = { $in: ['deposit', 'transfer_in'] };
  } else if (filter === 'money_out') {
    query.type = { $in: ['withdrawal', 'transfer_out'] };
  }

  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const skip = (numericPage - 1) * numericLimit;

  const [transactions, total] = await Promise.all([
    Transaction.find(query).sort({ createdAt: -1 }).skip(skip).limit(numericLimit).lean(),
    Transaction.countDocuments(query)
  ]);

  return {
    transactions,
    pagination: {
      total,
      page: numericPage,
      limit: numericLimit,
      pages: Math.ceil(total / numericLimit)
    }
  };
}

export async function getTransaction(userId, transactionId) {
  const tx = await Transaction.findOne({ _id: transactionId, userId }).lean();
  if (!tx) {
    const err = new Error('Transaction not found');
    err.statusCode = 404;
    throw err;
  }
  return tx;
}
