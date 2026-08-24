import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 text-center px-4", className)}>
      {icon ? (
        <div className="mb-5 flex size-16 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      <h3 className="font-sora text-lg font-medium text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground text-pretty">{description}</p>
      {actionLabel && onAction ? (
        <Button size="sm" className="mt-5" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
