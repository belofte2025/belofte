import { Request, Response } from 'express';
import prisma from '../utils/prisma';

/**
 * Get all roles for the authenticated user's company
 */
export const getRoles = async (req: Request, res: Response): Promise<void> => {
  try {
    const companyId = req.user!.companyId;

    const roles = await prisma.role.findMany({
      where: { companyId },
      include: {
        RolePermission: {
          include: {
            Permission: true
          }
        },
        _count: {
          select: { User: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(roles);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ error: 'Failed to fetch roles' });
  }
};

/**
 * Get a single role by ID
 */
export const getRoleById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    const role = await prisma.role.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        RolePermission: {
          include: {
            Permission: true
          }
        },
        _count: {
          select: { User: true }
        }
      }
    });

    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    res.json(role);
  } catch (error) {
    console.error('Error fetching role:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
};

/**
 * Get all available permissions
 */
export const getPermissions = async (req: Request, res: Response): Promise<void> => {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Group permissions by category
    type Permission = typeof permissions[number];
    const groupedPermissions = permissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
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
  } catch (error) {
    console.error('Error fetching RolePermission:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
};

/**
 * Create a new role
 */
export const createRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, permissionIds, isDefault } = req.body;
    const companyId = req.user!.companyId;

    // Validate required fields
    if (!name || !permissionIds || !Array.isArray(permissionIds)) {
      res.status(400).json({ error: 'Name and permissionIds are required' });
      return;
    }

    // Check if role name already exists for this company
    const existingRole = await prisma.role.findUnique({
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
      await prisma.role.updateMany({
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
    const role = await prisma.role.create({
      data: {
        name,
        description,
        companyId,
        isDefault: isDefault || false,
        RolePermission: {
          create: permissionIds.map((permissionId: string) => ({
            permissionId
          }))
        }
      },
      include: {
        RolePermission: {
          include: {
            Permission: true
          }
        }
      }
    });

    res.status(201).json(role);
  } catch (error) {
    console.error('Error creating role:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

/**
 * Update a role
 */
export const updateRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, description, permissionIds, isDefault } = req.body;
    const companyId = req.user!.companyId;

    // Check if role exists and belongs to this company
    const existingRole = await prisma.role.findFirst({
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
      const duplicate = await prisma.role.findUnique({
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
      await prisma.role.updateMany({
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
      await prisma.rolePermission.deleteMany({
        where: { roleId: id }
      });

      // Add new permissions
      await prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId: string) => ({
          roleId: id,
          permissionId
        }))
      });
    }

    // Update role details
    const role = await prisma.role.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault })
      },
      include: {
        RolePermission: {
          include: {
            Permission: true
          }
        }
      }
    });

    res.json(role);
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};

/**
 * Delete a role
 */
export const deleteRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const companyId = req.user!.companyId;

    // Check if role exists and belongs to this company
    const role = await prisma.role.findFirst({
      where: {
        id,
        companyId
      },
      include: {
        _count: {
          select: { User: true }
        }
      }
    });

    if (!role) {
      res.status(404).json({ error: 'Role not found' });
      return;
    }

    // Prevent deleting role if users are assigned to it
    if (role._count.User > 0) {
      res.status(400).json({
        error: 'Cannot delete role with assigned users',
        usersCount: role._count.User
      });
      return;
    }

    await prisma.role.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

/**
 * Assign a role to a user
 */
export const assignRoleToUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, roleId } = req.body;
    const companyId = req.user!.companyId;

    if (!userId || !roleId) {
      res.status(400).json({ error: 'userId and roleId are required' });
      return;
    }

    // Verify the user exists and belongs to this company
    const user = await prisma.user.findFirst({
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
    const role = await prisma.role.findFirst({
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
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { roleId },
      include: {
        Role: {
          include: {
            RolePermission: {
              include: {
                Permission: true
              }
            }
          }
        }
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error assigning role:', error);
    res.status(500).json({ error: 'Failed to assign role' });
  }
};
