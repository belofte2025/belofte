"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const jwt_1 = require("../utils/jwt");
// 🔐 REGISTER
const register = async (req, res) => {
    try {
        const { userName, email, password, role, companyId } = req.body;
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        const user = await prisma_1.default.user.create({
            data: { userName, email, role, password: hashedPassword, companyId },
        });
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            userName: user.userName,
            companyId: user.companyId,
            role: user.role,
        });
        res.status(201).json({ user, token });
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
            },
        });
        if (!user || !(await bcrypt_1.default.compare(password, user.password))) {
            res.status(401).json({ error: "Invalid credentials" });
            return;
        }
        const token = (0, jwt_1.generateToken)({
            userId: user.id,
            email: user.email,
            userName: user.userName,
            companyId: user.companyId,
            role: user.role,
        });
        res.json({
            user: {
                id: user.id,
                email: user.email,
                userName: user.userName,
                role: user.role,
                companyId: user.companyId,
                company: user.company, // will only include { companyName }
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
