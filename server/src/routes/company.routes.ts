import { Router } from "express";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../controllers/company.controller";

const router = Router();

/**
 * @openapi
 * /companies:
 *   post:
 *     tags: [Companies]
 *     summary: Create a new company
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             required: [name]
 *             properties:
 *               companyName: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *     responses:
 *       201:
 *         description: Company created
 */
router.post("/", createCompany);

/**
 * @openapi
 * /companies:
 *   get:
 *     tags: [Companies]
 *     summary: Get all companies
 *     responses:
 *       200:
 *         description: List of companies
 */
router.get("/", getCompanies);

/**
 * @openapi
 * /companies/{id}:
 *   get:
 *     tags: [Companies]
 *     summary: Get a company by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Company details
 *       404:
 *         description: Not found
 */
router.get("/:id", getCompanyById);

/**
 * @openapi
 * /companies/{id}:
 *   put:
 *     tags: [Companies]
 *     summary: Update a company
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *               phone: { type: string }
 *     responses:
 *       200:
 *         description: Company updated
 */
router.put("/:id", updateCompany);

/**
 * @openapi
 * /companies/{id}:
 *   delete:
 *     tags: [Companies]
 *     summary: Delete a company
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Company deleted
 */
router.delete("/:id", deleteCompany);

export default router;
