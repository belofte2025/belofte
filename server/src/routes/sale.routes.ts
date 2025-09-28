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
} from "../controllers/sale.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/authoriseRole";

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

router.post("/", authorizeRoles("admin", "staff"), recordSale);

router.get("/", getSales);

router.get("/:id/items", getContainerItemsBySupplier);

router.get("/customer/:id", getSalesByCustomerId);

router.get("/:id", getSaleById);

router.put("/:id", updateSale);

router.put("/:id/total", updateSaleTotalAmount);

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

router.delete("/deletesales/:id", deleteSaleById);

export default router;
