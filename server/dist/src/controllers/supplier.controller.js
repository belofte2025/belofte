"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listSupplierItemsWithSales = exports.getSupplierslist = exports.deleteSupplierItem = exports.updateSupplierItem = exports.getSupplierItems = exports.addMultipleSupplierItems = exports.addSupplierItem = exports.deleteSupplier = exports.updateSupplier = exports.getSupplierById = exports.getSuppliers = exports.createSupplier = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
// ------------------------------
// SUPPLIERS
// ------------------------------
const createSupplier = async (req, res) => {
    try {
        const { suppliername, contact, country } = req.body;
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: "Company ID is missing" });
            return;
        }
        if (!suppliername || !contact || !country) {
            res.status(400).json({ error: "All fields are required" });
            return;
        }
        // Check for existing supplier with same name under the same company
        const existingSupplier = await prisma_1.default.supplier.findFirst({
            where: {
                suppliername: suppliername,
                companyId: companyId,
            },
        });
        if (existingSupplier) {
            res.status(409).json({
                error: "Supplier with this name already exists.",
            });
            return;
        }
        const supplier = await prisma_1.default.supplier.create({
            data: { suppliername, contact, country, companyId },
        });
        res.status(201).json(supplier);
        return;
    }
    catch (err) {
        console.error("Failed to create supplier:", err);
        res.status(500).json({
            error: "Failed to create supplier",
            detail: err instanceof Error ? err.message : err,
        });
        return;
    }
};
exports.createSupplier = createSupplier;
const getSuppliers = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: "Company ID is missing" });
            return;
        }
        const suppliers = await prisma_1.default.supplier.findMany({
            where: { companyId },
            include: { items: true },
        });
        res.json(suppliers);
    }
    catch (err) {
        console.error("Failed to fetch suppliers:", err);
        res.status(500).json({ error: "Failed to load suppliers" });
    }
};
exports.getSuppliers = getSuppliers;
const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user?.companyId;
        const supplier = await prisma_1.default.supplier.findFirst({
            where: { id, companyId },
            include: { items: true },
        });
        if (!supplier) {
            res.status(404).json({ error: "Supplier not found" });
            return;
        }
        res.json(supplier);
    }
    catch (err) {
        console.error("Failed to fetch supplier:", err);
        res.status(500).json({ error: "Failed to load supplier" });
    }
};
exports.getSupplierById = getSupplierById;
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { suppliername, contact, country } = req.body;
        const supplier = await prisma_1.default.supplier.update({
            where: { id },
            data: { suppliername, contact, country },
        });
        res.json(supplier);
    }
    catch (err) {
        console.error("Failed to update supplier:", err);
        res.status(400).json({ error: "Failed to update supplier", detail: err });
    }
};
exports.updateSupplier = updateSupplier;
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.supplier.delete({ where: { id } });
        res.json({ message: "Supplier deleted" });
    }
    catch (err) {
        console.error("Failed to delete supplier:", err);
        res.status(400).json({ error: "Failed to delete supplier", detail: err });
    }
};
exports.deleteSupplier = deleteSupplier;
// ------------------------------
// SUPPLIER ITEMS
// ------------------------------
const addSupplierItem = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const { itemName, price } = req.body;
        const item = await prisma_1.default.supplierItem.create({
            data: {
                supplierId,
                itemName,
                price,
            },
        });
        res.status(201).json(item);
    }
    catch (err) {
        console.error("Failed to add supplier item:", err);
        res.status(400).json({ error: "Failed to add supplier item", detail: err });
    }
};
exports.addSupplierItem = addSupplierItem;
const addMultipleSupplierItems = async (req, res) => {
    try {
        const { supplierId } = req.params;
        const { items } = req.body; // [{ itemName, price }, ...]
        const created = await prisma_1.default.supplierItem.createMany({
            data: items.map((item) => ({ ...item, supplierId })),
        });
        res.status(201).json({ count: created.count });
    }
    catch (err) {
        console.error("Failed to add multiple supplier items:", err);
        res.status(400).json({ error: "Failed to add items", detail: err });
    }
};
exports.addMultipleSupplierItems = addMultipleSupplierItems;
const getSupplierItems = async (req, res) => {
    try {
        const { id: supplierId } = req.params;
        const companyId = req.user?.companyId;
        const supplier = await prisma_1.default.supplier.findFirst({
            where: { id: supplierId, companyId },
        });
        if (!supplier) {
            res.status(404).json({ error: "Supplier not found" });
            return;
        }
        const items = await prisma_1.default.supplierItem.findMany({
            where: { supplierId },
            select: {
                id: true,
                itemName: true,
                price: true,
            },
            orderBy: { itemName: "asc" },
        });
        res.json(items);
    }
    catch (err) {
        console.error("Error fetching supplier items:", err);
        res.status(500).json({ error: "Failed to fetch supplier items" });
    }
};
exports.getSupplierItems = getSupplierItems;
const updateSupplierItem = async (req, res) => {
    try {
        const { id } = req.params;
        const { itemName, price } = req.body;
        const item = await prisma_1.default.supplierItem.update({
            where: { id },
            data: { itemName, price },
        });
        res.json(item);
    }
    catch (err) {
        console.error("Failed to update supplier item:", err);
        res.status(400).json({ error: "Failed to update item", detail: err });
    }
};
exports.updateSupplierItem = updateSupplierItem;
const deleteSupplierItem = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma_1.default.supplierItem.delete({ where: { id } });
        res.json({ message: "Item deleted" });
    }
    catch (err) {
        console.error("Failed to delete supplier item:", err);
        res.status(400).json({ error: "Failed to delete item", detail: err });
    }
};
exports.deleteSupplierItem = deleteSupplierItem;
const getSupplierslist = async (req, res) => {
    try {
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: "Company ID is missing" });
            return;
        }
        const suppliers = await prisma_1.default.supplier.findMany({
            where: { companyId },
            orderBy: { suppliername: "asc" },
        });
        res.json(suppliers);
    }
    catch (err) {
        console.error("Failed to fetch suppliers:", err);
        res.status(500).json({ error: "Failed to load suppliers" });
    }
};
exports.getSupplierslist = getSupplierslist;
const listSupplierItemsWithSales = async (req, res) => {
    try {
        // Step 1: Fetch all supplier items with supplier info
        const supplierItems = await prisma_1.default.supplierItem.findMany({
            include: {
                supplier: true,
            },
        });
        // Step 2: Get all unique itemName/supplierId pairs
        const supplierItemMap = supplierItems.map((item) => ({
            id: item.id,
            itemName: item.itemName,
            supplierId: item.supplierId,
            supplierName: item.supplier?.suppliername || "Unknown",
            price: item.price,
        }));
        // Step 3: Fetch all relevant container items in bulk
        const allContainerItems = await prisma_1.default.containerItem.findMany({
            include: {
                container: {
                    select: {
                        id: true,
                        supplierId: true,
                        companyId: true,
                    },
                },
            },
        });
        // Step 4: Fetch all sale items in bulk
        const allSaleItems = await prisma_1.default.saleItem.findMany({
            select: {
                itemName: true,
                quantity: true,
                sale: {
                    select: {
                        companyId: true,
                    },
                },
            },
        });
        // Step 5: Compute result per supplier item
        const result = supplierItemMap.map((sItem) => {
            const relatedContainers = allContainerItems.filter((c) => c.itemName === sItem.itemName &&
                c.container?.supplierId === sItem.supplierId);
            const totalQty = relatedContainers.reduce((sum, c) => sum + c.quantity, 0);
            const relatedCompanyIds = relatedContainers.map((c) => c.container?.companyId);
            const relatedSales = allSaleItems.filter((s) => s.itemName === sItem.itemName &&
                relatedCompanyIds.includes(s.sale.companyId));
            const soldQty = relatedSales.reduce((sum, s) => sum + (s.quantity || 0), 0);
            return {
                id: sItem.id,
                itemName: sItem.itemName,
                supplierName: sItem.supplierName,
                quantity: totalQty,
                soldQty,
                remainingQty: totalQty - soldQty,
                price: sItem.price,
            };
        });
        res.json(result);
    }
    catch (error) {
        console.error("Error fetching supplier item sales summary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
exports.listSupplierItemsWithSales = listSupplierItemsWithSales;
