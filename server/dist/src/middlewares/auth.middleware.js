"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Unauthorized: Missing Bearer token" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Optional: Validate user still exists in DB
        const user = await prisma_1.default.user.findUnique({
            where: { id: decoded.userId },
        });
        if (!user) {
            res.status(401).json({ error: "Unauthorized: User not found" });
            return;
        }
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            companyId: decoded.companyId,
            role: decoded.role,
        };
        next();
    }
    catch (err) {
        console.error("JWT error:", err);
        res.status(401).json({ error: "Unauthorized: Invalid token" });
    }
};
exports.authenticate = authenticate;
