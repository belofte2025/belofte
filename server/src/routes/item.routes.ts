import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";
import {
  getSupplierItemStatistics,
  mergeDuplicateItems,
} from "../controllers/item.controller";

const router = Router();
router.use(authenticate);

// Get item statistics for a supplier (for deduplication)
router.get(
  "/supplier/:supplierId/statistics",
  requirePermission("items.view"),
  getSupplierItemStatistics
);

// Merge duplicate items
router.post(
  "/merge-duplicates",
  requirePermission("items.deduplicate"),
  mergeDuplicateItems
);

export default router;
