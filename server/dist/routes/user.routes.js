"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const authorizePermission_1 = require("../middlewares/authorizePermission");
const user_controller_1 = require("../controllers/user.controller");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticate);
/**
 * @route   GET /api/users
 * @desc    Get list of users for the authenticated company
 * @access  Requires users.view permission
 */
router.get("/", (0, authorizePermission_1.requirePermission)("users.view"), user_controller_1.listUsers);
/**
 * @route   POST /api/users
 * @desc    Create a new user
 * @access  Requires users.create permission
 */
router.post("/", (0, authorizePermission_1.requirePermission)("users.create"), user_controller_1.createUser);
/**
 * @route   PUT /api/users/:id
 * @desc    Update an existing user
 * @access  Requires users.edit permission
 */
router.put("/:id", (0, authorizePermission_1.requirePermission)("users.edit"), user_controller_1.updateUser);
/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Requires users.delete permission
 */
router.delete("/:id", (0, authorizePermission_1.requirePermission)("users.delete"), async (req, res) => {
    try {
        const { id } = req.params;
        const prisma = (await Promise.resolve().then(() => __importStar(require("../utils/prisma")))).default;
        await prisma.user.delete({
            where: { id },
        });
        res.json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error("Delete user error:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});
exports.default = router;
