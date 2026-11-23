"use client";

import { useId } from "react";
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

function Segment({
  name, active, onChange, icon: Icon, label,
}: {
  name: string;
  active: boolean;
  onChange: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <label className="relative flex min-w-0 flex-1 cursor-pointer">
      <input type="radio" name={name} checked={active} onChange={onChange} className="peer sr-only" />
      <span className="inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-md px-2 text-xs font-semibold text-gray-600 hover:bg-white peer-checked:bg-blue-100 peer-checked:text-blue-800 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500">
        <Icon className="size-3.5 shrink-0" aria-hidden="true" />
        {label}
      </span>
    </label>
  );
}

export default function PaymentMethodSelector({
  saleType, setSaleType, paymentMethod, setPaymentMethod,
  amountPaid = 0, setAmountPaid, total = 0,
}: Props) {
  const groupId = useId();
  const showDeposit = saleType === "credit" && !!setAmountPaid;
  const deposit = Math.min(Math.max(0, amountPaid), total);
  const remaining = Math.max(0, total - deposit);

  return (
    <div className="card space-y-3">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
          Payment Method
        </p>
        <div
          role="radiogroup"
          aria-label="Payment terms"
          className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1"
        >
          {saleTypes.map(({ value, label, icon }) => (
            <Segment
              key={value}
              name={`${groupId}-terms`}
              active={saleType === value}
              onChange={() => {
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
            aria-label="Down payment"
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
            className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1"
          >
            {methods.map(({ value, label, icon }) => (
              <Segment
                key={value}
                name={`${groupId}-method`}
                active={paymentMethod === value}
                onChange={() => setPaymentMethod(value)}
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
