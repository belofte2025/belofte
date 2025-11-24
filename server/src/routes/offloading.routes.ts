import { Router } from "express";
import {
  getContainerItems,
  updateItemReceivedQty,
  completeOffloading,
} from "../controllers/offloading.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";

const router = Router();
router.use(authenticate);

router.get("/:id/items", getContainerItems);
router.patch("/item/:itemId", requirePermission("containers.edit"), updateItemReceivedQty);
router.post("/:containerId/complete", requirePermission("containers.edit"), completeOffloading);

export default router;
