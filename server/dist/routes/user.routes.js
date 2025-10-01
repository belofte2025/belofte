"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authoriseRole_1 = require("../middlewares/authoriseRole");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
/**
 * @openapi
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: Get list of users for the authenticated company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       400:
 *         description: Company ID is missing
 */
router.get("/", (0, authoriseRole_1.authorizeRoles)("admin"), user_controller_1.listUsers);
router.post("/", (0, authoriseRole_1.authorizeRoles)("admin"), user_controller_1.createUser);
/**
 * @openapi
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update an existing user
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
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
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, staff, viewer]
 *     responses:
 *       200:
 *         description: User updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 */
router.put("/:id", (0, authoriseRole_1.authorizeRoles)("admin"), user_controller_1.updateUser);
exports.default = router;
