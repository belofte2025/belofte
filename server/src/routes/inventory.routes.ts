import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  inventoryByContainer,
  inventoryBySupplier,
} from "../controllers/inventory.controller";

const router = Router();
router.use(authenticate);

router.get("/container/:id", inventoryByContainer);
router.get("/supplier/:id", inventoryBySupplier);

export default router;
