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
exports.uploadOpeningStockItems = exports.uploadOpeningBalances = exports.uploadSupplierItems = exports.uploadContainerItems = void 0;
const excelParser_1 = require("../utils/excelParser");
const prisma_1 = __importDefault(require("../utils/prisma"));
const XLSX = __importStar(require("xlsx"));
// 🧾 Upload to Container (with optional preview)
const uploadContainerItems = async (req, res) => {
    const containerId = req.params.id;
    const previewMode = req.query.preview === "true";
    if (!req.file) {
        res.status(400).json({ error: "Excel file is required" });
        return;
    }
    const items = (0, excelParser_1.parseExcel)(req.file.buffer);
    const errors = items.filter((item) => !item.itemName || !item.quantity || item.quantity <= 0);
    if (errors.length > 0) {
        res.status(400).json({ error: "Validation failed", invalidItems: errors });
        return;
    }
    if (previewMode) {
        res.json({ preview: true, items });
        return;
    }
    try {
        await prisma_1.default.containerItem.createMany({
            data: items.map((item) => ({
                containerId,
                itemName: item.itemName,
                quantity: item.quantity,
                receivedQty: 0,
                unitPrice: 0,
            })),
        });
        res.status(201).json({ message: "Items uploaded", items });
    }
    catch (err) {
        res.status(500).json({ error: "Failed to save items", detail: err });
    }
};
exports.uploadContainerItems = uploadContainerItems;
// 🧾 Upload to Supplier (adds items to SupplierItem)
const uploadSupplierItems = async (req, res) => {
    const supplierId = req.params.id;
    if (!req.file) {
        res.status(400).json({ error: "Excel file is required" });
        return;
    }
    const items = (0, excelParser_1.parseExcel)(req.file.buffer);
    const validItems = items.filter((item) => item.itemName && item.quantity && item.quantity > 0);
    try {
        await prisma_1.default.supplierItem.createMany({
            data: validItems.map((item) => ({
                supplierId,
                itemName: item.itemName,
                price: item.quantity, // reuse Quantity column as Price for suppliers
            })),
        });
        res
            .status(201)
            .json({ message: "Supplier items uploaded", items: validItems });
    }
    catch (err) {
        res
            .status(500)
            .json({ error: "Failed to save supplier items", detail: err });
    }
};
exports.uploadSupplierItems = uploadSupplierItems;
// 🧾 Upload Opening Balances from Excel
const uploadOpeningBalances = async (req, res) => {
    const file = req.file;
    const companyId = req.user?.companyId;
    if (!file) {
        res.status(400).json({ error: "Excel file is required" });
        return;
    }
    if (!companyId) {
        res.status(400).json({ error: "Missing company context" });
        return;
    }
    try {
        const workbook = XLSX.read(file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        const errors = [];
        for (const row of rows) {
            const name = row.CustomerName?.toString()?.trim();
            const phone = row.Phone?.toString()?.trim();
            const amount = parseFloat(row.Amount?.toString() ?? "");
            if (!name || !phone || isNaN(amount)) {
                errors.push(row);
                continue;
            }
            try {
                // Check or create customer
                let customer = await prisma_1.default.customer.findFirst({
                    where: { customerName: name, phone, companyId },
                });
                if (!customer) {
                    customer = await prisma_1.default.customer.create({
                        data: { customerName: name, phone, companyId },
                    });
                }
                // Check if opening balance already exists
                const existingPayment = await prisma_1.default.customerPayment.findFirst({
                    where: {
                        customerId: customer.id,
                        note: "Opening balance",
                    },
                });
                if (existingPayment) {
                    await prisma_1.default.customerPayment.update({
                        where: { id: existingPayment.id },
                        data: { amount },
                    });
                }
                else {
                    await prisma_1.default.customerPayment.create({
                        data: {
                            customerId: customer.id,
                            amount,
                            note: "Opening balance",
                            companyId,
                        },
                    });
                }
            }
            catch (innerErr) {
                console.error("Row processing error:", innerErr);
                errors.push(row);
            }
        }
        if (errors.length > 0) {
            res.status(207).json({
                message: "Opening balances processed with some errors",
                invalidRows: errors,
            });
        }
        else {
            res
                .status(201)
                .json({ message: "Opening balances uploaded successfully" });
        }
    }
    catch (err) {
        console.error("Upload failed:", err);
        res
            .status(500)
            .json({ error: "Failed to process opening balances", detail: err });
    }
};
exports.uploadOpeningBalances = uploadOpeningBalances;
// POST /upload/opening-stock
/*export const uploadOpeningStockItems = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Excel file is required." });
      return;
    }

    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ error: "Missing company context." });
      return;
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<{
      openingstock: string;
      suppliername: string;
      itemname: string;
      quantity: number;
      price: number;
    }>(sheet);

    let addedItems = 0;
    let skippedItems = 0;
    const failedItems: any[] = [];

    for (const row of rows) {
      const suppliername = row.suppliername?.toString().trim();
      const itemname = row.itemname?.toString().trim();
      const quantity = Number(row.quantity);
      const price = parseFloat(row.price?.toString() ?? "");

      if (!suppliername || !itemname || !quantity || isNaN(quantity)) {
        failedItems.push({ ...row, reason: "Missing or invalid data" });
        continue;
      }

      // 🔍 Find or create supplier
      let supplier = await prisma.supplier.findFirst({
        where: { suppliername, companyId },
      });

      if (!supplier) {
        supplier = await prisma.supplier.create({
          data: {
            suppliername,
            contact: "",
            country: "",
            companyId,
          },
        });
      }

      // 🔍 Check if SupplierItem exists
      const supplierItem = await prisma.supplierItem.findFirst({
        where: { supplierId: supplier.id, itemName: itemname },
      });

      if (!supplierItem) {
        await prisma.supplierItem.create({
          data: {
            supplierId: supplier.id,
            itemName: itemname,
            price: price,
          },
        });
      } else {
        skippedItems++;
        failedItems.push({ ...row, reason: "Supplier item already exists" });
        continue;
      }

      // 🔍 Find or create container with name "openingstock"
      let container = await prisma.container.findFirst({
        where: { containerNo: "openingstock", companyId },
      });

      if (!container) {
        container = await prisma.container.create({
          data: {
            containerNo: "openingstock",
            arrivalDate: new Date(),
            year: new Date().getFullYear(),
            status: "Completed",
            supplierId: supplier.id,
            companyId,
          },
        });
      }

      // 🔍 Check if container item exists already
      const containerItem = await prisma.containerItem.findFirst({
        where: {
          containerId: container.id,
          itemName: itemname,
        },
      });

      if (containerItem) {
        skippedItems++;
        failedItems.push({ ...row, reason: "Item already in container" });
        continue;
      }

      // ✅ Create container item
      await prisma.containerItem.create({
        data: {
          containerId: container.id,
          itemName: itemname,
          quantity,
          receivedQty: quantity,
          soldQty: 0,
          unitPrice: price,
        },
      });

      addedItems++;
    }

    res.status(201).json({
      message: "Opening stock upload completed.",
      addedItems,
      skippedItems,
    });
    return;
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Upload failed." });
    return;
  }
}; */
const uploadOpeningStockItems = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: "Excel file is required." });
            return;
        }
        const companyId = req.user?.companyId;
        if (!companyId) {
            res.status(400).json({ error: "Missing company context." });
            return;
        }
        const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet);
        let addedItems = 0;
        let skippedItems = 0;
        const failedItems = [];
        for (const row of rows) {
            const containerNo = row.openingstock?.toString().trim().toLowerCase() || "openingstock";
            const suppliername = row.suppliername?.toString().trim();
            const itemname = row.itemname?.toString().trim();
            const quantity = Number(row.quantity);
            const price = parseFloat(row.price?.toString() ?? "");
            if (!suppliername || !itemname || !quantity || isNaN(quantity)) {
                failedItems.push({ ...row, reason: "Missing or invalid data" });
                continue;
            }
            // 🔍 Find or create supplier
            let supplier = await prisma_1.default.supplier.findFirst({
                where: { suppliername, companyId },
            });
            if (!supplier) {
                supplier = await prisma_1.default.supplier.create({
                    data: {
                        suppliername,
                        contact: "",
                        country: "",
                        companyId,
                    },
                });
            }
            // 🔍 Check if SupplierItem exists
            const supplierItem = await prisma_1.default.supplierItem.findFirst({
                where: { supplierId: supplier.id, itemName: itemname },
            });
            if (!supplierItem) {
                await prisma_1.default.supplierItem.create({
                    data: {
                        supplierId: supplier.id,
                        itemName: itemname,
                        price: price,
                    },
                });
            }
            else {
                skippedItems++;
                failedItems.push({ ...row, reason: "Supplier item already exists" });
                continue;
            }
            // 🔍 Find or create container for this openingstock group
            let container = await prisma_1.default.container.findFirst({
                where: { containerNo, companyId },
            });
            if (!container) {
                container = await prisma_1.default.container.create({
                    data: {
                        containerNo,
                        arrivalDate: new Date(),
                        year: new Date().getFullYear(),
                        status: "Completed",
                        supplierId: supplier.id, // may not matter for grouped logic
                        companyId,
                    },
                });
            }
            // 🔍 Check if item already added to this container
            const containerItem = await prisma_1.default.containerItem.findFirst({
                where: {
                    containerId: container.id,
                    itemName: itemname,
                },
            });
            if (containerItem) {
                skippedItems++;
                failedItems.push({ ...row, reason: "Item already in container" });
                continue;
            }
            // ✅ Add item to container
            await prisma_1.default.containerItem.create({
                data: {
                    containerId: container.id,
                    itemName: itemname,
                    quantity,
                    receivedQty: quantity,
                    soldQty: 0,
                    unitPrice: price,
                },
            });
            addedItems++;
        }
        res.status(201).json({
            message: "Opening stock upload completed.",
            addedItems,
            skippedItems,
            failedItems,
        });
    }
    catch (error) {
        console.error("Upload failed:", error);
        res.status(500).json({ error: "Upload failed." });
    }
};
exports.uploadOpeningStockItems = uploadOpeningStockItems;
