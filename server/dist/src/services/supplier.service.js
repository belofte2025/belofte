"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSupplierItemsById = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getSupplierItemsById = async (supplierId) => {
    return prisma_1.default.supplierItem.findMany({ where: { supplierId } });
};
exports.getSupplierItemsById = getSupplierItemsById;
