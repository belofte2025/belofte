"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const role_controller_1 = require("../controllers/role.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorizePermission_1 = require("../middlewares/authorizePermission");
const router = (0, express_1.Router)();
// All role routes require authentication
router.use(auth_middleware_1.authenticate);
/**
 * @openapi
 * /roles:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Get all roles for the company
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles
 */
router.get('/', role_controller_1.getRoles);
/**
 * @openapi
 * /roles/{id}:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Get a role by ID
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
 *         description: Role details
 *       404:
 *         description: Role not found
 */
router.get('/:id', role_controller_1.getRoleById);
/**
 * @openapi
 * /roles/permissions/all:
 *   get:
 *     tags:
 *       - Roles
 *     summary: Get all available permissions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all permissions
 */
router.get('/permissions/all', role_controller_1.getPermissions);
/**
 * @openapi
 * /roles:
 *   post:
 *     tags:
 *       - Roles
 *     summary: Create a new role (requires roles.manage permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Role created successfully
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', (0, authorizePermission_1.requirePermission)('roles.manage'), role_controller_1.createRole);
/**
 * @openapi
 * /roles/{id}:
 *   put:
 *     tags:
 *       - Roles
 *     summary: Update a role (requires roles.manage permission)
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
 *               description:
 *                 type: string
 *               permissionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Role not found
 */
router.put('/:id', (0, authorizePermission_1.requirePermission)('roles.manage'), role_controller_1.updateRole);
/**
 * @openapi
 * /roles/{id}:
 *   delete:
 *     tags:
 *       - Roles
 *     summary: Delete a role (requires roles.manage permission)
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
 *         description: Role deleted successfully
 *       400:
 *         description: Cannot delete role with assigned users
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Role not found
 */
router.delete('/:id', (0, authorizePermission_1.requirePermission)('roles.manage'), role_controller_1.deleteRole);
/**
 * @openapi
 * /roles/assign:
 *   post:
 *     tags:
 *       - Roles
 *     summary: Assign a role to a user (requires users.edit permission)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *               roleId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: User or role not found
 */
router.post('/assign', (0, authorizePermission_1.requirePermission)('users.edit'), role_controller_1.assignRoleToUser);
exports.default = router;
