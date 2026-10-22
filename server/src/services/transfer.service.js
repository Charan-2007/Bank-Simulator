import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { LIMITS, getStartOfDayInKolkata } from '../config/limits.js';
import { generateReferenceId } from '../utils/referenceId.js';
import { normalizeIndianPhone } from '../../../shared/phoneUtils.js';

export async function executeTransfer(senderId, transferData) {
  const { recipientPhone, recipientAccount, amountPaise, note, pin, idempotencyKey } = transferData;

  // 1. Validate Sender & PIN
  const sender = await User.findById(senderId);
  if (!sender) {
    const err = new Error('Sender account not found');
    err.statusCode = 404;
    throw err;
  }

  // Check PIN lockout
  if (sender.pinLockedUntil && new Date() < sender.pinLockedUntil) {
    const remainingMs = sender.pinLockedUntil.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    const err = new Error(`Account is locked due to multiple failed PIN attempts. Try again in ${remainingMinutes} minute(s)`);
    err.statusCode = 423;
    throw err;
  }

  const isPinValid = await bcrypt.compare(pin, sender.pinHash);
  if (!isPinValid) {
    sender.failedPinAttempts += 1;
    if (sender.failedPinAttempts >= LIMITS.PIN_MAX_FAILED_ATTEMPTS) {
      sender.pinLockedUntil = new Date(Date.now() + LIMITS.PIN_LOCKOUT_MINUTES * 60 * 1000);
    }
    await sender.save();

    const err = new Error('Invalid PIN');
    err.statusCode = 401;
    throw err;
  }

  // Reset PIN failed attempts on success
  if (sender.failedPinAttempts > 0 || sender.pinLockedUntil) {
    sender.failedPinAttempts = 0;
    sender.pinLockedUntil = null;
    await sender.save();
  }

  // 2. Check Idempotency Key (Return cached response if duplicate)
  if (idempotencyKey) {
    const existingTx = await Transaction.findOne({
      userId: sender._id,
      idempotencyKey
    });

    if (existingTx) {
      return {
        idempotentReplay: true,
        referenceId: existingTx.referenceId,
        transferId: existingTx.transferId,
        amountPaise: existingTx.amountPaise,
        balanceAfterPaise: existingTx.balanceAfterPaise,
        recipientName: existingTx.counterpartyName,
        createdAt: existingTx.createdAt
      };
    }
  }

  // 3. Find and validate recipient
  const recipientQuery = { status: 'active' };
  const orConditions = [];
  if (recipientPhone) {
    const normalized = normalizeIndianPhone(recipientPhone);
    if (!normalized) {
      const err = new Error('Invalid recipient phone format');
      err.statusCode = 400;
      throw err;
    }
    orConditions.push({ phone: normalized });
  }
  if (recipientAccount) {
    orConditions.push({ accountNumber: recipientAccount.trim() });
  }
  recipientQuery.$or = orConditions;

  const recipient = await User.findOne(recipientQuery);
  if (!recipient) {
    const err = new Error('Recipient account not found or inactive');
    err.statusCode = 404;
    throw err;
  }

  // Prevent self-transfer strictly by stable user ID comparison
  if (recipient._id.toString() === sender._id.toString()) {
    const err = new Error('Self-transfers are not permitted');
    err.statusCode = 400;
    throw err;
  }

  // 4. Check Single-Transaction Limit
  if (amountPaise < LIMITS.TRANSFER_MIN_AMOUNT_PAISE) {
    const err = new Error(`Minimum transfer amount is ₹${LIMITS.TRANSFER_MIN_AMOUNT_PAISE / 100}`);
    err.statusCode = 400;
    throw err;
  }

  if (amountPaise > LIMITS.TRANSFER_MAX_AMOUNT_PAISE) {
    const err = new Error(`Maximum transfer amount per transaction is ₹${LIMITS.TRANSFER_MAX_AMOUNT_PAISE / 100}`);
    err.statusCode = 400;
    throw err;
  }

  // 5. Start MongoDB Transaction Session
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Check Daily Transfer Limit in Asia/Kolkata timezone INSIDE the session
    const startOfDay = getStartOfDayInKolkata();

    const todayTransfers = await Transaction.find({
      userId: sender._id,
      type: 'transfer_out',
      status: 'success',
      createdAt: { $gte: startOfDay }
    }).session(session);

    const todaySpentPaise = todayTransfers.reduce((sum, tx) => sum + tx.amountPaise, 0);

    if (todaySpentPaise + amountPaise > LIMITS.DAILY_TRANSFER_LIMIT_PAISE) {
      const remainingPaise = Math.max(0, LIMITS.DAILY_TRANSFER_LIMIT_PAISE - todaySpentPaise);
      const err = new Error(
        `Daily transfer limit of ₹${LIMITS.DAILY_TRANSFER_LIMIT_PAISE / 100} exceeded. Remaining limit for today is ₹${(remainingPaise / 100).toFixed(2)}.`
      );
      err.statusCode = 400;
      throw err;
    }

    // Atomic debit from sender with balance check
    const updatedSender = await User.findOneAndUpdate(
      { _id: sender._id, balancePaise: { $gte: amountPaise } },
      { $inc: { balancePaise: -amountPaise } },
      { returnDocument: 'after', session }
    );

    if (!updatedSender) {
      const err = new Error('Insufficient balance to complete transfer');
      err.statusCode = 400;
      throw err;
    }

    // Atomic credit to recipient
    const updatedRecipient = await User.findOneAndUpdate(
      { _id: recipient._id },
      { $inc: { balancePaise: amountPaise } },
      { returnDocument: 'after', session }
    );

    // Generate shared transfer ID & unique reference IDs
    const transferId = uuidv4();
    const senderRefId = generateReferenceId();
    const receiverRefId = generateReferenceId();

    // Create Sender Transaction (transfer_out)
    const senderTx = new Transaction({
      userId: sender._id,
      type: 'transfer_out',
      amountPaise,
      balanceAfterPaise: updatedSender.balancePaise,
      counterpartyUserId: recipient._id,
      counterpartyName: recipient.name,
      note: note || '',
      status: 'success',
      referenceId: senderRefId,
      transferId,
      idempotencyKey: idempotencyKey || null
    });
    await senderTx.save({ session });

    // Create Receiver Transaction (transfer_in)
    const receiverTx = new Transaction({
      userId: recipient._id,
      type: 'transfer_in',
      amountPaise,
      balanceAfterPaise: updatedRecipient.balancePaise,
      counterpartyUserId: sender._id,
      counterpartyName: sender.name,
      note: note || '',
      status: 'success',
      referenceId: receiverRefId,
      transferId,
      idempotencyKey: null
    });
    await receiverTx.save({ session });

    await session.commitTransaction();

    return {
      success: true,
      referenceId: senderRefId,
      transferId,
      amountPaise,
      balanceAfterPaise: updatedSender.balancePaise,
      recipientName: recipient.name,
      createdAt: senderTx.createdAt
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
