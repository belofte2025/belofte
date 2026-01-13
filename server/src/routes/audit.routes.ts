import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { requirePermission } from "../middlewares/authorizePermission";
import { getAuditLogs, getAuditStats, getEntityAuditHistory } from "../controllers/audit.controller";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("audit.view"), getAuditLogs);
router.get("/stats", requirePermission("audit.view"), getAuditStats);
router.get("/entity/:entityType/:entityId", requirePermission("audit.view"), getEntityAuditHistory);

export default router;
