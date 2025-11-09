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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importSuppliers = exports.importCustomers = void 0;
const prisma_1 = __importDefault(require("../utils/prisma"));
const XLSX = __importStar(require("xlsx"));
const importCustomers = async (req, res) => {
    const companyId = req.user?.companyId;
    if (!req.file) {
        res.status(400).json({ error: "Excel file is required" });
        return;
    }
    if (!companyId) {
        res.status(400).json({ error: "Company ID is required" });
        return;
    }
    const result = {
        success: false,
        message: "",
        details: {
            customers: { created: 0, errors: [] },
            balances: { created: 0, errors: [] },
        },
    };
    try {
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        // 1. PROCESS CUSTOMERS - BATCH INSERT
        if (workbook.SheetNames.includes("Customers")) {
            const customersSheet = workbook.Sheets["Customers"];
            const customersData = XLSX.utils.sheet_to_json(customersSheet);
            // Validate and prepare data
            const validCustomers = [];
            for (const row of customersData) {
                const customerName = row.customerName?.toString()?.trim();
                const phone = row.phone?.toString()?.trim();
                if (!customerName || !phone) {
                    result.details.customers.errors.push(`Invalid data: ${JSON.stringify(row)}`);
                    continue;
                }
                validCustomers.push({ customerName, phone });
            }
            // Batch check for existing customers
            const existingCustomers = await prisma_1.default.customer.findMany({
                where: {
                    companyId,
                    customerName: {
                        in: validCustomers.map((c) => c.customerName),
                    },
                },
                select: { customerName: true },
            });
            const existingNames = new Set(existingCustomers.map((c) => c.customerName));
            // Filter out existing customers
            const customersToCreate = validCustomers.filter((c) => !existingNames.has(c.customerName));
            // Batch create customers
            if (customersToCreate.length > 0) {
                try {
                    await prisma_1.default.customer.createMany({
                        data: customersToCreate.map((c) => ({
                            customerName: c.customerName,
                            phone: c.phone,
                            companyId,
                        })),
                        skipDuplicates: true,
                    });
                    result.details.customers.created = customersToCreate.length;
                }
                catch (error) {
                    result.details.customers.errors.push(`Batch create error: ${error}`);
                }
            }
        }
        // 2. PROCESS OPENING BALANCES - BATCH INSERT
        if (workbook.SheetNames.includes("Opening Balances")) {
            const balancesSheet = workbook.Sheets["Opening Balances"];
            const balancesData = XLSX.utils.sheet_to_json(balancesSheet);
            // Validate data
            const validBalances = [];
            for (const row of balancesData) {
                const customerName = row.customerName?.toString()?.trim();
                const amount = parseFloat(row.amount?.toString() || "0");
                const notes = row.notes?.toString()?.trim();
                if (!customerName || isNaN(amount) || amount <= 0) {
                    result.details.balances.errors.push(`Invalid data: ${JSON.stringify(row)}`);
                    continue;
                }
                validBalances.push({ customerName, amount, notes });
            }
            // Batch get all customers
            const customers = await prisma_1.default.customer.findMany({
                where: {
                    companyId,
                    customerName: {
                        in: validBalances.map((b) => b.customerName),
                    },
                },
            });
            const customerMap = new Map(customers.map((c) => [c.customerName, c]));
            // Get customer IDs for existing balances check
            const customerIds = customers.map((c) => c.id);
            // Batch check existing balances
            const existingBalances = await prisma_1.default.customerDebt.findMany({
                where: {
                    customerId: { in: customerIds },
                    description: "Opening Balance",
                    debtType: "opening_balance",
                },
                select: { customerId: true },
            });
            const existingBalanceCustomerIds = new Set(existingBalances.map((b) => b.customerId));
            // Prepare balances to create
            const balancesToCreate = [];
            for (const balance of validBalances) {
                const customer = customerMap.get(balance.customerName);
                if (!customer) {
                    result.details.balances.errors.push(`Customer not found: ${balance.customerName}`);
                    continue;
                }
                if (existingBalanceCustomerIds.has(customer.id)) {
                    continue; // Skip if balance already exists
                }
                balancesToCreate.push({
                    customerId: customer.id,
                    companyId,
                    amount: balance.amount,
                    description: balance.notes || "Opening Balance",
                    debtType: "opening_balance",
                    status: "unpaid",
                });
            }
            // Batch create balances
            if (balancesToCreate.length > 0) {
                try {
                    await prisma_1.default.customerDebt.createMany({
                        data: balancesToCreate,
                        skipDuplicates: true,
                    });
                    result.details.balances.created = balancesToCreate.length;
                }
                catch (error) {
                    result.details.balances.errors.push(`Batch create error: ${error}`);
                }
            }
        }
        const totalCreated = result.details.customers.created + result.details.balances.created;
        const totalErrors = result.details.customers.errors.length +
            result.details.balances.errors.length;
        result.success = totalCreated > 0;
        result.message = `Import completed: ${totalCreated} records created${totalErrors > 0 ? `, ${totalErrors} errors` : ""}`;
        res.status(result.success ? 200 : 207).json(result);
    }
    catch (error) {
        console.error("Customer import failed:", error);
        result.success = false;
        result.message = "Import failed due to unexpected error";
        res.status(500).json(result);
    }
};
exports.importCustomers = importCustomers;
const importSuppliers = async (req, res) => {
    const companyId = req.user?.companyId;
    if (!req.file) {
        res.status(400).json({ error: "Excel file is required" });
        return;
    }
    if (!companyId) {
        res.status(400).json({ error: "Company ID is required" });
        return;
    }
    const result = {
        success: false,
        message: "",
        details: {
            suppliers: { created: 0, errors: [] },
            items: { created: 0, errors: [] },
            stock: { created: 0, errors: [] },
        },
    };
    try {
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        // 1. PROCESS SUPPLIERS - BATCH INSERT
        if (workbook.SheetNames.includes("Suppliers")) {
            const suppliersSheet = workbook.Sheets["Suppliers"];
            const suppliersData = XLSX.utils.sheet_to_json(suppliersSheet);
            const validSuppliers = [];
            for (const row of suppliersData) {
                const supplierName = row.supplierName?.toString()?.trim();
                const contact = row.contact?.toString()?.trim();
                const country = row.country?.toString()?.trim();
                if (!supplierName || !contact || !country) {
                    result.details.suppliers.errors.push(`Invalid data: ${JSON.stringify(row)}`);
                    continue;
                }
                validSuppliers.push({ supplierName, contact, country });
            }
            // Batch check existing suppliers
            const existingSuppliers = await prisma_1.default.supplier.findMany({
                where: {
                    companyId,
                    suppliername: {
                        in: validSuppliers.map((s) => s.supplierName),
                    },
                },
                select: { suppliername: true },
            });
            const existingNames = new Set(existingSuppliers.map((s) => s.suppliername));
            const suppliersToCreate = validSuppliers.filter((s) => !existingNames.has(s.supplierName));
            if (suppliersToCreate.length > 0) {
                try {
                    await prisma_1.default.supplier.createMany({
                        data: suppliersToCreate.map((s) => ({
                            suppliername: s.supplierName,
                            contact: s.contact,
                            country: s.country,
                            companyId,
                        })),
                        skipDuplicates: true,
                    });
                    result.details.suppliers.created = suppliersToCreate.length;
                }
                catch (error) {
                    result.details.suppliers.errors.push(`Batch create error: ${error}`);
                }
            }
        }
        // 2. PROCESS SUPPLIER ITEMS & PRICES - BATCH INSERT
        if (workbook.SheetNames.includes("Items & Prices")) {
            const itemsSheet = workbook.Sheets["Items & Prices"];
            const itemsData = XLSX.utils.sheet_to_json(itemsSheet);
            const validItems = [];
            for (const row of itemsData) {
                const supplierName = row.supplierName?.toString()?.trim();
                const itemName = row.itemName?.toString()?.trim();
                const price = parseFloat(row.price?.toString() || "0");
                if (!supplierName || !itemName || isNaN(price) || price <= 0) {
                    result.details.items.errors.push(`Invalid data: ${JSON.stringify(row)}`);
                    continue;
                }
                validItems.push({ supplierName, itemName, price });
            }
            // Batch get suppliers
            const suppliers = await prisma_1.default.supplier.findMany({
                where: {
                    companyId,
                    suppliername: {
                        in: validItems.map((i) => i.supplierName),
                    },
                },
            });
            const supplierMap = new Map(suppliers.map((s) => [s.suppliername, s]));
            // Get existing items
            const supplierIds = suppliers.map((s) => s.id);
            const existingItems = await prisma_1.default.supplierItem.findMany({
                where: {
                    supplierId: { in: supplierIds },
                },
                select: { supplierId: true, itemName: true },
            });
            const existingItemKeys = new Set(existingItems.map((item) => `${item.supplierId}-${item.itemName}`));
            const itemsToCreate = [];
            for (const item of validItems) {
                const supplier = supplierMap.get(item.supplierName);
                if (!supplier) {
                    result.details.items.errors.push(`Supplier not found: ${item.supplierName}`);
                    continue;
                }
                const itemKey = `${supplier.id}-${item.itemName}`;
                if (existingItemKeys.has(itemKey)) {
                    continue;
                }
                itemsToCreate.push({
                    supplierId: supplier.id,
                    itemName: item.itemName,
                    price: item.price,
                });
            }
            if (itemsToCreate.length > 0) {
                try {
                    await prisma_1.default.supplierItem.createMany({
                        data: itemsToCreate,
                        skipDuplicates: true,
                    });
                    result.details.items.created = itemsToCreate.length;
                }
                catch (error) {
                    result.details.items.errors.push(`Batch create error: ${error}`);
                }
            }
        }
        // 3. PROCESS OPENING STOCK
        if (workbook.SheetNames.includes("Opening Stock")) {
            const stockSheet = workbook.Sheets["Opening Stock"];
            const stockData = XLSX.utils.sheet_to_json(stockSheet);
            const validStock = [];
            for (const row of stockData) {
                const supplierName = row.supplierName?.toString()?.trim();
                const itemName = row.itemName?.toString()?.trim();
                const quantity = parseInt(row.quantity?.toString() || "0");
                const unitPrice = parseFloat(row.unitPrice?.toString() || "0");
                if (!supplierName) {
                    result.details.stock.errors.push(`Missing supplier name for item: ${itemName || 'unknown'}`);
                    continue;
                }
                if (!itemName ||
                    isNaN(quantity) ||
                    quantity <= 0 ||
                    isNaN(unitPrice) ||
                    unitPrice <= 0) {
                    result.details.stock.errors.push(`Invalid data for ${supplierName}: ${JSON.stringify(row)}`);
                    continue;
                }
                validStock.push({ supplierName, itemName, quantity, unitPrice });
            }
            // Group stock by supplier
            const stockBySupplier = new Map();
            for (const stock of validStock) {
                if (!stockBySupplier.has(stock.supplierName)) {
                    stockBySupplier.set(stock.supplierName, []);
                }
                stockBySupplier.get(stock.supplierName).push(stock);
            }
            // Process each supplier's stock
            for (const [supplierName, stocks] of stockBySupplier.entries()) {
                try {
                    // Find supplier
                    const supplier = await prisma_1.default.supplier.findFirst({
                        where: {
                            suppliername: supplierName,
                            companyId,
                        },
                    });
                    if (!supplier) {
                        result.details.stock.errors.push(`Supplier not found: ${supplierName}`);
                        continue;
                    }
                    // Create or get container
                    const containerNo = `OPENING-STOCK-${supplier.suppliername
                        .replace(/\s+/g, "-")
                        .toUpperCase()}`;
                    let container = await prisma_1.default.container.findFirst({
                        where: {
                            containerNo,
                            companyId,
                        },
                    });
                    if (!container) {
                        container = await prisma_1.default.container.create({
                            data: {
                                containerNo,
                                arrivalDate: new Date(),
                                year: new Date().getFullYear(),
                                status: "Received",
                                supplierId: supplier.id,
                                companyId,
                            },
                        });
                    }
                    // Get existing items in container
                    const existingItems = await prisma_1.default.containerItem.findMany({
                        where: {
                            containerId: container.id,
                        },
                        select: { itemName: true },
                    });
                    const existingItemNames = new Set(existingItems.map((item) => item.itemName));
                    // Filter items to create
                    const itemsToCreate = stocks
                        .filter((stock) => !existingItemNames.has(stock.itemName))
                        .map((stock) => ({
                        containerId: container.id,
                        itemName: stock.itemName,
                        quantity: stock.quantity,
                        receivedQty: stock.quantity,
                        unitPrice: stock.unitPrice,
                        soldQty: 0,
                    }));
                    if (itemsToCreate.length > 0) {
                        await prisma_1.default.containerItem.createMany({
                            data: itemsToCreate,
                            skipDuplicates: true,
                        });
                        result.details.stock.created += itemsToCreate.length;
                    }
                }
                catch (error) {
                    result.details.stock.errors.push(`Error processing stock for ${supplierName}: ${error}`);
                }
            }
        }
        const totalCreated = result.details.suppliers.created +
            result.details.items.created +
            result.details.stock.created;
        const totalErrors = result.details.suppliers.errors.length +
            result.details.items.errors.length +
            result.details.stock.errors.length;
        result.success = totalCreated > 0;
        result.message = `Import completed: ${totalCreated} records created${totalErrors > 0 ? `, ${totalErrors} errors` : ""}`;
        res.status(result.success ? 200 : 207).json(result);
    }
    catch (error) {
        console.error("Supplier import failed:", error);
        result.success = false;
        result.message = "Import failed due to unexpected error";
        res.status(500).json(result);
    }
};
exports.importSuppliers = importSuppliers;
