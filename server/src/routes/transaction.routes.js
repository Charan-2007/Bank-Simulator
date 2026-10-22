import express from 'express';
import * as transactionController from '../controllers/transaction.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { transactionQuerySchema } from '../schemas/banking.schemas.js';

const router = express.Router();

router.get('/', requireAuth, validate(transactionQuerySchema, 'query'), transactionController.listTransactions);
router.get('/:id', requireAuth, transactionController.getTransaction);

export default router;
