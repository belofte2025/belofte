import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";
import {
  createCustomerReturn,
  getCustomerReturns,
  getCompanyReturns,
} from "../controllers/customerReturn.controller";

const router = Router();
router.use(authenticate);

router.post("/", requirePermission("sales.create"), createCustomerReturn);
router.get("/", requirePermission("sales.view"), getCompanyReturns);
router.get("/customer/:customerId", requirePermission("sales.view"), getCustomerReturns);

export default router;
