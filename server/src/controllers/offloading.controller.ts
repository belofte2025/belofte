import { Request, Response } from "express";
import prisma from "../utils/prisma";

export const getContainerItems = async (req: Request, res: Response) => {
  const { id } = req.params; // containerId
  const items = await prisma.containerItem.findMany({
    where: { containerId: id },
  });
  res.json(items);
};

export const updateItemReceivedQty = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { receivedQty } = req.body;

  try {
    const updated = await prisma.containerItem.update({
      where: { id: itemId },
      data: { receivedQty },
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: "Failed to update received quantity" });
  }
};

export const completeOffloading = async (req: Request, res: Response) => {
  const { containerId } = req.params;

  try {
    const container = await prisma.container.update({
      where: { id: containerId },
      data: { status: "Completed" },
    });
    res.json({ message: "Container offloading completed", container });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark container as completed" });
  }
};
