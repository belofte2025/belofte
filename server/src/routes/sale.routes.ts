import { Router } from "express";
import {
  recordSale,
  getSales,
  getContainerItemsBySupplier,
  getSaleById,
  updateSale,
  getSalesByCustomerId,
  updateSaleTotalAmount,
  listSales,
  deleteSaleById,
  searchSalesByItem,
} from "../controllers/sale.controller";
import { bulkUpdateSales } from "../controllers/bulkSale.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";

const router = Router();
router.use(authenticate);

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
router.post("/", requirePermission("sales.create"), recordSale);

router.get("/", getSales);

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
router.get("/listsales", listSales);

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
router.delete("/deletesales/:id", requirePermission("sales.delete"), deleteSaleById);

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
router.get("/search/by-item", searchSalesByItem);

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
router.put("/bulk-update", requirePermission("sales.edit"), bulkUpdateSales);

// Get sales by customer - specific route before dynamic :id
router.get("/customer/:id", getSalesByCustomerId);

// Dynamic routes come last
router.get("/:id/items", getContainerItemsBySupplier);
router.get("/:id", getSaleById);
router.put("/:id", requirePermission("sales.edit"), updateSale);
router.put("/:id/total", requirePermission("sales.edit"), updateSaleTotalAmount);

export default router;