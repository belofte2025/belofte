"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.assignRoleToUser = exports.deleteRole = exports.updateRole = exports.createRole = exports.getPermissions = exports.getRoleById = exports.getRoles = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
/**
 * Get all roles for the authenticated user's company
 */
const getRoles = async (req, res) => {
    try {
        const companyId = req.user.companyId;
        const roles = await prisma_1.default.role.findMany({
            where: { companyId },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                },
                _count: {
                    select: { users: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(roles);
    }
    catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};
exports.getRoles = getRoles;
/**
 * Get a single role by ID
 */
const getRoleById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        const role = await prisma_1.default.role.findFirst({
            where: {
                id,
                companyId
            },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                },
                _count: {
                    select: { users: true }
                }
            }
        });
        if (!role) {
            res.status(404).json({ error: 'Role not found' });
            return;
        }
        res.json(role);
    }
    catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};
exports.getRoleById = getRoleById;
/**
 * Get all available permissions
 */
const getPermissions = async (req, res) => {
    try {
        const permissions = await prisma_1.default.permission.findMany({
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });
        const groupedPermissions = permissions.reduce((acc, perm) => {
            if (!acc[perm.category]) {
                acc[perm.category] = [];
            }
            acc[perm.category].push(perm);
            return acc;
        }, {});
        res.json({
            permissions,
            groupedPermissions
        });
    }
    catch (error) {
        console.error('Error fetching permissions:', error);
        res.status(500).json({ error: 'Failed to fetch permissions' });
    }
};
exports.getPermissions = getPermissions;
/**
 * Create a new role
 */
const createRole = async (req, res) => {
    try {
        const { name, description, permissionIds, isDefault } = req.body;
        const companyId = req.user.companyId;
        // Validate required fields
        if (!name || !permissionIds || !Array.isArray(permissionIds)) {
            res.status(400).json({ error: 'Name and permissionIds are required' });
            return;
        }
        // Check if role name already exists for this company
        const existingRole = await prisma_1.default.role.findUnique({
            where: {
                name_companyId: {
                    name,
                    companyId
                }
            }
        });
        if (existingRole) {
            res.status(400).json({ error: 'A role with this name already exists' });
            return;
        }
        // If this role should be default, unset other defaults
        if (isDefault) {
            await prisma_1.default.role.updateMany({
                where: {
                    companyId,
                    isDefault: true
                },
                data: {
                    isDefault: false
                }
            });
        }
        // Create the role with permissions
        const role = await prisma_1.default.role.create({
            data: {
                name,
                description,
                companyId,
                isDefault: isDefault || false,
                permissions: {
                    create: permissionIds.map((permissionId) => ({
                        permissionId
                    }))
                }
            },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
        res.status(201).json(role);
    }
    catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Failed to create role' });
    }
};
exports.createRole = createRole;
/**
 * Update a role
 */
const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permissionIds, isDefault } = req.body;
        const companyId = req.user.companyId;
        // Check if role exists and belongs to this company
        const existingRole = await prisma_1.default.role.findFirst({
            where: {
                id,
                companyId
            }
        });
        if (!existingRole) {
            res.status(404).json({ error: 'Role not found' });
            return;
        }
        // If name is being changed, check for duplicates
        if (name && name !== existingRole.name) {
            const duplicate = await prisma_1.default.role.findUnique({
                where: {
                    name_companyId: {
                        name,
                        companyId
                    }
                }
            });
            if (duplicate) {
                res.status(400).json({ error: 'A role with this name already exists' });
                return;
            }
        }
        // If this role should be default, unset other defaults
        if (isDefault && !existingRole.isDefault) {
            await prisma_1.default.role.updateMany({
                where: {
                    companyId,
                    isDefault: true
                },
                data: {
                    isDefault: false
                }
            });
        }
        // Update permissions if provided
        if (permissionIds && Array.isArray(permissionIds)) {
            // Delete existing permissions
            await prisma_1.default.rolePermission.deleteMany({
                where: { roleId: id }
            });
            // Add new permissions
            await prisma_1.default.rolePermission.createMany({
                data: permissionIds.map((permissionId) => ({
                    roleId: id,
                    permissionId
                }))
            });
        }
        // Update role details
        const role = await prisma_1.default.role.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description }),
                ...(isDefault !== undefined && { isDefault })
            },
            include: {
                permissions: {
                    include: {
                        permission: true
                    }
                }
            }
        });
        res.json(role);
    }
    catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
};
exports.updateRole = updateRole;
/**
 * Delete a role
 */
const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.companyId;
        // Check if role exists and belongs to this company
        const role = await prisma_1.default.role.findFirst({
            where: {
                id,
                companyId
            },
            include: {
                _count: {
                    select: { users: true }
                }
            }
        });
        if (!role) {
            res.status(404).json({ error: 'Role not found' });
            return;
        }
        // Prevent deleting role if users are assigned to it
        if (role._count.users > 0) {
            res.status(400).json({
                error: 'Cannot delete role with assigned users',
                usersCount: role._count.users
            });
            return;
        }
        await prisma_1.default.role.delete({
            where: { id }
        });
        res.json({ success: true, message: 'Role deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Failed to delete role' });
    }
};
exports.deleteRole = deleteRole;
/**
 * Assign a role to a user
 */
const assignRoleToUser = async (req, res) => {
    try {
        const { userId, roleId } = req.body;
        const companyId = req.user.companyId;
        if (!userId || !roleId) {
            res.status(400).json({ error: 'userId and roleId are required' });
            return;
        }
        // Verify the user exists and belongs to this company
        const user = await prisma_1.default.user.findFirst({
            where: {
                id: userId,
                companyId
            }
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Verify the role exists and belongs to this company
        const role = await prisma_1.default.role.findFirst({
            where: {
                id: roleId,
                companyId
            }
        });
        if (!role) {
            res.status(404).json({ error: 'Role not found' });
            return;
        }
        // Assign the role
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: { roleId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error('Error assigning role:', error);
        res.status(500).json({ error: 'Failed to assign role' });
    }
};
exports.assignRoleToUser = assignRoleToUser;
