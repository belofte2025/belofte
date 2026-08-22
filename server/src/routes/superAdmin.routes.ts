import { Router } from "express";
import { requireSuperAdmin } from "../middlewares/auth.middleware";
import {
  superAdminLogin,
  getPlatformStats,
  getAllCompanies,
  getCompanyDetail,
  toggleSuspend,
  impersonateCompany,
} from "../controllers/superAdmin.controller";

const router = Router();

// Public — no auth needed
router.post("/login", superAdminLogin);

// All routes below require a valid super-admin JWT
router.use(requireSuperAdmin);

router.get("/stats", getPlatformStats);
router.get("/companies", getAllCompanies);
router.get("/companies/:id", getCompanyDetail);
router.put("/companies/:id/suspend", toggleSuspend);
router.post("/companies/:id/impersonate", impersonateCompany);

export default router;
