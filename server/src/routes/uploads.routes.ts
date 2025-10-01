import { Router } from "express";
import multer from "multer";
import { authenticate } from "../middlewares/auth.middleware";
import {
  uploadContainerItems,
  uploadOpeningBalances,
  uploadOpeningStockItems,
  uploadSupplierItems,
} from "../controllers/upload.controller";
import { generateCustomerTemplate, generateSupplierTemplate, generateBulkImportTemplate } from "../controllers/template.controller";
import { importCustomers, importSuppliers } from "../controllers/import.controller";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// Template download routes (public - no authentication required)
router.get("/template", generateBulkImportTemplate);
router.get("/templates/customers", generateCustomerTemplate);
router.get("/templates/suppliers", generateSupplierTemplate);


// Apply authentication middleware to all routes below this point
router.use(authenticate);

// Import routes (require authentication)
router.post("/import/customers", upload.single("file"), importCustomers);
router.post("/import/suppliers", upload.single("file"), importSuppliers);

router.post(
  "/container/:id/items",
  upload.single("file"),
  uploadContainerItems
);
router.post("/supplier/:id/items", upload.single("file"), uploadSupplierItems);

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
router.post(
  "/uploadopeningbalances",
  upload.single("file"),
  uploadOpeningBalances
);

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
router.post("/openingstock", upload.single("file"), uploadOpeningStockItems);


export default router;
