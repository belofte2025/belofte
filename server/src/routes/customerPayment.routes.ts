import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  recordCustomerPayment,
  getCustomerStatement,
  deleteCustomerPayment,
  getCustomerPayments,
} from "../controllers/customerPayment.controller";

const router = Router();
router.use(authenticate);

router.post("/", recordCustomerPayment);

router.get("/:id/statement", getCustomerStatement);

/**
 * @swagger
 * /payments/{id}/customerpayments:
 *   delete:
 *     summary: Delete a customer payment
 *     tags:
 *       - CustomerPayments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to delete
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Payment deleted successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.delete("/:id/customerpayments", deleteCustomerPayment);

/**
 * @swagger
 * /payments/{id}/payments:
 *   get:
 *     summary: Get all customer payments
 *     tags: [Customer Payments]
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the customer
 *     responses:
 *       200:
 *         description: List of customer payments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   customerId:
 *                     type: string
 *                   companyId:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   note:
 *                     type: string
 *                   paymentType:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Server error
 */
router.get("/:id/payments", getCustomerPayments);

export default router;
