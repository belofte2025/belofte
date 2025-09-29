"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeOffloading = exports.updateItemReceivedQty = exports.getContainerItems = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const getContainerItems = async (req, res) => {
    const { id } = req.params; // containerId
    const items = await prisma_1.default.containerItem.findMany({
        where: { containerId: id },
    });
    res.json(items);
};
exports.getContainerItems = getContainerItems;
const updateItemReceivedQty = async (req, res) => {
    const { itemId } = req.params;
    const { receivedQty } = req.body;
    try {
        const updated = await prisma_1.default.containerItem.update({
            where: { id: itemId },
            data: { receivedQty },
        });
        res.json(updated);
    }
    catch (err) {
        res.status(400).json({ error: "Failed to update received quantity" });
    }
};
exports.updateItemReceivedQty = updateItemReceivedQty;
const completeOffloading = async (req, res) => {
    const { containerId } = req.params;
    try {
        const container = await prisma_1.default.container.update({
            where: { id: containerId },
            data: { status: "Completed" },
        });
        res.json({ message: "Container offloading completed", container });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to mark container as completed" });
    }
};
exports.completeOffloading = completeOffloading;
