"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logActivity = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const logActivity = async (userId, actionType, entityType, entityId, description) => {
    await prisma_1.default.auditLog.create({
        data: {
            userId,
            actionType,
            entityType,
            entityId,
            description,
        },
    });
};
exports.logActivity = logActivity;
