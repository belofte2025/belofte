import { Router } from "express";
import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
  addSupplierItem,
  getSupplierItems,
  updateSupplierItem,
  deleteSupplierItem,
  getSupplierslist,
  listSupplierItemsWithSales,
  bulkUpdatePrices,
  bulkAdjustQuantities,
  getSupplierItemsForPriceManagement,
  getSupplierItemsForQuantityManagement,
} from "../controllers/supplier.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /suppliers:
 *   post:
 *     tags: [Suppliers]
 *     summary: Create a new supplier
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [name, contact, country, companyid]
 *             properties:
 *               suppliername:
 *                 type: string
 *               contact:
 *                 type: string
 *               country:
 *                 type: string
 *               companyid:
 *                 type: string
 *     responses:
 *       201:
 *         description: Supplier created
 */
router.post("/", authenticate, createSupplier);

/**
 * @openapi
 * /suppliers:
 *   get:
 *     tags: [Suppliers]
 *     summary: List all suppliers for the logged-in user's company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of suppliers
 */
router.get("/allsuppliers", authenticate, getSuppliers);

/**
 * @openapi
 * /suppliers/{id}:
 *   get:
 *     tags: [Suppliers]
 *     summary: Get supplier by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Supplier details
 */
router.get("/:id", getSupplierById);

/**
 * @openapi
 * /suppliers/{id}:
 *   put:
 *     tags: [Suppliers]
 *     summary: Update a supplier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               name: { type: string }
 *               contact: { type: string }
 *               country: { type: string }
 *     responses:
 *       200:
 *         description: Supplier updated
 */
router.put("/:id", updateSupplier);

/**
 * @openapi
 * /suppliers/{id}:
 *   delete:
 *     tags: [Suppliers]
 *     summary: Delete a supplier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Supplier deleted
 */
router.delete("/:id", deleteSupplier);

/**
 * @openapi
 * /suppliers/{supplierId}/items:
 *   post:
 *     tags: [Supplier Items]
 *     summary: Add a new item to a supplier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: supplierId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             required: [itemName, price]
 *             properties:
 *               itemName: { type: string }
 *               price: { type: number }
 *     responses:
 *       201:
 *         description: Item added
 */
router.post("/:supplierId/items", authenticate, addSupplierItem);

/**
 * @openapi
 * /api/suppliers/{id}/items:
 *   get:
 *     tags:
 *       - Suppliers
 *     summary: Get items belonging to a specific supplier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: List of supplier items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   itemName:
 *                     type: string
 *                   price:
 *                     type: number
 *       404:
 *         description: Supplier not found
 *       401:
 *         description: Unauthorized
 */

router.get("/:id/items", getSupplierItems);

/**
 * @openapi
 * /suppliers/items/{id}:
 *   put:
 *     tags: [Supplier Items]
 *     summary: Update a supplier item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               itemName: { type: string }
 *               price: { type: number }
 *     responses:
 *       200:
 *         description: Item updated
 */
router.put("/items/:id", authenticate, updateSupplierItem);

/**
 * @openapi
 * /suppliers/items/{id}:
 *   delete:
 *     tags: [Supplier Items]
 *     summary: Delete a supplier item
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Item deleted
 */
router.delete("/items/:id", deleteSupplierItem);

/**
 * @openapi
 * /suppliers/list:
 *   get:
 *     tags: [Suppliers]
 *     summary: Get full supplier list for the logged-in user's company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Raw list of suppliers
 */
router.get("/list", getSupplierslist);

/**
 * @openapi
 * /suppliers/allsuppliers:
 *   get:
 *     tags: [Suppliers]
 *     summary: Get full supplier list for the logged-in user's company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Raw list of suppliers
 */
router.get("/allsuppliers", getSuppliers);

/**
 * @swagger
 * /suppliers/items/withsales:
 *   get:
 *     summary: Get supplier items with total, sold, and remaining quantities
 *     tags:
 *       - Supplier Items
 *     description: |
 *       Retrieves all supplier items along with total quantities supplied,
 *       quantities sold, and remaining quantities. Matches items by supplier and item name.
 *     responses:
 *       200:
 *         description: List of supplier items with sales summary
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: ID of the supplier item
 *                   itemName:
 *                     type: string
 *                     description: Name of the item
 *                   supplierName:
 *                     type: string
 *                     description: Name of the supplier
 *                   quantity:
 *                     type: number
 *                     description: Total quantity supplied
 *                   soldQty:
 *                     type: number
 *                     description: Total quantity sold
 *                   remainingQty:
 *                     type: number
 *                     description: Quantity remaining in stock
 *                   price:
 *                     type: number
 *                     format: float
 *                     description: Current unit price
 *       500:
 *         description: Internal server error
 */

router.get("/items/withsales", listSupplierItemsWithSales);

/**
 * @openapi
 * /suppliers/{supplierId}/price-management:
 *   get:
 *     tags: [Price Management]
 *     summary: Get supplier items for price management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: supplierId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Supplier items with pricing info
 */
router.get("/:supplierId/price-management", getSupplierItemsForPriceManagement);

/**
 * @openapi
 * /suppliers/{supplierId}/price-management/bulk:
 *   put:
 *     tags: [Price Management]
 *     summary: Bulk update item prices for a supplier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: supplierId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             required: [updates]
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemId: { type: string }
 *                     price: { type: number }
 *     responses:
 *       200:
 *         description: Prices updated successfully
 */
router.put("/:supplierId/price-management/bulk", bulkUpdatePrices);

/**
 * @openapi
 * /suppliers/{supplierId}/quantity-management:
 *   get:
 *     tags: [Quantity Management]
 *     summary: Get supplier items for quantity management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: supplierId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Supplier items with quantity info
 */
router.get("/:supplierId/quantity-management", getSupplierItemsForQuantityManagement);

/**
 * @openapi
 * /suppliers/{supplierId}/quantity-management/bulk:
 *   put:
 *     tags: [Quantity Management]
 *     summary: Bulk adjust item quantities for a supplier
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: supplierId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             required: [adjustments]
 *             properties:
 *               adjustments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     itemName: { type: string }
 *                     quantityChange: { type: number }
 *                     reason: { type: string }
 *     responses:
 *       200:
 *         description: Quantities adjusted successfully
 */
router.put("/:supplierId/quantity-management/bulk", bulkAdjustQuantities);

export default router;
