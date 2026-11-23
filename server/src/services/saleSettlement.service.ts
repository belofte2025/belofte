import prisma from "../utils/prisma";

/**
 * How much of each credit sale has actually been settled.
 *
 * Payments are recorded against the customer, not against an invoice —
 * CustomerPayment carries no saleId — so a sale's own amountPaid only ever
 * holds the deposit taken at the till. A customer who later pays half an
 * invoice leaves no mark on it, and every report goes on calling the whole
 * amount outstanding.
 *
 * Rather than ask tellers to pay off named invoices, which is not how this
 * trade works, settlement is derived: a customer's payments are applied to
 * what they owe oldest first, the way a statement is read. That gives every
 * invoice a settled figure and a status without changing how anyone works.
 *
 * Opening balances (CustomerDebt) are debts too, and older than any sale
 * recorded in the system, so they are consumed first.
 */

export type SettlementStatus = "paid" | "part-paid" | "unpaid";

export interface SaleSettlement {
  saleId: string;
  totalAmount: number;
  /** Deposit taken when the sale was made. */
  deposit: number;
  /** Deposit plus whatever later payments reach this invoice. */
  settled: number;
  outstanding: number;
  status: SettlementStatus;
}

const UNPAID_DEBT_STATUSES = ["unpaid", "partial"];
/** Figures are money; ignore differences below a pesewa. */
const EPSILON = 0.005;

const statusFor = (total: number, settled: number): SettlementStatus => {
  if (settled >= total - EPSILON) return "paid";
  if (settled > EPSILON) return "part-paid";
  return "unpaid";
};

/**
 * Settlement for every credit sale of one customer.
 *
 * A cash sale is settled by definition and is not included: it was paid when
 * it was made.
 */
interface CreditSaleRow {
  id: string;
  totalAmount: number;
  amountPaid: number;
}

/**
 * Applies one customer's payments to their credit sales, oldest first. Pure:
 * the callers differ only in how they fetch, so the rule lives in one place.
 */
const allocate = (
  sales: CreditSaleRow[],
  openingTotal: number,
  paymentsTotal: number
): Map<string, SaleSettlement> => {
  // Opening balances are older than anything recorded here, so they take the
  // first call on what has been paid.
  let pot = Math.max(0, paymentsTotal - openingTotal);

  const result = new Map<string, SaleSettlement>();

  for (const sale of sales) {
    const deposit = Math.min(Math.max(0, sale.amountPaid ?? 0), sale.totalAmount);
    const stillOwed = Math.max(0, sale.totalAmount - deposit);
    const applied = Math.min(pot, stillOwed);
    pot -= applied;

    const settled = deposit + applied;
    result.set(sale.id, {
      saleId: sale.id,
      totalAmount: sale.totalAmount,
      deposit,
      settled,
      outstanding: Math.max(0, sale.totalAmount - settled),
      status: statusFor(sale.totalAmount, settled),
    });
  }

  return result;
};

export const settleCustomerSales = async (
  customerId: string,
  companyId: string
): Promise<Map<string, SaleSettlement>> => {
  const [sales, debts, payments] = await Promise.all([
    prisma.sale.findMany({
      where: { customerId, companyId, saleType: "credit" },
      select: { id: true, totalAmount: true, amountPaid: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customerDebt.aggregate({
      where: { customerId, companyId, status: { in: UNPAID_DEBT_STATUSES } },
      _sum: { amount: true },
    }),
    prisma.customerPayment.aggregate({
      where: { customerId, companyId },
      _sum: { amount: true },
    }),
  ]);

  return allocate(sales, debts._sum.amount ?? 0, payments._sum.amount ?? 0);
};

/**
 * The same, for a set of sales that may span many customers — the shape the
 * sales reports need. Sales are grouped by customer so each customer's
 * payments are applied once, across all of their invoices.
 */
export const settleSales = async (
  saleIds: string[],
  companyId: string
): Promise<Map<string, SaleSettlement>> => {
  if (saleIds.length === 0) return new Map();

  const sales = await prisma.sale.findMany({
    where: { id: { in: saleIds }, companyId, saleType: "credit" },
    select: { id: true, customerId: true },
  });

  const customerIds = [
    ...new Set(sales.map((s) => s.customerId).filter((id): id is string => !!id)),
  ];
  if (customerIds.length === 0) return new Map();

  // Three queries for the whole report. Fetching per customer meant three
  // round trips each, which on a year of sales across a hundred-odd customers
  // took the report from seconds to minutes.
  const [allSales, debtTotals, paymentTotals] = await Promise.all([
    prisma.sale.findMany({
      where: { customerId: { in: customerIds }, companyId, saleType: "credit" },
      select: { id: true, customerId: true, totalAmount: true, amountPaid: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.customerDebt.groupBy({
      by: ["customerId"],
      where: { customerId: { in: customerIds }, companyId, status: { in: UNPAID_DEBT_STATUSES } },
      _sum: { amount: true },
    }),
    prisma.customerPayment.groupBy({
      by: ["customerId"],
      where: { customerId: { in: customerIds }, companyId },
      _sum: { amount: true },
    }),
  ]);

  const openingByCustomer = new Map(debtTotals.map((d) => [d.customerId, d._sum.amount ?? 0]));
  const paidByCustomer = new Map(paymentTotals.map((p) => [p.customerId, p._sum.amount ?? 0]));

  const salesByCustomer = new Map<string, CreditSaleRow[]>();
  for (const sale of allSales) {
    if (!sale.customerId) continue;
    const bucket = salesByCustomer.get(sale.customerId);
    if (bucket) bucket.push(sale);
    else salesByCustomer.set(sale.customerId, [sale]);
  }

  const wanted = new Set(saleIds);
  const merged = new Map<string, SaleSettlement>();
  for (const [customerId, customerSales] of salesByCustomer) {
    const perCustomer = allocate(
      customerSales,
      openingByCustomer.get(customerId) ?? 0,
      paidByCustomer.get(customerId) ?? 0
    );
    for (const [saleId, settlement] of perCustomer) {
      // Only the sales that were asked for.
      if (wanted.has(saleId)) merged.set(saleId, settlement);
    }
  }

  return merged;
};
