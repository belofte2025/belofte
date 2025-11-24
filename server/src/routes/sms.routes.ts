import express from 'express';
import {
  sendSingleSMS,
  sendPaymentConfirmationSMS,
  sendBulkDebtReminders,
  getSMSLogs,
} from '../controllers/sms.controller';
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";

const router = express.Router();

router.post('/send', authenticate, requirePermission("utilities.view"), sendSingleSMS);
router.post('/payment-confirmation', authenticate, requirePermission("utilities.view"), sendPaymentConfirmationSMS);
router.post('/bulk-debt-reminders', authenticate, requirePermission("utilities.view"), sendBulkDebtReminders);
router.get('/logs', authenticate, requirePermission("utilities.view"), getSMSLogs);

export default router;