"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inventoryBySupplier = exports.inventoryByContainer = void 0;
const inventory_service_1 = require("../services/inventory.service");
const inventoryByContainer = async (req, res) => {
    try {
        const report = await (0, inventory_service_1.getInventoryByContainer)(req.params.id);
        res.json(report);
    }
    catch {
        res.status(500).json({ error: "Failed to fetch container inventory" });
    }
};
exports.inventoryByContainer = inventoryByContainer;
const inventoryBySupplier = async (req, res) => {
    try {
        const report = await (0, inventory_service_1.getInventoryBySupplier)(req.params.id);
        res.json(report);
    }
    catch {
        res.status(500).json({ error: "Failed to fetch supplier inventory" });
    }
};
exports.inventoryBySupplier = inventoryBySupplier;
