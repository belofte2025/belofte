import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { generateToken } from "../utils/jwt";
import { logLogin, logCreate, EntityType } from "../utils/auditLogger";

// 🔐 REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { userName, email, password, roleId, companyId } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // If no roleId provided, assign default role for the company
    let finalRoleId = roleId;
    if (!finalRoleId) {
      const defaultRole = await prisma.role.findFirst({
        where: {
          companyId,
          isDefault: true
        }
      });
      finalRoleId = defaultRole?.id || null;
    }

    const user = await prisma.user.create({
      data: {
        userName,
        email,
        roleId: finalRoleId,
        password: hashedPassword,
        companyId
      },
      include: {
        Role: {
          include: {
            RolePermission: {
              include: {
                Permission: true
              }
            }
          }
        },
        Company: {
          select: {
            companyName: true
          }
        }
      }
    });

    // Extract permission codes from role
    const permissions = user.Role?.RolePermission.map(rp => rp.Permission.code) || [];
    const roleName = user.Role?.name || 'user';

    const token = generateToken({
      userId: user.id,
      email: user.email,
      userName: user.userName,
      companyId: user.companyId,
      role: roleName,
      roleId: user.roleId,
      permissions,
    });

    // Log user registration
    await logCreate(user.id, EntityType.USER, user.id, user.userName);

    res.status(201).json({
      User: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        role: roleName,
        roleId: user.roleId,
        permissions,
        companyId: user.companyId,
        company: user.Company,
      },
      token
    });
  } catch (err: any) {
    console.error("❌ Registration error:", err);
    res.status(400).json({
      error: "Registration failed",
      detail: err?.message || "Unexpected error",
    });
  }
};

// 🔐 LOGIN
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        Company: {
          select: {
            companyName: true,
          },
        },
        Role: {
          include: {
            RolePermission: {
              include: {
                Permission: true
              }
            }
          }
        }
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    // Extract permission codes from role
    const permissions = user.Role?.RolePermission.map(rp => rp.Permission.code) || [];
    const roleName = user.Role?.name || 'user';

    const token = generateToken({
      userId: user.id,
      email: user.email,
      userName: user.userName,
      companyId: user.companyId,
      role: roleName,
      roleId: user.roleId,
      permissions,
    });

    // Log successful login
    await logLogin(user.id, user.email);

    res.json({
      User: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        role: roleName,
        roleId: user.roleId,
        permissions,
        companyId: user.companyId,
        company: user.Company,
      },
      token,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};

// 🔐 UPDATE PASSWORD
export const updatePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id; // Changed from req.User.userId
    
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current password and new password are required" });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters long" });
      return;
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("❌ Password update error:", err);
    res.status(500).json({ error: "Password update failed" });
  }
};