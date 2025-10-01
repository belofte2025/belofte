"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
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
router.get("/container/:containerId", report_controller_1.getContainerReport);
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
router.get("/supplier/:supplierId", report_controller_1.supplierReport);
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
router.get("/detailed", report_controller_1.detailedSalesReport);
router.get("/salessummary/supplier", report_controller_1.getSalesSummaryBySupplier);
exports.default = router;
