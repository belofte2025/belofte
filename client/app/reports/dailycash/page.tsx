import { Metadata } from "next";
import DashboardLayout from "@/components/layout/DashboardLayout";
import CashTransactionsReport from "@/components/pages/dailycash/CashTransactionsReport";

export const metadata: Metadata = {
  title: "Daily Cash | Petros",
  description: "View daily cash sales and payments report",
  keywords: "daily cash, cash sales, payments, revenue report",
};

export default function DailyCashPage() {
  return (
    <DashboardLayout>
      <CashTransactionsReport />
    </DashboardLayout>
  );
}
