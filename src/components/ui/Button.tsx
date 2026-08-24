"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type Size = "lg" | "md" | "sm" | "xs";

const BASE =
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-medium font-sora " +
  "transition-[transform,background-color,color,border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] " +
  "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none " +
  "disabled:pointer-events-none disabled:opacity-50 " +
  "active:translate-y-px active:scale-[0.96]";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-primary-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.18)] " +
    "hover:bg-[#2a3347]",
  secondary:
    "border border-transparent bg-secondary text-secondary-foreground " +
    "hover:bg-[color-mix(in_srgb,var(--secondary)_92%,var(--ink))]",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-accent",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
  outline:
    "border border-border bg-transparent text-foreground hover:bg-accent",
};

const SIZES: Record<Size, string> = {
  lg: "h-12 rounded-full px-8 text-base",
  md: "h-11 rounded-full px-6 text-sm",
  sm: "h-9 rounded-full px-4 text-sm",
  xs: "h-8 rounded-full px-3 text-xs",
};

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent",
        className
      )}
    />
  );
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      disabled={loading || disabled}
      aria-disabled={loading || undefined}
      type={type ?? "button"}
      {...props}
    >
      {loading ? <Spinner /> : null}
      {children}
    </button>
  );
}

export interface ButtonLinkProps
  extends React.ComponentProps<typeof Link> {
  variant?: Variant;
  size?: Size;
  className?: string;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
