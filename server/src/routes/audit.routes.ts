import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";
import { getAuditLogs } from "../controllers/audit.controller";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("audit.view"), getAuditLogs);

export default router;
