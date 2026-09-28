"use client";

import { Banknote, CreditCard, Smartphone, Landmark } from "lucide-react";

export type SaleType = "cash" | "credit";
export type PaymentMethod = "CASH" | "MOMO" | "BANK";

type Props = {
  saleType: SaleType;
  setSaleType: (v: SaleType) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
};

const methods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "CASH", label: "Cash", icon: Banknote },
  { value: "MOMO", label: "Mobile Money", icon: Smartphone },
  { value: "BANK", label: "Bank", icon: Landmark },
];

export default function PaymentMethodSelector({
  saleType, setSaleType, paymentMethod, setPaymentMethod,
}: Props) {
  return (
    <div className="bg-white p-6 shadow-sm border border-gray-200 border-b-0">
      <h3 className="font-semibold text-gray-900 mb-4">Payment Method</h3>
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setSaleType("cash")}
          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            saleType === "cash" ? "border-green-500 bg-green-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <Banknote className={`w-6 h-6 mx-auto mb-2 ${saleType === "cash" ? "text-green-600" : "text-gray-400"}`} />
          <div className={`text-sm font-medium ${saleType === "cash" ? "text-green-700" : "text-gray-700"}`}>
            Pay Now
          </div>
        </button>
        <button
          onClick={() => setSaleType("credit")}
          className={`p-4 rounded-xl border-2 transition-all duration-200 ${
            saleType === "credit" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
          }`}
        >
          <CreditCard className={`w-6 h-6 mx-auto mb-2 ${saleType === "credit" ? "text-blue-600" : "text-gray-400"}`} />
          <div className={`text-sm font-medium ${saleType === "credit" ? "text-blue-700" : "text-gray-700"}`}>
            Credit Sale
          </div>
        </button>
      </div>

      {saleType === "cash" && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">How was it paid?</p>
          <div className="grid grid-cols-3 gap-2">
            {methods.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                onClick={() => setPaymentMethod(value)}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  paymentMethod === value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon className={`w-5 h-5 mx-auto mb-1 ${paymentMethod === value ? "text-indigo-600" : "text-gray-400"}`} />
                <div className={`text-xs font-medium ${paymentMethod === value ? "text-indigo-700" : "text-gray-600"}`}>
                  {label}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
