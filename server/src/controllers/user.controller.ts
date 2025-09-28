import { Request, Response } from "express";
import prisma from "../utils/prisma";
import bcrypt from "bcrypt";

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const companyId = req.user?.companyId;

  if (!companyId) {
    res.status(400).json({ error: "Company ID is missing." });
    return;
  }
  const users = await prisma.user.findMany({
    where: { companyId },
    select: {
      id: true,
      userName: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });
  res.json(users);
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userName, email, password, role } = req.body;
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ error: "Company ID is missing." });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { userName, email, password: hashed, role, companyId },
  });

  res.status(201).json({
    id: user.id,
    userName: user.userName,
    email: user.email,
    role: user.role,
  });
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { userName, email, role } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { userName, email, role },
  });

  res.json({
    id: user.id,
    userName: user.userName,
    email: user.email,
    role: user.role,
  });
};
