import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { LIMITS } from '../config/limits.js';
import { generateReferenceId } from '../utils/referenceId.js';

export async function deposit(userId, { amountPaise, idempotencyKey }) {
  if (amountPaise > LIMITS.DEPOSIT_MAX_AMOUNT_PAISE) {
    const err = new Error(`Maximum deposit amount is ₹${LIMITS.DEPOSIT_MAX_AMOUNT_PAISE / 100}`);
    err.statusCode = 400;
    throw err;
  }

  if (idempotencyKey) {
    const existingTx = await Transaction.findOne({ userId, idempotencyKey });
    if (existingTx) {
      return {
        idempotentReplay: true,
        referenceId: existingTx.referenceId,
        amountPaise: existingTx.amountPaise,
        balanceAfterPaise: existingTx.balanceAfterPaise,
        createdAt: existingTx.createdAt
      };
    }
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { $inc: { balancePaise: amountPaise } },
    { returnDocument: 'after' }
  );

  if (!updatedUser) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  const referenceId = generateReferenceId();

  const tx = await Transaction.create({
    userId,
    type: 'deposit',
    amountPaise,
    balanceAfterPaise: updatedUser.balancePaise,
    status: 'success',
    referenceId,
    idempotencyKey: idempotencyKey || null
  });

  return {
    success: true,
    referenceId,
    amountPaise,
    balanceAfterPaise: updatedUser.balancePaise,
    createdAt: tx.createdAt
  };
}
