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
      roleId: true,
      Role: true,
      createdAt: true,
    },
  });
  res.json(users);
};

export const createUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { userName, email, password, roleId } = req.body;
  const companyId = req.user?.companyId;
  if (!companyId) {
    res.status(400).json({ error: "Company ID is missing." });
    return;
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { userName, email, password: hashed, roleId, companyId },
    include: {
      Role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.status(201).json({
    id: user.id,
    userName: user.userName,
    email: user.email,
    roleId: user.roleId,
    role: user.role,
  });
};

export const updateUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { userName, email, roleId } = req.body;

  const user = await prisma.user.update({
    where: { id },
    data: { userName, email, roleId },
    include: {
      Role: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  res.json({
    id: user.id,
    userName: user.userName,
    email: user.email,
    roleId: user.roleId,
    role: user.role,
  });
};
