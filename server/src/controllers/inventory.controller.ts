import { Request, Response } from "express";
import {
  getInventoryByContainer,
  getInventoryBySupplier,
} from "../services/inventory.service";

export const inventoryByContainer = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const report = await getInventoryByContainer(req.params.id);
    res.json(report);
  } catch {
    res.status(500).json({ error: "Failed to fetch container inventory" });
  }
};

export const inventoryBySupplier = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const report = await getInventoryBySupplier(req.params.id);
    res.json(report);
  } catch {
    res.status(500).json({ error: "Failed to fetch supplier inventory" });
  }
};
