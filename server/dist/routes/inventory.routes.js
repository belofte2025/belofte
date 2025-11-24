"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorizePermission_1 = require("../middlewares/authorizePermission");
const inventory_controller_1 = require("../controllers/inventory.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
router.use((0, authorizePermission_1.requirePermission)("reports.view")); // All inventory routes require reports.view permission
router.get("/report", inventory_controller_1.inventoryReport);
router.get("/container/:id", inventory_controller_1.inventoryByContainer);
router.get("/supplier/:id", inventory_controller_1.inventoryBySupplier);
exports.default = router;
