"use strict";
// server\src\routes\customerDebt.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerDebt_controller_1 = require("../controllers/customerDebt.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorizePermission_1 = require("../middlewares/authorizePermission");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
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
router.post("/", (0, authorizePermission_1.requirePermission)("debts.create"), customerDebt_controller_1.createCustomerDebt);
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
router.post("/bulk", (0, authorizePermission_1.requirePermission)("debts.create"), customerDebt_controller_1.bulkCreateCustomerDebts);
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
router.get("/", customerDebt_controller_1.getAllDebts);
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
router.get("/customer/:customerId", customerDebt_controller_1.getCustomerDebts);
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
router.put("/:id", (0, authorizePermission_1.requirePermission)("debts.edit"), customerDebt_controller_1.updateCustomerDebt);
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
router.patch("/:id/mark-paid", (0, authorizePermission_1.requirePermission)("debts.edit"), customerDebt_controller_1.markDebtAsPaid);
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
router.delete("/:id", (0, authorizePermission_1.requirePermission)("debts.delete"), customerDebt_controller_1.deleteCustomerDebt);
exports.default = router;
