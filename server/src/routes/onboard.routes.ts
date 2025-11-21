import { Router } from 'express';
import { onboardCompany } from '../controllers/onboard.controller';

const router = Router();

/**
 * @route   POST /api/onboard
 * @desc    Onboard a new company with admin user (public, no auth required)
 * @access  Public
 */
router.post('/', onboardCompany);

export default router;
