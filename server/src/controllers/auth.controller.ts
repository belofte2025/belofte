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
        company: user.company, // will only include { companyName }
      },
      token,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
};
