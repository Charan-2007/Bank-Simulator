import bcrypt from 'bcrypt';
import { User } from '../models/User.js';
import { LIMITS } from '../config/limits.js';
import { generateAccountNumber } from '../utils/accountNumber.js';
import { generateCardNumber } from '../utils/cardNumber.js';
import { signAccessToken, generateRefreshToken, hashToken } from '../utils/tokens.js';

/**
 * Register a user or restart an existing pending registration
 */
export async function register(userData) {
  const existingUser = await User.findOne({ phone: userData.phone });

  if (existingUser) {
    if (existingUser.status === 'active') {
      const err = new Error('This number is already registered. Log in instead.');
      err.statusCode = 409;
      err.code = 'USER_ALREADY_EXISTS';
      throw err;
    }

    // Pending registration restart: update details
    existingUser.name = userData.name;
    existingUser.dateOfBirth = new Date(userData.dateOfBirth);
    existingUser.nationality = userData.nationality || 'Indian';
    await existingUser.save();

    return {
      user: existingUser,
      isRestart: true
    };
  }

  // Generate unique account number
  let accountNumber = generateAccountNumber();
  while (await User.exists({ accountNumber })) {
    accountNumber = generateAccountNumber();
  }

  const demoCardNumber = generateCardNumber();

  const newUser = await User.create({
    name: userData.name,
    dateOfBirth: new Date(userData.dateOfBirth),
    phone: userData.phone,
    nationality: userData.nationality || 'Indian',
    status: 'pending',
    accountNumber,
    demoCardNumber,
    balancePaise: LIMITS.STARTING_BALANCE_PAISE,
    selectedCardId: 'abstract-black-hole'
  });

  return {
    user: newUser,
    isRestart: false
  };
}

/**
 * Set the 6-digit PIN and activate a pending user
 */
export async function setPin(userId, pin) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('OTP not verified or expired, verify again');
    err.statusCode = 401;
    throw err;
  }

  if (user.status === 'active' && user.pinHash) {
    const err = new Error('PIN already set, log in instead');
    err.statusCode = 400;
    throw err;
  }

  const pinHash = await bcrypt.hash(pin, 12);
  user.pinHash = pinHash;
  user.status = 'active';
  user.failedPinAttempts = 0;
  user.pinLockedUntil = null;
  await user.save();

  return user;
}

/**
 * Change PIN with current PIN verification and lockout enforcement
 */
export async function changePin(userId, currentPin, newPin) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  // Check lockout
  if (user.pinLockedUntil && new Date() < user.pinLockedUntil) {
    const remainingMs = user.pinLockedUntil.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    const err = new Error(`Account is locked due to failed PIN attempts. Try again in ${remainingMinutes} minute(s)`);
    err.statusCode = 423;
    throw err;
  }

  if (!user.pinHash) {
    const err = new Error('PIN has not been initialized');
    err.statusCode = 400;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPin, user.pinHash);
  if (!isMatch) {
    user.failedPinAttempts += 1;
    if (user.failedPinAttempts >= LIMITS.PIN_MAX_FAILED_ATTEMPTS) {
      user.pinLockedUntil = new Date(Date.now() + LIMITS.PIN_LOCKOUT_MINUTES * 60 * 1000);
    }
    await user.save();

    const err = new Error('Invalid current PIN');
    err.statusCode = 401;
    throw err;
  }

  // Reset failed attempts & set new PIN
  user.failedPinAttempts = 0;
  user.pinLockedUntil = null;
  user.pinHash = await bcrypt.hash(newPin, 12);
  await user.save();

  return true;
}

/**
 * Log in with phone and 6-digit PIN
 */
export async function login(phone, pin, device = 'web') {
  const user = await User.findOne({ phone, status: 'active' });
  if (!user) {
    const err = new Error('Invalid phone number or PIN');
    err.statusCode = 401;
    throw err;
  }

  // Check lockout
  if (user.pinLockedUntil && new Date() < user.pinLockedUntil) {
    const remainingMs = user.pinLockedUntil.getTime() - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / 60000);
    const err = new Error(`Account is temporarily locked. Try again in ${remainingMinutes} minute(s)`);
    err.statusCode = 423;
    throw err;
  }

  const isMatch = await bcrypt.compare(pin, user.pinHash);
  if (!isMatch) {
    user.failedPinAttempts += 1;
    if (user.failedPinAttempts >= LIMITS.PIN_MAX_FAILED_ATTEMPTS) {
      user.pinLockedUntil = new Date(Date.now() + LIMITS.PIN_LOCKOUT_MINUTES * 60 * 1000);
    }
    await user.save();

    const err = new Error('Invalid phone number or PIN');
    err.statusCode = 401;
    throw err;
  }

  // Successful login: reset failed attempts & clear lockout
  user.failedPinAttempts = 0;
  user.pinLockedUntil = null;

  const accessToken = signAccessToken(user._id.toString());
  const { token: refreshToken, tokenHash } = generateRefreshToken();

  // Store SHA-256 hashed refresh token (7 days expiry)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.refreshTokens.push({
    tokenHash,
    createdAt: new Date(),
    expiresAt,
    device
  });

  // Limit stored refresh tokens to 10
  if (user.refreshTokens.length > 10) {
    user.refreshTokens = user.refreshTokens.slice(-10);
  }

  await user.save();

  return {
    user,
    accessToken,
    refreshToken
  };
}

/**
 * Issue a new access token using a valid refresh token
 */
export async function refresh(token) {
  const tokenHash = hashToken(token);
  const user = await User.findOne({ 'refreshTokens.tokenHash': tokenHash });

  if (!user) {
    const err = new Error('Invalid or revoked refresh token');
    err.statusCode = 401;
    throw err;
  }

  const tokenEntry = user.refreshTokens.find(t => t.tokenHash === tokenHash);
  if (!tokenEntry || new Date() > tokenEntry.expiresAt) {
    // Remove expired token
    user.refreshTokens = user.refreshTokens.filter(t => t.tokenHash !== tokenHash);
    await user.save();

    const err = new Error('Refresh token has expired');
    err.statusCode = 401;
    throw err;
  }

  const accessToken = signAccessToken(user._id.toString());
  return { accessToken };
}

/**
 * Log out and invalidate the specified refresh token
 */
export async function logout(userId, token) {
  const tokenHash = hashToken(token);
  await User.updateOne(
    { _id: userId },
    { $pull: { refreshTokens: { tokenHash } } }
  );
  return true;
}
