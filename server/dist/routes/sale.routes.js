"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sale_controller_1 = require("../controllers/sale.controller");
const bulkSale_controller_1 = require("../controllers/bulkSale.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorizePermission_1 = require("../middlewares/authorizePermission");
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
router.post("/", (0, authorizePermission_1.requirePermission)("sales.create"), sale_controller_1.recordSale);
router.get("/", sale_controller_1.getSales);
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
 */
// IMPORTANT: This must come BEFORE /:id route
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
// IMPORTANT: This must come BEFORE /:id route
router.delete("/deletesales/:id", (0, authorizePermission_1.requirePermission)("sales.delete"), sale_controller_1.deleteSaleById);
/**
 * @swagger
 * /sales/search/by-item:
 *   get:
 *     summary: Search sales by item name
 *     description: Search for sales that contain a specific item, with optional filters
 *     tags:
 *       - Sales
 *     parameters:
 *       - in: query
 *         name: itemName
 *         schema:
 *           type: string
 *         required: true
 *         description: Item name to search for (case-insensitive)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: Start date filter
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         required: false
 *         description: End date filter
 *       - in: query
 *         name: saleType
 *         schema:
 *           type: string
 *           enum: [cash, credit]
 *         required: false
 *         description: Filter by sale type
 *     responses:
 *       200:
 *         description: List of sales containing the item
 */
router.get("/search/by-item", sale_controller_1.searchSalesByItem);
/**
 * @swagger
 * /sales/bulk-update:
 *   put:
 *     summary: Bulk update multiple sales
 *     description: Update multiple sales at once (max 100)
 *     tags:
 *       - Sales
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               saleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               updates:
 *                 type: object
 *                 properties:
 *                   saleType:
 *                     type: string
 *                     enum: [cash, credit]
 *                   saleDate:
 *                     type: string
 *                     format: date
 *     responses:
 *       200:
 *         description: Bulk update successful
 */
router.put("/bulk-update", (0, authorizePermission_1.requirePermission)("sales.edit"), bulkSale_controller_1.bulkUpdateSales);
// Get sales by customer - specific route before dynamic :id
router.get("/customer/:id", sale_controller_1.getSalesByCustomerId);
// Dynamic routes come last
router.get("/:id/items", sale_controller_1.getContainerItemsBySupplier);
router.get("/:id", sale_controller_1.getSaleById);
router.put("/:id", (0, authorizePermission_1.requirePermission)("sales.edit"), sale_controller_1.updateSale);
router.put("/:id/total", (0, authorizePermission_1.requirePermission)("sales.edit"), sale_controller_1.updateSaleTotalAmount);
exports.default = router;
