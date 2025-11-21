"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const jwt_1 = require("../utils/jwt");
// 🔐 REGISTER
const register = async (req, res) => {
    try {
        const { userName, email, password, roleId, companyId } = req.body;
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // If no roleId provided, assign default role for the company
        let finalRoleId = roleId;
        if (!finalRoleId) {
            const defaultRole = await prisma_1.default.role.findFirst({
                where: {
                    companyId,
                    isDefault: true
                }
            });
            finalRoleId = defaultRole?.id || null;
        }
        const user = await prisma_1.default.user.create({
            data: {
                userName,
                email,
                roleId: finalRoleId,
                password: hashedPassword,
                companyId
            },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                },
                company: {
                    select: {
                        companyName: true
                    }
                }
            }
        });
        // Extract permission codes from role
        const permissions = user.role?.permissions.map(rp => rp.permission.code) || [];
        const roleName = user.role?.name || 'user';
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            userName: user.userName,
            companyId: user.companyId,
            role: roleName,
            roleId: user.roleId,
            permissions,
        });
        res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                userName: user.userName,
                role: roleName,
                roleId: user.roleId,
                permissions,
                companyId: user.companyId,
                company: user.company,
            },
            token
        });
    }
    catch (err) {
        console.error("❌ Registration error:", err);
        res.status(400).json({
            error: "Registration failed",
            detail: err?.message || "Unexpected error",
        });
    }
};
exports.register = register;
// 🔐 LOGIN
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({
            where: { email },
            include: {
                company: {
                    select: {
                        companyName: true,
                    },
                },
                role: {
                    include: {
                        permissions: {
                            include: {
                                permission: true
                            }
                        }
                    }
                }
            },
        });
        if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        // Extract permission codes from role
        const permissions = user.role?.permissions.map(rp => rp.permission.code) || [];
        const roleName = user.role?.name || 'user';
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            userName: user.userName,
            companyId: user.companyId,
            role: roleName,
            roleId: user.roleId,
            permissions,
        });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                userName: user.userName,
                role: roleName,
                roleId: user.roleId,
                permissions,
                companyId: user.companyId,
                company: user.company,
            },
            token,
        });
    }
    catch (err) {
        console.error("❌ Login error:", err);
        res.status(500).json({ error: "Login failed" });
    }
};
exports.login = login;
// 🔐 UPDATE PASSWORD
const updatePassword = async (req, res) => {
    try {
        const userId = req.user?.id; // Changed from req.user.userId
        if (!userId) {
            res.status(401).json({ error: "Unauthorized" });
            return;
        }
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            res.status(400).json({ error: "Current password and new password are required" });
            return;
        }
        if (newPassword.length < 6) {
            res.status(400).json({ error: "New password must be at least 6 characters long" });
            return;
        }
        // Find user
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }
        // Verify current password
        const isPasswordValid = await bcrypt_1.default.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ error: "Current password is incorrect" });
            return;
        }
        // Hash new password
        const hashedNewPassword = await bcrypt_1.default.hash(newPassword, 10);
        // Update password
        await prisma_1.default.user.update({
            where: { id: userId },
            data: { password: hashedNewPassword },
        });
        res.json({ message: "Password updated successfully" });
    }
    catch (err) {
        console.error("❌ Password update error:", err);
        res.status(500).json({ error: "Password update failed" });
    }
};
exports.updatePassword = updatePassword;
