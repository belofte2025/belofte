import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import prisma from '../utils/prisma';
import { generateToken } from '../utils/jwt';

/**
 * Public endpoint to onboard a new company with its first admin user
 * No authentication required
 */
export const onboardCompany = async (req: Request, res: Response) => {
  try {
    const { companyName, adminName, adminEmail, adminPassword } = req.body;

    // Validate required fields
    if (!companyName || !adminName || !adminEmail || !adminPassword) {
      res.status(400).json({
        error: 'All fields are required',
        detail: 'Please provide companyName, adminName, adminEmail, and adminPassword'
      });
      return;
    }

    // Check if company with same name already exists
    const existingCompany = await prisma.company.findFirst({
      where: {
        companyName: {
          equals: companyName,
          mode: 'insensitive'
        }
      }
    });

    if (existingCompany) {
      res.status(400).json({
        error: 'Company already exists',
        detail: 'A company with this name is already registered'
      });
      return;
    }

    // Check if user with same email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail }
    });

    if (existingUser) {
      res.status(400).json({
        error: 'Email already registered',
        detail: 'This email is already associated with an account'
      });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create company and admin user in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the company
      const company = await tx.company.create({
        data: {
          companyName
        }
      });

      // 2. Get or create Admin role for this company
      let adminRole = await tx.role.findFirst({
        where: {
          companyId: company.id,
          name: 'Admin'
        }
      });

      if (!adminRole) {
        // Get all permissions
        const allPermissions = await tx.permission.findMany();

        // Create Admin role with all permissions
        adminRole = await tx.role.create({
          data: {
            name: 'Admin',
            description: 'Full system access with all permissions',
            companyId: company.id,
            isDefault: false,
            permissions: {
              create: allPermissions.map(p => ({
                permissionId: p.id
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
      }

      // 3. Create the admin user
      const adminUser = await tx.user.create({
        data: {
          userName: adminName,
          email: adminEmail,
          password: hashedPassword,
          roleId: adminRole.id,
          companyId: company.id
        },
        include: {
          role: {
            include: {
              permissions: {
                include: {
                  permission: true
                }
              }
            }
          },
          company: {
            select: {
              companyName: true
            }
          }
        }
      });

      return { company, adminUser };
    });

    // Extract permission codes
    const permissions = result.adminUser.role?.permissions.map(rp => rp.permission.code) || [];
    const roleName = result.adminUser.role?.name || 'Admin';

    // Generate JWT token
    const token = generateToken({
      userId: result.adminUser.id,
      email: result.adminUser.email,
      userName: result.adminUser.userName,
      companyId: result.adminUser.companyId,
      role: roleName,
      roleId: result.adminUser.roleId,
      permissions
    });

    // Return success response
    res.status(201).json({
      message: 'Company onboarded successfully',
      company: {
        id: result.company.id,
        companyName: result.company.companyName
      },
      user: {
        id: result.adminUser.id,
        userName: result.adminUser.userName,
        email: result.adminUser.email,
        role: roleName,
        roleId: result.adminUser.roleId,
        permissions,
        companyId: result.adminUser.companyId,
        company: result.adminUser.company
      },
      token
    });

  } catch (error: unknown) {
    console.error('❌ Onboarding error:', error);
    res.status(500).json({
      error: 'Onboarding failed',
      detail: error instanceof Error ? error.message : 'Unexpected error occurred'
    });
  }
};
