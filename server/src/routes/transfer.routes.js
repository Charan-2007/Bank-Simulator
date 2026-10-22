import express from 'express';
import * as transferController from '../controllers/transfer.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { transferLimiter } from '../middleware/rateLimiter.js';
import { transferSchema, depositSchema, withdrawSchema } from '../schemas/banking.schemas.js';

const router = express.Router();

router.post('/transfers', requireAuth, transferLimiter, validate(transferSchema), transferController.transfer);
router.post('/deposits', requireAuth, validate(depositSchema), transferController.deposit);
router.post('/withdrawals', requireAuth, validate(withdrawSchema), transferController.withdraw);

export default router;
