import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SkeletonBar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("skeleton-bar block rounded-full", className)}
    />
  );
}

export function SkeletonLine({
  slot = "h-6",
  bar = "h-3 w-2/3",
}: {
  slot?: string;
  bar?: string;
}) {
  return (
    <span className={cn("flex items-center", slot)}>
      <SkeletonBar className={cn("max-w-full", bar)} />
    </span>
  );
}

export function Arrive({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("oa-arrive", className)}>{children}</div>;
}
