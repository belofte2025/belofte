import { Request, Response } from "express";
import { parseExcel } from "../utils/excelParser";
import prisma from "../utils/prisma";
import * as XLSX from "xlsx";

// 🧾 Upload to Container (with optional preview)
export const uploadContainerItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  const containerId = req.params.id;
  const previewMode = req.query.preview === "true";

  if (!req.file) {
    res.status(400).json({ error: "Excel file is required" });
    return;
  }

  const items = parseExcel(req.file.buffer);

  const errors = items.filter(
    (item) => !item.itemName || !item.quantity || item.quantity <= 0
  );
  if (errors.length > 0) {
    res.status(400).json({ error: "Validation failed", invalidItems: errors });
    return;
  }

  if (previewMode) {
    res.json({ preview: true, items });
    return;
  }

  try {
    await prisma.containerItem.createMany({
      data: items.map((item) => ({
        containerId,
        itemName: item.itemName,
        quantity: item.quantity,
        receivedQty: 0,
        unitPrice: 0,
      })),
    });
    res.status(201).json({ message: "Items uploaded", items });
  } catch (err) {
    res.status(500).json({ error: "Failed to save items", detail: err });
  }
};

// 🧾 Upload to Supplier (adds items to SupplierItem)
export const uploadSupplierItems = async (
  req: Request,
  res: Response
): Promise<void> => {
  const supplierId = req.params.id;

  if (!req.file) {
    res.status(400).json({ error: "Excel file is required" });
    return;
  }

  const items = parseExcel(req.file.buffer);
  const validItems = items.filter(
    (item) => item.itemName && item.quantity && item.quantity > 0
  );

  try {
    await prisma.supplierItem.createMany({
      data: validItems.map((item) => ({
        supplierId,
        itemName: item.itemName,
        price: item.quantity, // reuse Quantity column as Price for suppliers
      })),
    });
    res
      .status(201)
      .json({ message: "Supplier items uploaded", items: validItems });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to save supplier items", detail: err });
  }
};

// 🧾 Upload Opening Balances from Excel
export const uploadOpeningBalances = async (
  req: Request,
  res: Response
): Promise<void> => {
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

    type OpeningBalanceRow = {
      CustomerName: string;
      Phone: string;
      Amount: number;
    };

    const rows = XLSX.utils.sheet_to_json<OpeningBalanceRow>(sheet);

    const errors: OpeningBalanceRow[] = [];

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
        let customer = await prisma.customer.findFirst({
          where: { customerName: name, phone, companyId },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: { customerName: name, phone, companyId },
          });
        }

        // Check if opening balance already exists
        const existingPayment = await prisma.customerPayment.findFirst({
          where: {
            customerId: customer.id,
            note: "Opening balance",
          },
        });

        if (existingPayment) {
          await prisma.customerPayment.update({
            where: { id: existingPayment.id },
            data: { amount },
          });
        } else {
          await prisma.customerPayment.create({
            data: {
              customerId: customer.id,
              amount,
              note: "Opening balance",
              companyId,
            },
          });
        }
      } catch (innerErr) {
        console.error("Row processing error:", innerErr);
        errors.push(row);
      }
    }

    if (errors.length > 0) {
      res.status(207).json({
        message: "Opening balances processed with some errors",
        invalidRows: errors,
      });
    } else {
      res
        .status(201)
        .json({ message: "Opening balances uploaded successfully" });
    }
  } catch (err) {
    console.error("Upload failed:", err);
    res
      .status(500)
      .json({ error: "Failed to process opening balances", detail: err });
  }
};

// 🧾 Upload Opening Stock Items
export const uploadOpeningStockItems = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "Excel file is required." });
      return;
    }

    const companyId = req.user?.companyId;
    if (!companyId) {
      res.status(400).json({ error: "Company ID is missing." });
      return;
    }

    // Parse Excel
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet);

    let addedItems = 0;
    let skippedItems = 0;
    const failedItems: any[] = [];

    for (const row of data) {
      const suppliername = (row as any).suppliername?.toString()?.trim();
      const itemname = (row as any).itemname?.toString()?.trim();
      const quantity = parseInt((row as any).quantity?.toString() || "0");
      const price = parseFloat((row as any).price?.toString() || "0");
      const containerNo = (row as any).containerNo?.toString()?.trim() || "OPENING_STOCK";

      if (!suppliername || !itemname || !quantity || isNaN(quantity)) {
        failedItems.push({ row, reason: "Missing required fields" });
        continue;
      }

      // Find supplier
      const supplier = await prisma.supplier.findFirst({
        where: { suppliername, companyId },
      });

      if (!supplier) {
        failedItems.push({ row, reason: "Supplier not found" });
        continue;
      }

      // Check if supplier item exists
      const supplierItem = await prisma.supplierItem.findFirst({
        where: { supplierId: supplier.id, itemName: itemname },
      });

      if (!supplierItem) {
        // Create supplier item
        await prisma.supplierItem.create({
          data: {
            supplierId: supplier.id,
            itemName: itemname,
            price: price,
          },
        });
      } else {
        skippedItems++;
        failedItems.push({ row, reason: "Supplier item already exists" });
        continue;
      }

      // 🔍 Find or create container for this openingstock group
      let container = await prisma.container.findFirst({
        where: { containerNo, companyId },
      });

      if (!container) {
        container = await prisma.container.create({
          data: {
            containerNo,
            arrivalDate: new Date(),
            year: new Date().getFullYear(),
            status: "Completed",
            supplierId: supplier.id,
            companyId,
          },
        });
      }

      // 🔍 Check if item already added to this container
      const containerItem = await prisma.containerItem.findFirst({
        where: {
          containerId: container.id,
          itemName: itemname,
        },
      });

      if (containerItem) {
        skippedItems++;
        failedItems.push({ row, reason: "Item already in container" });
        continue;
      }

      // ✅ Add item to container
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
      failedItems,
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Upload failed." });
  }
};