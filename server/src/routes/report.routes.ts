import { Router } from "express";
import {
  getContainerReport,
  supplierReport,
  detailedSalesReport,
  getSalesSummaryBySupplier,
} from "../controllers/report.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

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

export default router;
