"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUser = exports.createUser = exports.listUsers = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const listUsers = async (req, res) => {
    const companyId = req.user?.companyId;
    if (!companyId) {
        res.status(400).json({ error: "Company ID is missing." });
        return;
    }
    const users = await prisma_1.default.user.findMany({
        where: { companyId },
        select: {
            id: true,
            userName: true,
            email: true,
            role: true,
            createdAt: true,
        },
    });
    res.json(users);
};
exports.listUsers = listUsers;
const createUser = async (req, res) => {
    const { userName, email, password, role } = req.body;
    const companyId = req.user?.companyId;
    if (!companyId) {
        res.status(400).json({ error: "Company ID is missing." });
        return;
    }
    const hashed = await bcrypt_1.default.hash(password, 10);
    const user = await prisma_1.default.user.create({
        data: { userName, email, password: hashed, role, companyId },
    });
    res.status(201).json({
        id: user.id,
        userName: user.userName,
        email: user.email,
        role: user.role,
    });
};
exports.createUser = createUser;
const updateUser = async (req, res) => {
    const { id } = req.params;
    const { userName, email, role } = req.body;
    const user = await prisma_1.default.user.update({
        where: { id },
        data: { userName, email, role },
    });
    res.json({
        id: user.id,
        userName: user.userName,
        email: user.email,
        role: user.role,
    });
};
exports.updateUser = updateUser;
