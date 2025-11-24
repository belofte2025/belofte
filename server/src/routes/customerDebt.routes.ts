// server\src\routes\customerDebt.routes.ts

import { Router } from "express";
import {
  createCustomerDebt,
  bulkCreateCustomerDebts,
  getCustomerDebts,
  getAllDebts,
  updateCustomerDebt,
  deleteCustomerDebt,
  markDebtAsPaid,
} from "../controllers/customerDebt.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /customerdebts:
 *   post:
 *     tags:
 *       - Customer Debts
 *     summary: Create a new debt entry for a customer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerId
 *               - amount
 *             properties:
 *               customerId:
 *                 type: string
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               debtType:
 *                 type: string
 *                 enum: [manual, credit_sale, other]
 *     responses:
 *       201:
 *         description: Debt created successfully
 */
router.post("/", requirePermission("debts.create"), createCustomerDebt);

/**
 * @openapi
 * /customerdebts/bulk:
 *   post:
 *     tags:
 *       - Customer Debts
 *     summary: Create multiple debt entries at once
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - debts
 *             properties:
 *               debts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - customerId
 *                     - amount
 *                   properties:
 *                     customerId:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     description:
 *                       type: string
 *                     debtType:
 *                       type: string
 *                       enum: [manual, credit_sale, other]
 *     responses:
 *       201:
 *         description: Debts created successfully
 */
router.post("/bulk", requirePermission("debts.create"), bulkCreateCustomerDebts);

/**
 * @openapi
 * /customerdebts:
 *   get:
 *     tags:
 *       - Customer Debts
 *     summary: Get all debts for the company
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, unpaid, paid, partial]
 *     responses:
 *       200:
 *         description: List of debts
 */
router.get("/", getAllDebts);

/**
 * @openapi
 * /customerdebts/customer/{customerId}:
 *   get:
 *     tags:
 *       - Customer Debts
 *     summary: Get all debts for a specific customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer debts
 */
// ✅ FIXED: Changed :Id to :customerId
router.get("/customer/:customerId", getCustomerDebts);

/**
 * @openapi
 * /customerdebts/{id}:
 *   put:
 *     tags:
 *       - Customer Debts
 *     summary: Update a debt entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [unpaid, paid, partial]
 *     responses:
 *       200:
 *         description: Debt updated successfully
 */
// ✅ FIXED: Changed :customerId back to :id
router.put("/:id", requirePermission("debts.edit"), updateCustomerDebt);

/**
 * @openapi
 * /customerdebts/{id}/mark-paid:
 *   patch:
 *     tags:
 *       - Customer Debts
 *     summary: Mark a debt as paid
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Debt marked as paid
 */
// ✅ FIXED: Changed :customerId back to :id
router.patch(
  "/:id/mark-paid",
  requirePermission("debts.edit"),
  markDebtAsPaid
);

/**
 * @openapi
 * /customerdebts/{id}:
 *   delete:
 *     tags:
 *       - Customer Debts
 *     summary: Delete a debt entry
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Debt deleted successfully
 */
// ✅ FIXED: Changed :customerId back to :id
router.delete("/:id", requirePermission("debts.delete"), deleteCustomerDebt);

export default router;
