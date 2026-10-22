import * as authService from '../services/auth.service.js';
import * as otpService from '../services/otp.service.js';
import { User } from '../models/User.js';
import { signAccessToken } from '../utils/tokens.js';
import { config } from '../config/env.js';

export async function register(req, res, next) {
  try {
    const { user, isRestart } = await authService.register(req.body);
    const code = await otpService.requestOtp(user.phone);
    const response = {
      success: true,
      isRestart,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        status: user.status,
        accountNumber: user.accountNumber
      }
    };

    if (config.demoShowOtp || process.env.DEMO_SHOW_OTP === 'true') {
      response.devOtp = code;
    }

    res.status(isRestart ? 200 : 201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function requestOtp(req, res, next) {
  try {
    const code = await otpService.requestOtp(req.body.phone);
    const response = {
      success: true,
      message: 'OTP sent successfully'
    };

    if (config.demoShowOtp || process.env.DEMO_SHOW_OTP === 'true') {
      response.devOtp = code;
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
}

export async function verifyOtp(req, res, next) {
  try {
    await otpService.verifyOtp(req.body.phone, req.body.otp);
    const user = await User.findOne({ phone: req.body.phone });

    let tempToken = null;
    let userId = null;
    if (user) {
      tempToken = signAccessToken(user._id.toString());
      userId = user._id;
    }

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      tempToken,
      userId
    });
  } catch (err) {
    next(err);
  }
}

export async function setPin(req, res, next) {
  try {
    const userId = req.userId || req.body.userId;
    if (!userId) {
      const err = new Error('OTP not verified or expired, verify again');
      err.statusCode = 401;
      throw err;
    }

    if (req.body.confirmPin && req.body.pin !== req.body.confirmPin) {
      const err = new Error('PINs do not match');
      err.statusCode = 400;
      throw err;
    }

    const updatedUser = await authService.setPin(userId, req.body.pin);
    // After PIN is set, log them in and issue full access/refresh tokens
    const { accessToken, refreshToken } = await authService.login(updatedUser.phone, req.body.pin);

    res.status(200).json({
      success: true,
      message: 'PIN set successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        status: updatedUser.status,
        accountNumber: updatedUser.accountNumber,
        balancePaise: updatedUser.balancePaise
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
}

export async function changePin(req, res, next) {
  try {
    await authService.changePin(req.userId, req.body.currentPin, req.body.newPin);
    res.status(200).json({
      success: true,
      message: 'PIN changed successfully'
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login(
      req.body.phone,
      req.body.pin,
      req.headers['user-agent'] || 'web'
    );

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        accountNumber: user.accountNumber,
        balancePaise: user.balancePaise,
        selectedCardId: user.selectedCardId,
        demoCardNumber: user.demoCardNumber,
        settings: user.settings
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { accessToken } = await authService.refresh(req.body.refreshToken);
    res.status(200).json({
      success: true,
      accessToken
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res, next) {
  try {
    await authService.logout(req.userId, req.body.refreshToken);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (err) {
    next(err);
  }
}
