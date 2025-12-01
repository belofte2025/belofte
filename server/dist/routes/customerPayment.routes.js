"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorizePermission_1 = require("../middlewares/authorizePermission");
const customerPayment_controller_1 = require("../controllers/customerPayment.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/", (0, authorizePermission_1.requirePermission)("payments.create"), customerPayment_controller_1.recordCustomerPayment);
router.get("/:id/statement", customerPayment_controller_1.getCustomerStatement);
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
router.put("/:id", (0, authorizePermission_1.requirePermission)("payments.create"), customerPayment_controller_1.updateCustomerPayment);
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
router.delete("/:id/customerpayments", (0, authorizePermission_1.requirePermission)("payments.create"), customerPayment_controller_1.deleteCustomerPayment);
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
router.get("/:id/payments", customerPayment_controller_1.getCustomerPayments);
router.get("/all", customerPayment_controller_1.getAllCustomerPayments);
exports.default = router;
