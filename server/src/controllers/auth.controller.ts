import { Request, Response } from "express";
import bcrypt from "bcrypt";
import prisma from "../utils/prisma";
import { generateToken } from "../utils/jwt";

// 🔐 REGISTER
export const register = async (req: Request, res: Response) => {
  try {
    const { userName, email, password, role, companyId } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { userName, email, role, password: hashedPassword, companyId },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      userName: user.userName,
      companyId: user.companyId,
      role: user.role,
    });

    res.status(201).json({ user, token });
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
        company: {
          select: {
            companyName: true,
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      userName: user.userName,
      companyId: user.companyId,
      role: user.role,
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        role: user.role,
        companyId: user.companyId,
        company: user.company,
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
    const userId = req.user?.id; // Changed from req.user.userId
    
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