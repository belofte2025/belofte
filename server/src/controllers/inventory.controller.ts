import { Request, Response } from "express";
import {
  getInventoryByContainer,
  getInventoryBySupplier,
  getInventoryReport,
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

export const inventoryReport = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const report = await getInventoryReport(companyId);
    res.json(report);
  } catch (error) {
    console.error("Error fetching inventory report:", error);
    res.status(500).json({ error: "Failed to fetch inventory report" });
  }
};
