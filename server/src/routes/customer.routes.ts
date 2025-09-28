import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  createCustomerPayment,
  getCustomerStatement,
} from "../controllers/customer.controller";

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /customers:
 *   post:
 *     tags:
 *       - Customers
 *     summary: Create a new customer
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customerName
 *               - phone
 *             properties:
 *               customerName:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Customer created successfully
 */
router.post("/", createCustomer);

/**
 * @openapi
 * /customers:
 *   get:
 *     tags:
 *       - Customers
 *     summary: Get all customers for the logged-in user's company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get("/", getCustomers);

/**
 * @openapi
 * /customers/{id}:
 *   get:
 *     tags: [Customers]
 *     summary: Get a customer by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Customer details
 *

 */
router.get("/:id", getCustomerById);

/**
 * @openapi
 * /customers/{id}:
 *   put:
 *     tags: [Customers]
 *     summary: Update a customer
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Customer updated
 *         content:
 *           application/json:

 */
router.put("/:id", updateCustomer); // ✅ Corrected

/**
 * @openapi
 * /customers/{id}/payments:
 *   post:
 *     summary: Record a payment made by a customer
 *     tags:
 *       - Customers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the customer
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 250.00
 *               note:
 *                 type: string
 *                 example: "Advance for May delivery"
 *     responses:
 *       201:
 *         description: Payment recorded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CustomerPayment'
 *       400:
 *         description: Invalid input or missing data
 *       500:
 *         description: Server error
 */

router.post("/:id/payments", createCustomerPayment);

/**
 * @openapi
 * /customers/{id}/statement:
 *   get:
 *     summary: Get customer account statement
 *     tags: [Customers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: List of statement transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   date:
 *                     type: string
 *                   type:
 *                     type: string
 *                   description:
 *                     type: string
 *                   amount:
 *                     type: number
 *       500:
 *         description: Internal server error
 */
router.get("/:id/statement", getCustomerStatement);

export default router;
