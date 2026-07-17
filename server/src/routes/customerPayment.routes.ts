import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";
import {
  recordCustomerPayment,
  updateCustomerPayment,
  deleteCustomerPayment,
  getCustomerPayments,
  getAllCustomerPayments,
} from "../controllers/customerPayment.controller";
import { getCustomerStatement } from "../controllers/customer.controller";

const router = Router();
router.use(authenticate);

router.post("/", requirePermission("payments.create"), recordCustomerPayment);

// Delegates to the authoritative statement implementation in customer.controller
router.get("/:id/statement", getCustomerStatement);

/**
 * @swagger
 * /payments/{id}:
 *   put:
 *     summary: Update a customer payment
 *     tags:
 *       - CustomerPayments
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the payment to update
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               note:
 *                 type: string
 *               paymentType:
 *                 type: string
 *               paymentDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       404:
 *         description: Payment not found
 *       500:
 *         description: Server error
 */
router.put("/:id", requirePermission("payments.create"), updateCustomerPayment);

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
router.delete("/:id/customerpayments", requirePermission("payments.create"), deleteCustomerPayment);

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

router.get("/all", getAllCustomerPayments);

export default router;
