import * as transferService from '../services/transfer.service.js';
import * as depositService from '../services/deposit.service.js';
import * as withdrawService from '../services/withdraw.service.js';

export async function transfer(req, res, next) {
  try {
    const result = await transferService.executeTransfer(req.userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Transfer completed successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function deposit(req, res, next) {
  try {
    const result = await depositService.deposit(req.userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Deposit completed successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function withdraw(req, res, next) {
  try {
    const result = await withdrawService.withdraw(req.userId, req.body);
    res.status(200).json({
      success: true,
      message: 'Withdrawal completed successfully',
      ...result
    });
  } catch (err) {
    next(err);
  }
}
