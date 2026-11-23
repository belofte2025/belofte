import Link from "next/link";
import { Boxes } from "lucide-react";

export default function PetrosBrand({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className={`inline-flex w-fit items-center gap-2.5 rounded-lg ${light ? "text-white" : "text-[#102f2f]"}`}>
      <span className={`grid size-9 place-items-center rounded-[10px] ${light ? "bg-[#c6f2e4] text-[#102f2f]" : "bg-[#102f2f] text-[#c6f2e4]"}`}>
        <Boxes className="size-5" aria-hidden="true" />
      </span>
      <span className="text-lg font-bold tracking-[-0.04em]">PETROS</span>
    </Link>
  );
}
