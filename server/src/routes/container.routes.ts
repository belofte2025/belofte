import { Router } from "express";
import {
  getContainers,
  createContainer,
  getContainerById,
  markContainerAsReceived,
  markContainerAsIncomplete,
  markContainerAsDone,
  deleteContainer,
  updateReceivedQuantities,
  completeOffload,
  saveOffloadData,
  getContainerItems,
  getOffloadSummary,
  listContainerItemsWithSales,
  getContainerSalesSummary,
} from "../controllers/container.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /containers:
 *   get:
 *     tags:
 *       - Containers
 *     summary: Get all containers for the logged-in company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of containers
 */
router.get("/", getContainers);

/**
 * @openapi
 * /containers:
 *   post:
 *     tags:
 *       - Containers
 *     summary: Create a new container with items
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - containerNo
 *               - arrivalDate
 *               - year
 *               - supplierId
 *               - items
 *             properties:
 *               containerNo:
 *                 type: string
 *               arrivalDate:
 *                 type: string
 *                 format: date
 *               year:
 *                 type: integer
 *               supplierId:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - itemName
 *                     - quantity
 *                     - unitPrice
 *                   properties:
 *                     itemName:
 *                       type: string
 *                     quantity:
 *                       type: integer
 *                     unitPrice:
 *                       type: number
 *     responses:
 *       201:
 *         description: Container created
 */
router.post("/", createContainer);

/**
 * @openapi
 * /containers/{id}:
 *   get:
 *     tags:
 *       - Containers
 *     summary: Get container details by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container details
 *       404:
 *         description: Container not found
 */
router.get("/:id", getContainerById);

/**
 * @openapi
 * /containers/{id}/mark-received:
 *   put:
 *     tags:
 *       - Containers
 *     summary: Mark a container as received
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container marked as received
 */
router.put("/:id/mark-received", markContainerAsReceived);

/**
 * @openapi
 * /containers/{id}/mark-incomplete:
 *   put:
 *     tags:
 *       - Containers
 *     summary: Mark container as offload incomplete
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container marked as offload incomplete
 */
router.put("/:id/mark-incomplete", markContainerAsIncomplete);

/**
 * @openapi
 * /containers/{id}/mark-done:
 *   put:
 *     tags:
 *       - Containers
 *     summary: Mark container as offload done
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Container marked as offload done
 */
router.put("/:id/mark-done", markContainerAsDone);

router.delete("/:id", deleteContainer);

router.put("/:id/update-quantities", updateReceivedQuantities);

router.post("/:id/offload", completeOffload);

router.post("/offload", saveOffloadData);
/**
 * @swagger
 * /containers/{id}/items:
 *   get:
 *     summary: Get all items for a specific container
 *     tags:
 *       - Containers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the container
 *     responses:
 *       200:
 *         description: List of container items
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
 *                   quantity:
 *                     type: number
 *                   receivedQty:
 *                     type: number
 *                   unitPrice:
 *                     type: number
 *       404:
 *         description: Container not found
 *       500:
 *         description: Server error
 */

// GET /api/containers/:id/items
router.get("/:id/items", getContainerItems);

/**
 * @swagger
 * /containers/{id}/summary:
 *   get:
 *     summary: Get offload summary for a container
 *     tags:
 *       - Containers
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container ID
 *     responses:
 *       200:
 *         description: A list of container item summaries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "abc123"
 *                   name:
 *                     type: string
 *                     example: "Laptops"
 *                   expected:
 *                     type: number
 *                     example: 10
 *                   received:
 *                     type: number
 *                     example: 9
 *       404:
 *         description: Container not found
 *       500:
 *         description: Server error
 */

router.get("/:id/summary", getOffloadSummary); // Add this route

/**
 * @swagger
 * /containers/{id}/containeritems/withsales:
 *   get:
 *     summary: List container items with sales breakdown for a container
 *     tags:
 *       - ContainerItems
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the container
 *     responses:
 *       200:
 *         description: List of container items with their received, sold, and remaining quantities
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
 *                   receivedQty:
 *                     type: number
 *                   soldQty:
 *                     type: number
 *                   remainingQty:
 *                     type: number
 *                   unitPrice:
 *                     type: number
 *       500:
 *         description: Internal server error
 */

router.get("/:id/containeritems/withsales", listContainerItemsWithSales);

router.get("/:id/containersummary", getContainerSalesSummary);

export default router;
