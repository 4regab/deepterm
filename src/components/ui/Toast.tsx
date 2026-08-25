import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Toast({
  kind,
  children,
  className,
  beat = 0,
}: {
  kind: "success" | "error";
  children: ReactNode;
  className?: string;
  beat?: number;
}) {
  const parity = beat % 2 === 0 ? "odd" : "even";
  return (
    <div
      role="status"
      className={cn(
        "caption flex items-center gap-2 rounded-sm border border-default bg-surface py-1.5 pl-3 pr-4",
        "shadow-[var(--elev-2)]",
        className
      )}
      style={{
        animation:
          kind === "success"
            ? `oa-toast-success-${parity} 0.32s cubic-bezier(0.5, 1, 0.89, 1)`
            : `oa-toast-error-${parity} 0.28s cubic-bezier(0.5, 1, 0.89, 1)`,
      }}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-2 rounded-full",
          kind === "success" ? "bg-success" : "bg-danger"
        )}
      />
      {children}
    </div>
  );
}
