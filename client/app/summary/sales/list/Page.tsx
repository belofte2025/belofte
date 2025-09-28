"use client";

import { useCallback, useEffect, useState } from "react";
import moment from "moment";
import { getSales, deleteSaleById } from "@/services/salesService";
import SalesListComponent from "@/components/pages/sales/SalesListComponent";
import DashboardLayout from "@/components/layout/DashboardLayout";

type Sale = {
  id: string;
  saleType: "cash" | "credit";
  totalAmount: number;
  createdAt: string;
  customer: {
    customerName: string;
  };
};

export default function SalesListPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const loadSales = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getSales(
        startDate ? moment(startDate).format("YYYY-MM-DD") : "",
        endDate ? moment(endDate).format("YYYY-MM-DD") : ""
      );
      setSales(result);
    } catch (err) {
      console.error("Failed to load sales.", err);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSaleById(id);
      loadSales();
    } catch (err) {
      console.error("Failed to delete sale.", err);
    }
  };

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  return (
    <DashboardLayout>
      <SalesListComponent
        sales={sales}
        loading={loading}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReload={loadSales}
        onDelete={handleDelete}
      />
    </DashboardLayout>
  );
}
