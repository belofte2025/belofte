"use client";
import Link from "next/link";
import { Dialog } from "@headlessui/react";

type Props = {
  open: boolean;
  onClose: () => void;
  customer: {
    id: string;
    name: string;
    phone: string;
    balance: number;
  } | null;
};

export default function ActionModal({ open, onClose, customer }: Props) {
  if (!customer) return null;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal wrapper */}
      <div className="fixed inset-0 flex items-center justify-center px-4">
        <Dialog.Panel className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl space-y-5 transition-all">
          <Dialog.Title className="text-xl font-bold text-gray-800 mb-2">
            Actions for {customer.name}
          </Dialog.Title>

          <div className="space-y-3 text-sm">
            <ActionLink
              href={`/customers/${customer.id}`}
              label="✏️ Edit Customer"
              color="blue"
              onClose={onClose}
            />
            <ActionLink
              href={`/customers/${customer.id}/payments`}
              label="💳 Record Payment"
              color="green"
              onClose={onClose}
            />
            <ActionLink
              href={`/customers/${customer.id}/statement`}
              label="📄 View Statement"
              color="purple"
              onClose={onClose}
            />
            <ActionLink
              href={`/sales/customer/${customer.id}`}
              label="🛒 View Sales"
              color="gray"
              onClose={onClose}
            />
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
          >
            Close
          </button>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

function ActionLink({
  href,
  label,
  color,
  onClose,
}: {
  href: string;
  label: string;
  color: "blue" | "green" | "purple" | "gray";
  onClose: () => void;
}) {
  const base = {
    blue: "text-blue-700 hover:bg-blue-50",
    green: "text-green-700 hover:bg-green-50",
    purple: "text-purple-700 hover:bg-purple-50",
    gray: "text-gray-700 hover:bg-gray-100",
  };

  return (
    <Link
      href={href}
      onClick={onClose}
      className={`block px-4 py-2 rounded-md font-medium ${base[color]} transition`}
    >
      {label}
    </Link>
  );
}
