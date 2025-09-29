"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const upload_controller_1 = require("../controllers/upload.controller");
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.post("/container/:id/items", upload.single("file"), upload_controller_1.uploadContainerItems);
router.post("/supplier/:id/items", upload.single("file"), upload_controller_1.uploadSupplierItems);
/**
 * @swagger
 * /uploads/uploadopeningbalances:
 *   post:
 *     summary: Upload customer opening balances from Excel file
 *     tags:
 *       - Uploads
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx or .csv) containing customer name, phone, and amount
 *     responses:
 *       200:
 *         description: Opening balances processed successfully
 *       400:
 *         description: Validation error or missing data
 *       500:
 *         description: Internal server error
 */
router.post("/uploadopeningbalances", upload.single("file"), upload_controller_1.uploadOpeningBalances);
/**
 * @swagger
 * /uploads/openingstock:
 *   post:
 *     summary: Upload item opening stock from Excel
 *     tags:
 *       - Opening Stock
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Excel file (.xlsx) with opening stock items
 *     responses:
 *       200:
 *         description: Opening stock items processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 added:
 *                   type: number
 *                   example: 10
 *                 skipped:
 *                   type: number
 *                   example: 5
 *                 failedItems:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       itemName:
 *                         type: string
 *                       reason:
 *                         type: string
 *       400:
 *         description: Missing file or validation failed
 *       500:
 *         description: Internal server error
 */
router.post("/openingstock", upload.single("file"), upload_controller_1.uploadOpeningStockItems);
exports.default = router;
