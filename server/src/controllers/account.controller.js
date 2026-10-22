import * as accountService from '../services/account.service.js';

export async function getMe(req, res, next) {
  try {
    const user = await accountService.getMe(req.userId);
    res.status(200).json({
      success: true,
      user
    });
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const settings = await accountService.updateSettings(req.userId, req.body);
    res.status(200).json({
      success: true,
      settings
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCard(req, res, next) {
  try {
    const result = await accountService.updateCard(req.userId, req.body.cardId);
    res.status(200).json({
      success: true,
      ...result
    });
  } catch (err) {
    next(err);
  }
}

export async function lookupRecipient(req, res, next) {
  try {
    const recipient = await accountService.lookupRecipient({
      phone: req.query.phone,
      account: req.query.account
    });
    res.status(200).json({
      success: true,
      recipient
    });
  } catch (err) {
    next(err);
  }
}
