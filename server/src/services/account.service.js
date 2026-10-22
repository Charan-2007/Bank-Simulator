import { User } from '../models/User.js';
import { normalizeIndianPhone } from '../../../shared/phoneUtils.js';

export async function getMe(userId) {
  const user = await User.findById(userId).select('-pinHash -refreshTokens');
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  return user;
}

export async function updateSettings(userId, settings) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (settings.theme) user.settings.theme = settings.theme;
  if (settings.glassEffect) user.settings.glassEffect = settings.glassEffect;
  if (typeof settings.reducedMotion === 'boolean') user.settings.reducedMotion = settings.reducedMotion;
  if (settings.cardAnimation) user.settings.cardAnimation = settings.cardAnimation;
  if (typeof settings.haptics === 'boolean') user.settings.haptics = settings.haptics;

  await user.save();
  return user.settings;
}

export async function updateCard(userId, cardId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  user.selectedCardId = cardId;
  await user.save();
  return { selectedCardId: user.selectedCardId };
}

export async function lookupRecipient({ phone, account }) {
  const query = { status: 'active' };
  const orConditions = [];

  if (phone) {
    const normalized = normalizeIndianPhone(phone);
    if (!normalized) {
      const err = new Error('Invalid recipient phone format');
      err.statusCode = 400;
      throw err;
    }
    orConditions.push({ phone: normalized });
  }

  if (account) {
    orConditions.push({ accountNumber: account.trim() });
  }

  if (orConditions.length === 0) {
    const err = new Error('Please specify recipient phone or account number');
    err.statusCode = 400;
    throw err;
  }

  query.$or = orConditions;

  const user = await User.findOne(query).select('_id name accountNumber phone status');

  if (!user || user.status !== 'active') {
    const err = new Error('Recipient account not found or inactive');
    err.statusCode = 404;
    throw err;
  }

  // Mask phone for privacy: +919876543210 -> +91••••••3210
  const phoneStr = user.phone || '';
  const maskedPhone = phoneStr.length > 6
    ? phoneStr.slice(0, 3) + '••••••' + phoneStr.slice(-4)
    : phoneStr;

  return {
    id: user._id.toString(),
    name: user.name,
    accountNumber: user.accountNumber,
    phone: maskedPhone
  };
}
