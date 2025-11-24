"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const sms_controller_1 = require("../controllers/sms.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorizePermission_1 = require("../middlewares/authorizePermission");
const router = express_1.default.Router();
router.post('/send', auth_middleware_1.authenticate, (0, authorizePermission_1.requirePermission)("utilities.view"), sms_controller_1.sendSingleSMS);
router.post('/payment-confirmation', auth_middleware_1.authenticate, (0, authorizePermission_1.requirePermission)("utilities.view"), sms_controller_1.sendPaymentConfirmationSMS);
router.post('/bulk-debt-reminders', auth_middleware_1.authenticate, (0, authorizePermission_1.requirePermission)("utilities.view"), sms_controller_1.sendBulkDebtReminders);
router.get('/logs', auth_middleware_1.authenticate, (0, authorizePermission_1.requirePermission)("utilities.view"), sms_controller_1.getSMSLogs);
exports.default = router;
