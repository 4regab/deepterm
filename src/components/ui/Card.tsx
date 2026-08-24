import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  inset?: boolean;
};

export function Card({ className, inset, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "plate",
        inset && "p-1",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardInset({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[18px] bg-background border border-border",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
