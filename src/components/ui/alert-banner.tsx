import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type AlertVariant = "error" | "success" | "info";

const VARIANT_CLASSES: Record<AlertVariant, string> = {
  error: "alert-error",
  success: "alert-success",
  info: "alert-info",
};

interface AlertBannerProps {
  variant: AlertVariant;
  children: ReactNode;
  className?: string;
  role?: "alert" | "status";
  icon?: ReactNode;
}

export function AlertBanner({
  variant,
  children,
  className,
  role,
  icon,
}: AlertBannerProps) {
  return (
    <div
      role={role ?? (variant === "error" ? "alert" : "status")}
      className={cn(
        VARIANT_CLASSES[variant],
        icon && "flex items-center gap-2",
        className
      )}
    >
      {icon}
      {children}
    </div>
  );
}
