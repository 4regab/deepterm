"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

/**
 * `destructive` and `outline` are the pre-redesign names. They still compile
 * and still render, mapped onto `danger` and `secondary`.
 * @deprecated destructive → danger, outline → secondary
 */
type LegacyVariant = "destructive" | "outline";

type Variant =
  | "primary"
  | "secondary"
  | "ghost"
  | "danger"
  | "danger-ghost"
  | "link"
  | LegacyVariant;

/** `xs` predates the scale. It maps to a 28px button; prefer `sm`. */
type Size = "lg" | "md" | "sm" | "xs";

const BASE =
  "pressable relative inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap " +
  "rounded-sm transition-[background-color,color,border-color,box-shadow,transform] " +
  "duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] " +
  "disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-brand text-on-solid hover:bg-brand-hover active:bg-brand-active",
  secondary:
    "border border-default bg-surface text-ink hover:bg-surface-hover active:bg-surface-sunken",
  ghost: "text-secondary hover:bg-surface-hover hover:text-ink",
  danger: "bg-danger text-on-solid hover:bg-danger-text active:bg-danger-text",
  "danger-ghost": "text-danger-text hover:bg-danger-subtle",
  link: "text-brand-text underline-offset-4 hover:underline",
  // Legacy aliases — identical output, kept so existing call sites compile.
  destructive: "bg-danger text-on-solid hover:bg-danger-text active:bg-danger-text",
  outline:
    "border border-default bg-surface text-ink hover:bg-surface-hover active:bg-surface-sunken",
};

const SIZES: Record<Size, string> = {
  lg: "h-[46px] px-6 text-base font-semibold",
  md: "h-[38px] px-4 text-[15px] font-medium",
  sm: "h-8 px-3 text-[13px] font-medium",
  xs: "h-7 px-2.5 text-xs font-medium",
};

/** `link` has no box of its own — it sits on the text baseline. */
const LINK_SIZES: Record<Size, string> = {
  lg: "h-auto p-0 text-base font-semibold",
  md: "h-auto p-0 text-[15px] font-medium",
  sm: "h-auto p-0 text-[13px] font-medium",
  xs: "h-auto p-0 text-xs font-medium",
};

function sizeClasses(variant: Variant, size: Size) {
  return variant === "link" ? LINK_SIZES[size] : SIZES[size];
}

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
      className={cn(BASE, VARIANTS[variant], sizeClasses(variant, size), className)}
      disabled={loading || disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      type={type ?? "button"}
      {...props}
    >
      {/* The label keeps its box while loading so the button never resizes. */}
      <span className={cn("contents", loading && "invisible")}>{children}</span>
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Spinner />
        </span>
      ) : null}
    </button>
  );
}

export interface ButtonLinkProps extends React.ComponentProps<typeof Link> {
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
      className={cn(BASE, VARIANTS[variant], sizeClasses(variant, size), className)}
      {...props}
    >
      {children}
    </Link>
  );
}

const ICON_SIZES = {
  sm: "size-7",
  md: "size-8",
  lg: "size-[38px]",
} as const;

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "aria-label"> {
  /** Required: an icon-only control is invisible to screen readers without it. */
  "aria-label": string;
  variant?: Extract<Variant, "primary" | "secondary" | "ghost" | "danger-ghost">;
  size?: keyof typeof ICON_SIZES;
}

export function IconButton({
  className,
  variant = "ghost",
  size = "md",
  type,
  children,
  ...props
}: IconButtonProps) {
  return (
    <button
      className={cn(
        BASE,
        VARIANTS[variant],
        ICON_SIZES[size],
        "shrink-0 rounded-xs p-0",
        className
      )}
      type={type ?? "button"}
      {...props}
    >
      {children}
    </button>
  );
}
