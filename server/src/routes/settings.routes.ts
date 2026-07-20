import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import { getNotificationSettings, updateNotificationSettings } from "../controllers/settings.controller";

const router = Router();
router.use(authenticate);

router.get("/notifications", getNotificationSettings);
router.put("/notifications", updateNotificationSettings);

export default router;
