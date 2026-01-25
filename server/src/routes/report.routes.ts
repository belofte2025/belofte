import { Router } from "express";
import {
  getContainerReport,
  supplierReport,
  detailedSalesReport,
  getSalesSummaryBySupplier,
  getCashSalesAndPaymentsReport,
  getItemTransactionHistoryReport,
} from "../controllers/report.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";

const router = Router();
router.use(authenticate);
router.use(requirePermission("reports.view")); // All report routes require reports.view permission

/**
 * @openapi
 * /report/container/{containerId}:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get container report
 *     parameters:
 *       - name: containerId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container report
 */

router.get("/container/:containerId", getContainerReport);

/**
 * @openapi
 * /report/supplier/{supplierId}:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get supplier report
 *     parameters:
 *       - name: supplierId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Supplier report
 */
router.get("/supplier/:supplierId", supplierReport);

/**
 * @openapi
 * /report/detailed:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get detailed sales report
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Detailed report
 */
router.get("/detailed", detailedSalesReport);

router.get("/salessummary/supplier", getSalesSummaryBySupplier);

// New route for cash sales and payments
router.get("/cashtransactions", getCashSalesAndPaymentsReport);

/**
 * @openapi
 * /report/item-transactions/{supplierId}/{itemName}:
 *   get:
 *     tags:
 *       - Reports
 *     summary: Get detailed transaction history for an item from a supplier
 *     description: Shows all inwards (containers), sales, and adjustments with running balance to identify negative stock issues
 *     parameters:
 *       - name: supplierId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: itemName
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Item transaction history with running balance
 */
router.get("/item-transactions/:supplierId/:itemName", getItemTransactionHistoryReport);

export default router;
