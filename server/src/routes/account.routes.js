import express from 'express';
import * as accountController from '../controllers/account.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { recipientLookupSchema } from '../schemas/banking.schemas.js';

const router = express.Router();

router.get('/me', requireAuth, accountController.getMe);
router.patch('/me/settings', requireAuth, accountController.updateSettings);
router.patch('/me/card', requireAuth, accountController.updateCard);
router.get('/accounts/lookup', requireAuth, validate(recipientLookupSchema, 'query'), accountController.lookupRecipient);

export default router;
