"use client";

import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";

type SalesOptionCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
};

export default function SalesOptionCard({
  icon,
  title,
  description,
  href,
}: SalesOptionCardProps) {
  const router = useRouter();

  return (
    <Card
      className="bg-gray-100 border-t border-blue-700 hover:bg-blue-100 transition cursor-pointer p-4 rounded-lg shadow-xl"
      onClick={() => router.push(href)}
    >
      <CardContent className="p-5 flex items-start gap-4">
        <div className="text-2xl">{icon}</div>
        <div>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription className="text-sm text-gray-600">
            {description}
          </CardDescription>
        </div>
      </CardContent>
    </Card>
  );
}
