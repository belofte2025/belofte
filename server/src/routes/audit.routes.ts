import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { authorizeRoles } from "../middlewares/authoriseRole";
import { getAuditLogs } from "../controllers/audit.controller";

const router = Router();
router.use(authenticate);

router.get("/", authorizeRoles("admin"), getAuditLogs);

export default router;
