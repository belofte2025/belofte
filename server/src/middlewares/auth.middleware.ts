import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../utils/prisma";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        companyId: string;
        role: string;
        roleId?: string | null;
        permissions?: string[];
        isSuperAdmin?: boolean;
      };
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      companyId: string;
      email: string;
      role: string;
      roleId?: string | null;
      permissions?: string[];
      isSuperAdmin?: boolean;
    };

    // Optional: Validate user still exists in DB
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      res.status(401).json({ error: "Unauthorized: User not found" });
      return;
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      companyId: decoded.companyId,
      role: decoded.role,
      roleId: decoded.roleId,
      permissions: decoded.permissions || [],
      isSuperAdmin: decoded.isSuperAdmin || false,
    };

    next();
  } catch (err) {
    console.error("JWT error:", err);
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};

export const requireSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      companyId: string;
      email: string;
      role: string;
      isSuperAdmin?: boolean;
    };
    if (!decoded.isSuperAdmin) {
      res.status(403).json({ error: "Super admin access required" });
      return;
    }
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      companyId: decoded.companyId || "",
      role: "superadmin",
      isSuperAdmin: true,
    };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized: Invalid token" });
  }
};
