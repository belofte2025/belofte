"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorizePermission_1 = require("../middlewares/authorizePermission");
const item_controller_1 = require("../controllers/item.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
// Get item statistics for a supplier (for deduplication)
router.get("/supplier/:supplierId/statistics", (0, authorizePermission_1.requirePermission)("items.view"), item_controller_1.getSupplierItemStatistics);
// Merge duplicate items
router.post("/merge-duplicates", (0, authorizePermission_1.requirePermission)("items.deduplicate"), item_controller_1.mergeDuplicateItems);
exports.default = router;
