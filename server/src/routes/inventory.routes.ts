import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";
import {
  inventoryByContainer,
  inventoryBySupplier,
  inventoryReport,
} from "../controllers/inventory.controller";

const router = Router();
router.use(authenticate);
router.use(requirePermission("reports.view")); // All inventory routes require reports.view permission

router.get("/report", inventoryReport);
router.get("/container/:id", inventoryByContainer);
router.get("/supplier/:id", inventoryBySupplier);

export default router;
