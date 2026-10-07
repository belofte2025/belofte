"use client";

import { Banknote, CreditCard, Smartphone, Landmark } from "lucide-react";

export type SaleType = "cash" | "credit";
export type PaymentMethod = "CASH" | "MOMO" | "BANK";

type Props = {
  saleType: SaleType;
  setSaleType: (v: SaleType) => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (v: PaymentMethod) => void;
  /** Deposit taken at the point of sale on a credit sale. Omit to hide the field. */
  amountPaid?: number;
  setAmountPaid?: (v: number) => void;
  /** Sale total, used to cap the deposit and show the remaining balance. */
  total?: number;
};

const methods: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: "CASH", label: "Cash",  icon: Banknote   },
  { value: "MOMO", label: "MoMo",  icon: Smartphone },
  { value: "BANK", label: "Bank",  icon: Landmark   },
];

const saleTypes: { value: SaleType; label: string; icon: React.ElementType }[] = [
  { value: "cash",   label: "Pay Now",     icon: Banknote   },
  { value: "credit", label: "Credit Sale", icon: CreditCard },
];

/**
 * One segment of a toggle group. The group behaves as a radio set, so selection
 * is exposed through aria-checked rather than a pressed state.
 */
function Segment({
  active, onClick, icon: Icon, label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "bg-white text-gray-600 hover:bg-gray-50"
      }`}
    >
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {label}
    </button>
  );
}

export default function PaymentMethodSelector({
  saleType, setSaleType, paymentMethod, setPaymentMethod,
  amountPaid = 0, setAmountPaid, total = 0,
}: Props) {
  const showDeposit = saleType === "credit" && !!setAmountPaid;
  const deposit = Math.min(Math.max(0, amountPaid), total);
  const remaining = Math.max(0, total - deposit);

  return (
    <div className="bg-white p-4 shadow-sm border border-gray-200 border-b-0 space-y-3">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Payment Method
        </p>
        <div
          role="radiogroup"
          aria-label="Payment method"
          className="flex rounded-lg border border-gray-200 overflow-hidden divide-x divide-gray-200"
        >
          {saleTypes.map(({ value, label, icon }) => (
            <Segment
              key={value}
              active={saleType === value}
              onClick={() => {
                setSaleType(value);
                if (value === "cash") setAmountPaid?.(0);
              }}
              icon={icon}
              label={label}
            />
          ))}
        </div>
      </div>

      {showDeposit && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Down payment
            </p>
            <span className="text-[10px] text-gray-400">optional</span>
          </div>
          <input
            type="number"
            min={0}
            max={total}
            step="0.01"
            value={amountPaid || ""}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setAmountPaid?.(Number.isFinite(v) ? Math.min(Math.max(0, v), total) : 0);
            }}
            placeholder="0.00"
            className="input py-1.5 text-sm"
          />
          <div className="flex items-center justify-between mt-1.5 text-xs">
            <span className="text-gray-500">
              Paid now: <span className="font-semibold text-green-600">₵ {deposit.toFixed(2)}</span>
            </span>
            <span className="text-gray-500">
              On credit: <span className="font-semibold text-orange-600">₵ {remaining.toFixed(2)}</span>
            </span>
          </div>
        </div>
      )}

      {(saleType === "cash" || deposit > 0) && (
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
            {saleType === "cash" ? "How was it paid?" : "Down payment made by"}
          </p>
          <div
            role="radiogroup"
            aria-label="How the payment was made"
            className="flex rounded-lg border border-gray-200 overflow-hidden divide-x divide-gray-200"
          >
            {methods.map(({ value, label, icon }) => (
              <Segment
                key={value}
                active={paymentMethod === value}
                onClick={() => setPaymentMethod(value)}
                icon={icon}
                label={label}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
