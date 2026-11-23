import Link from "next/link";
import { ArrowUpRight, type LucideIcon } from "lucide-react";

export function DestinationCard({
  icon: Icon,
  title,
  description,
  href,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href} className="card group flex h-full flex-col gap-4 transition-colors hover:border-blue-300 hover:bg-blue-50/60">
      <div className="flex items-start justify-between gap-3">
        <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <ArrowUpRight className="size-4 text-gray-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-blue-700" aria-hidden="true" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-gray-600">{description}</p>
      </div>
    </Link>
  );
}
