import express from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';
import { authLimiter, otpLimiter } from '../middleware/rateLimiter.js';
import {
  registerSchema,
  otpRequestSchema,
  otpVerifySchema,
  setPinSchema,
  changePinSchema,
  loginSchema,
  refreshTokenSchema
} from '../schemas/auth.schemas.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/otp/request', otpLimiter, validate(otpRequestSchema), authController.requestOtp);
router.post('/otp/verify', otpLimiter, validate(otpVerifySchema), authController.verifyOtp);
router.post('/pin', optionalAuth, authLimiter, validate(setPinSchema), authController.setPin);
router.post('/pin/change', requireAuth, authLimiter, validate(changePinSchema), authController.changePin);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshTokenSchema), authController.refresh);
router.post('/logout', requireAuth, validate(refreshTokenSchema), authController.logout);

export default router;
