import express from 'express';
import {
  sendSingleSMS,
  sendPaymentConfirmationSMS,
  sendBulkDebtReminders,
  getSMSLogs,
} from '../controllers/sms.controller';
import { authenticate } from "../middlewares/auth.middleware";

const router = express.Router();

router.post('/send', authenticate, sendSingleSMS);
router.post('/payment-confirmation', authenticate, sendPaymentConfirmationSMS);
router.post('/bulk-debt-reminders', authenticate, sendBulkDebtReminders);
router.get('/logs', authenticate, getSMSLogs);

export default router;