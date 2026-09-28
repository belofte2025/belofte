import { cn } from "@/utils/cn";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Badge({ 
  children, 
  variant = "default", 
  size = "md",
  className 
}: BadgeProps) {
  const baseClasses = "inline-flex items-center font-medium ring-1";

  const variants = {
    default: "bg-gray-100 text-gray-600 ring-gray-200/60",
    success: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 ring-amber-200/60",
    danger: "bg-red-50 text-red-700 ring-red-200/60",
    info: "bg-blue-50 text-blue-700 ring-blue-200/60"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base"
  };

  return (
    <span className={cn(
      baseClasses,
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}