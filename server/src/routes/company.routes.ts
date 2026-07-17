import { Router } from "express";
import { authenticate } from "../middlewares/auth.middleware";
import {
  createCompany,
  getCompanies,
  getCompanyById,
  updateCompany,
  deleteCompany,
} from "../controllers/company.controller";

const router = Router();

// POST /companies - public (used during registration)
router.post("/", createCompany);

// All other routes require authentication
router.use(authenticate);

router.get("/", getCompanies);
router.get("/:id", getCompanyById);
router.put("/:id", updateCompany);
router.delete("/:id", deleteCompany);

export default router;
