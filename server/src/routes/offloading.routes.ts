import { Router } from "express";
import {
  getContainerItems,
  updateItemReceivedQty,
  completeOffloading,
} from "../controllers/offloading.controller";
import { authenticate } from "../middlewares/auth.middleware";

const router = Router();
router.use(authenticate);

router.get("/:id/items", getContainerItems);
router.patch("/item/:itemId", updateItemReceivedQty);
router.post("/:containerId/complete", completeOffloading);

export default router;
