import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChartNoAxesCombined, PackageCheck, ReceiptText } from "lucide-react";
import PetrosBrand from "@/components/layout/PetrosBrand";

const features = [
  { icon: PackageCheck, title: "Inventory and receiving", description: "Follow containers from arrival through receiving and track stock by supplier." },
  { icon: ReceiptText, title: "Sales and customer credit", description: "Record sales and payments, manage outstanding balances, and issue receipts." },
  { icon: ChartNoAxesCombined, title: "Reporting and accounting", description: "Review sales, inventory movement, expenses, and financial statements." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f4f7f6]">
      <header className="border-b border-[#dce7e3] bg-[#f4f7f6]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <PetrosBrand />
          <Link href="/login" className="btn btn-secondary">Sign in <ArrowRight className="size-4" /></Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 sm:px-8">
        <section className="grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14 lg:py-18">
          <div>
            <p className="mb-4 text-sm font-semibold text-blue-700">For warehouses and trading businesses</p>
            <h1 className="max-w-[13ch] text-[clamp(2.6rem,5.8vw,5rem)] leading-[0.99] font-bold tracking-[-0.075em] text-[#102f2f]">
              Manage stock, sales, and customer credit.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-gray-600 sm:text-lg">
              Receive containers, record transactions, and see what customers owe from one workspace.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/login" className="btn btn-primary">Open your workspace <ArrowRight className="size-4" /></Link>
              <Link href="/onboard" className="btn btn-ghost">Set up a company</Link>
            </div>
          </div>
          <div className="relative aspect-[5/4] overflow-hidden rounded-3xl bg-[#102f2f] lg:aspect-[1.14]">
            <Image
              src="/warehouse-sales.png"
              alt="Sales desk in a clothing warehouse"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover object-[center_40%]"
            />
          </div>
        </section>

        <section aria-label="PETROS features" className="grid gap-px overflow-hidden rounded-2xl border border-[#dce7e3] bg-[#dce7e3] sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div key={title} className="bg-white p-5 sm:p-6">
              <span className="mb-4 grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-700">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h2 className="font-semibold text-[#102f2f]">{title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-5 py-8 text-sm text-gray-600 sm:px-8">
        <span>PETROS by EYO Solutions</span>
        <a className="hover:underline" href="tel:+233246462398">Support · 0246462398</a>
      </footer>
    </div>
  );
}
