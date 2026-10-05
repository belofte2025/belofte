import prisma from "../utils/prisma";

/**
 * A customer's outstanding balance is always derived from their transactions,
 * never read from the stored Customer.balance column — that column is not
 * incremented when a credit sale is made, so it understates what is owed.
 *
 * Balance = unpaid portion of credit sales + unpaid debts - payments received
 *
 * A deposit taken at the point of sale lives on Sale.amountPaid, not as a
 * CustomerPayment, so subtracting it here does not double-count.
 */
const unpaidDebtStatuses = ["unpaid", "partial"];

export const computeCustomerBalance = async (
  customerId: string,
  companyId: string
): Promise<number> => {
  const [sales, payments, debts] = await Promise.all([
    prisma.sale.findMany({
      where: { customerId, companyId, saleType: "credit" },
      select: { totalAmount: true, amountPaid: true },
    }),
    prisma.customerPayment.aggregate({
      where: { customerId, companyId },
      _sum: { amount: true },
    }),
    prisma.customerDebt.aggregate({
      where: { customerId, companyId, status: { in: unpaidDebtStatuses } },
      _sum: { amount: true },
    }),
  ]);

  const outstandingCredit = sales.reduce(
    (sum, s) => sum + (s.totalAmount - s.amountPaid),
    0
  );

  return (
    outstandingCredit + (debts._sum.amount ?? 0) - (payments._sum.amount ?? 0)
  );
};

/**
 * Company-wide receivables: the sum of every customer who still owes money.
 * Customers in credit (negative balance) are excluded so they don't mask debt.
 */
export const computeCompanyReceivables = async (
  companyId: string
): Promise<{ total: number; customersOwing: number }> => {
  const customers = await prisma.customer.findMany({
    where: { companyId },
    select: {
      id: true,
      Sale: {
        where: { saleType: "credit" },
        select: { totalAmount: true, amountPaid: true },
      },
      CustomerPayment: { select: { amount: true } },
      CustomerDebt: {
        where: { status: { in: unpaidDebtStatuses } },
        select: { amount: true },
      },
    },
  });

  let total = 0;
  let customersOwing = 0;

  for (const c of customers) {
    const balance =
      c.Sale.reduce((sum, s) => sum + (s.totalAmount - s.amountPaid), 0) +
      c.CustomerDebt.reduce((sum, d) => sum + d.amount, 0) -
      c.CustomerPayment.reduce((sum, p) => sum + p.amount, 0);

    if (balance > 0) {
      total += balance;
      customersOwing++;
    }
  }

  return { total, customersOwing };
};
