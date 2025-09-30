import { Request, Response } from "express";
import prisma from "../utils/prisma";
import * as XLSX from "xlsx";

interface ImportResult {
  success: boolean;
  message: string;
  details: {
    customers: { created: number; errors: string[] };
    balances: { created: number; errors: string[] };
  };
}

export const importCustomers = async (req: Request, res: Response): Promise<void> => {
  const companyId = req.user?.companyId;
  
  if (!req.file) {
    res.status(400).json({ error: "Excel file is required" });
    return;
  }

  if (!companyId) {
    res.status(400).json({ error: "Company ID is required" });
    return;
  }

  const result: ImportResult = {
    success: false,
    message: "",
    details: {
      customers: { created: 0, errors: [] },
      balances: { created: 0, errors: [] }
    }
  };

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    
    // 1. PROCESS CUSTOMERS
    if (workbook.SheetNames.includes('Customers')) {
      const customersSheet = workbook.Sheets['Customers'];
      const customersData = XLSX.utils.sheet_to_json<{
        customerName: string;
        phone: string;
      }>(customersSheet);

      for (const row of customersData) {
        try {
          const customerName = row.customerName?.toString()?.trim();
          const phone = row.phone?.toString()?.trim();

          if (!customerName || !phone) {
            result.details.customers.errors.push(`Invalid data: ${JSON.stringify(row)}`);
            continue;
          }

          // Check if customer already exists
          const existingCustomer = await prisma.customer.findFirst({
            where: {
              customerName,
              companyId
            }
          });

          if (!existingCustomer) {
            await prisma.customer.create({
              data: {
                customerName,
                phone,
                companyId
              }
            });
            result.details.customers.created++;
          }
        } catch (error) {
          result.details.customers.errors.push(`Error processing customer ${JSON.stringify(row)}: ${error}`);
        }
      }
    }

    // 2. PROCESS OPENING BALANCES
    if (workbook.SheetNames.includes('Opening Balances')) {
      const balancesSheet = workbook.Sheets['Opening Balances'];
      const balancesData = XLSX.utils.sheet_to_json<{
        customerName: string;
        balanceType: string;
        amount: number;
        notes?: string;
      }>(balancesSheet);

      for (const row of balancesData) {
        try {
          const customerName = row.customerName?.toString()?.trim();
          const balanceType = row.balanceType?.toString()?.trim().toLowerCase();
          const amount = parseFloat(row.amount?.toString() || "0");
          const notes = row.notes?.toString()?.trim() || "Opening balance from import";

          if (!customerName || !balanceType || isNaN(amount) || amount <= 0) {
            result.details.balances.errors.push(`Invalid data: ${JSON.stringify(row)}`);
            continue;
          }

          if (balanceType !== 'debit' && balanceType !== 'credit') {
            result.details.balances.errors.push(`Invalid balance type "${balanceType}". Must be "debit" or "credit": ${JSON.stringify(row)}`);
            continue;
          }

          // Find customer
          const customer = await prisma.customer.findFirst({
            where: {
              customerName,
              companyId
            }
          });

          if (!customer) {
            result.details.balances.errors.push(`Customer not found: ${customerName}`);
            continue;
          }

          // Check if opening balance already exists
          const existingBalance = await prisma.customerPayment.findFirst({
            where: {
              customerId: customer.id,
              note: { contains: "Opening balance from import" },
              paymentType: "opening_balance"
            }
          });

          if (!existingBalance) {
            if (balanceType === 'debit') {
              // Customer owes us - create a sale (debit entry)
              await prisma.sale.create({
                data: {
                  customerId: customer.id,
                  companyId,
                  saleType: "Opening Balance",
                  sourceType: "opening_balance",
                  sourceId: "import",
                  totalAmount: amount,
                  items: {
                    create: {
                      itemName: "Opening Balance - Customer Owes",
                      quantity: 1,
                      unitPrice: amount
                    }
                  }
                }
              });
            } else {
              // Customer has credit with us - create a payment (credit entry)
              await prisma.customerPayment.create({
                data: {
                  customerId: customer.id,
                  amount: amount,
                  note: notes,
                  companyId,
                  paymentType: "opening_balance"
                }
              });
            }
            result.details.balances.created++;
          }
        } catch (error) {
          result.details.balances.errors.push(`Error processing balance ${JSON.stringify(row)}: ${error}`);
        }
      }
    }

    const totalCreated = result.details.customers.created + result.details.balances.created;
    const totalErrors = result.details.customers.errors.length + result.details.balances.errors.length;

    result.success = totalCreated > 0;
    result.message = `Import completed: ${totalCreated} records created${totalErrors > 0 ? `, ${totalErrors} errors` : ''}`;

    res.status(result.success ? 200 : 207).json(result);
  } catch (error) {
    console.error("Customer import failed:", error);
    result.success = false;
    result.message = "Import failed due to unexpected error";
    res.status(500).json(result);
  }
};

interface SupplierImportResult {
  success: boolean;
  message: string;
  details: {
    suppliers: { created: number; errors: string[] };
    items: { created: number; errors: string[] };
  };
}

export const importSuppliers = async (req: Request, res: Response): Promise<void> => {
  const companyId = req.user?.companyId;
  
  if (!req.file) {
    res.status(400).json({ error: "Excel file is required" });
    return;
  }

  if (!companyId) {
    res.status(400).json({ error: "Company ID is required" });
    return;
  }

  const result: SupplierImportResult = {
    success: false,
    message: "",
    details: {
      suppliers: { created: 0, errors: [] },
      items: { created: 0, errors: [] }
    }
  };

  try {
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    
    // 1. PROCESS SUPPLIERS
    if (workbook.SheetNames.includes('Suppliers')) {
      const suppliersSheet = workbook.Sheets['Suppliers'];
      const suppliersData = XLSX.utils.sheet_to_json<{
        supplierName: string;
        contact: string;
        country: string;
      }>(suppliersSheet);

      for (const row of suppliersData) {
        try {
          const supplierName = row.supplierName?.toString()?.trim();
          const contact = row.contact?.toString()?.trim();
          const country = row.country?.toString()?.trim();

          if (!supplierName || !contact || !country) {
            result.details.suppliers.errors.push(`Invalid data: ${JSON.stringify(row)}`);
            continue;
          }

          // Check if supplier already exists
          const existingSupplier = await prisma.supplier.findFirst({
            where: {
              suppliername: supplierName,
              companyId
            }
          });

          if (!existingSupplier) {
            await prisma.supplier.create({
              data: {
                suppliername: supplierName,
                contact,
                country,
                companyId
              }
            });
            result.details.suppliers.created++;
          }
        } catch (error) {
          result.details.suppliers.errors.push(`Error processing supplier ${JSON.stringify(row)}: ${error}`);
        }
      }
    }

    // 2. PROCESS SUPPLIER ITEMS & PRICES
    if (workbook.SheetNames.includes('Items & Prices')) {
      const itemsSheet = workbook.Sheets['Items & Prices'];
      const itemsData = XLSX.utils.sheet_to_json<{
        supplierName: string;
        itemName: string;
        price: number;
      }>(itemsSheet);

      for (const row of itemsData) {
        try {
          const supplierName = row.supplierName?.toString()?.trim();
          const itemName = row.itemName?.toString()?.trim();
          const price = parseFloat(row.price?.toString() || "0");

          if (!supplierName || !itemName || isNaN(price) || price <= 0) {
            result.details.items.errors.push(`Invalid data: ${JSON.stringify(row)}`);
            continue;
          }

          // Find supplier
          const supplier = await prisma.supplier.findFirst({
            where: {
              suppliername: supplierName,
              companyId
            }
          });

          if (!supplier) {
            result.details.items.errors.push(`Supplier not found: ${supplierName}`);
            continue;
          }

          // Check if item already exists for this supplier
          const existingItem = await prisma.supplierItem.findFirst({
            where: {
              supplierId: supplier.id,
              itemName
            }
          });

          if (!existingItem) {
            await prisma.supplierItem.create({
              data: {
                supplierId: supplier.id,
                itemName,
                price
              }
            });
            result.details.items.created++;
          }
        } catch (error) {
          result.details.items.errors.push(`Error processing item ${JSON.stringify(row)}: ${error}`);
        }
      }
    }

    const totalCreated = result.details.suppliers.created + result.details.items.created;
    const totalErrors = result.details.suppliers.errors.length + result.details.items.errors.length;

    result.success = totalCreated > 0;
    result.message = `Import completed: ${totalCreated} records created${totalErrors > 0 ? `, ${totalErrors} errors` : ''}`;

    res.status(result.success ? 200 : 207).json(result);
  } catch (error) {
    console.error("Supplier import failed:", error);
    result.success = false;
    result.message = "Import failed due to unexpected error";
    res.status(500).json(result);
  }
};