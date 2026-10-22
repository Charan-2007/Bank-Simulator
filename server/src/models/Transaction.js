import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer_out', 'transfer_in'],
      required: true
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1
    },
    balanceAfterPaise: {
      type: Number,
      required: true
    },
    counterpartyUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    counterpartyName: {
      type: String,
      default: null
    },
    note: {
      type: String,
      maxlength: 200,
      default: null
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success'
    },
    failureReason: {
      type: String,
      default: null
    },
    referenceId: {
      type: String,
      required: true,
      unique: true
    },
    transferId: {
      type: String,
      default: null,
      index: true
    },
    idempotencyKey: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index(
  { userId: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
);

export const Transaction = mongoose.model('Transaction', TransactionSchema);
