"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const onboard_controller_1 = require("../controllers/onboard.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/onboard
 * @desc    Onboard a new company with admin user (public, no auth required)
 * @access  Public
 */
router.post('/', onboard_controller_1.onboardCompany);
exports.default = router;
