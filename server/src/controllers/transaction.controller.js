import * as transactionService from '../services/transaction.service.js';

export async function listTransactions(req, res, next) {
  try {
    const result = await transactionService.listTransactions(req.userId, req.query);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function getTransaction(req, res, next) {
  try {
    const transaction = await transactionService.getTransaction(req.userId, req.params.id);
    res.status(200).json({
      success: true,
      transaction
    });
  } catch (err) {
    next(err);
  }
}
