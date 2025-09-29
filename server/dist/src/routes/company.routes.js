"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const company_controller_1 = require("../controllers/company.controller");
const router = (0, express_1.Router)();
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
router.post("/", company_controller_1.createCompany);
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
router.get("/", company_controller_1.getCompanies);
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
router.get("/:id", company_controller_1.getCompanyById);
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
router.put("/:id", company_controller_1.updateCompany);
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
router.delete("/:id", company_controller_1.deleteCompany);
exports.default = router;
