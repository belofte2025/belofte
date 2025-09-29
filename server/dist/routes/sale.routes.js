"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sale_controller_1 = require("../controllers/sale.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authoriseRole_1 = require("../middlewares/authoriseRole");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
/**
 * @openapi
 * /sales:
 *   post:
 *     tags:
 *       - Sales
 *     summary: Record a new sale
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *               saleType:
 *                 type: string
 *                 enum: [cash, credit]
 *     responses:
 *       201:
 *         description: Sale recorded
 */
router.post("/", (0, authoriseRole_1.authorizeRoles)("admin", "staff"), sale_controller_1.recordSale);
router.get("/", sale_controller_1.getSales);
router.get("/:id/items", sale_controller_1.getContainerItemsBySupplier);
router.get("/customer/:id", sale_controller_1.getSalesByCustomerId);
router.get("/:id", sale_controller_1.getSaleById);
router.put("/:id", sale_controller_1.updateSale);
router.put("/:id/total", sale_controller_1.updateSaleTotalAmount);
/**
 * @swagger
 * /sales/listsales:
 *   get:
 *     summary: Get all sales
 *     description: Retrieve a list of all sales. Optionally filter by start and end date.
 *     tags:
 *       - Sales
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Start date in YYYY-MM-DD format
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: End date in YYYY-MM-DD format
 *     responses:
 *       200:
 *         description: A list of sales
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   saleType:
 *                     type: string
 *                   customerId:
 *                     type: string
 *                   totalAmount:
 *                     type: number
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 */
router.get("/listsales", sale_controller_1.listSales);
/**
 * @swagger
 * /sales/deletesales/{id}:
 *   delete:
 *     summary: Delete a sale
 *     description: Delete a sale entry by its ID.
 *     tags:
 *       - Sales
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the sale to delete
 *     responses:
 *       200:
 *         description: Sale deleted successfully
 *       404:
 *         description: Sale not found
 */
router.delete("/deletesales/:id", sale_controller_1.deleteSaleById);
exports.default = router;
