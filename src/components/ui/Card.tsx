import * as React from "react";
import { cn } from "@/lib/cn";
import { contentTypeTokens, type ContentType } from "./tokens";

export type CardVariant =
  | "flat"
  | "interactive"
  | "sunken"
  | "accent"
  | "selectable";

export type CardPadding = "none" | "sm" | "md" | "lg" | "xl";

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
  xl: "p-6",
};

const BASE = "rounded-lg border";

const VARIANTS: Record<CardVariant, string> = {
  // A resting card is a 1px border and a white fill on the canvas. No shadow.
  flat: "border-default bg-surface shadow-[var(--elev-0)]",
  interactive:
    "border-default bg-surface shadow-[var(--elev-0)] cursor-pointer " +
    "transition-[box-shadow,border-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
    "hover:border-input hover:shadow-[var(--elev-1)] " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
  sunken: "border-subtle bg-surface-sunken",
  accent: "border-default bg-surface border-l-[3px]",
  selectable:
    "border-default bg-surface cursor-pointer text-left " +
    "transition-[box-shadow,border-color,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] " +
    "hover:border-input " +
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
};

/**
 * Selection is drawn with an inset ring, not a second border pixel. `border-2`
 * would grow the box by 1px on each side and shift every neighbour in the grid
 * the moment a user picks something.
 */
const SELECTED = "border-brand bg-brand-subtle shadow-[inset_0_0_0_1px_var(--brand)]";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  /**
   * Defaults to `none` so cards that already carry their own padding classes
   * keep rendering exactly as they did. New code should pass a size.
   */
  padding?: CardPadding;
  /** Left rail colour. Only meaningful with `variant="accent"`. */
  accentType?: ContentType;
  /** Only meaningful with `variant="selectable"`. */
  selected?: boolean;
  /** @deprecated legacy prop — equivalent to `padding` of 4px. */
  inset?: boolean;
};

export function Card({
  className,
  variant = "flat",
  padding = "none",
  accentType,
  selected,
  inset,
  children,
  ...props
}: CardProps) {
  const selectable = variant === "selectable";
  return (
    <div
      className={cn(
        BASE,
        VARIANTS[variant],
        PADDING[padding],
        variant === "accent" && accentType && contentTypeTokens(accentType).rail,
        selectable && selected && SELECTED,
        inset && "p-1",
        className
      )}
      {...(selectable
        ? {
            role: "radio",
            "aria-checked": Boolean(selected),
            tabIndex: selected ? 0 : -1,
          }
        : null)}
      {...props}
    >
      {children}
    </div>
  );
}

/** Wraps a set of `variant="selectable"` cards so they read as one choice. */
export function CardRadioGroup({
  className,
  label,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn(className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-start justify-between gap-3 pb-3", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("body text-secondary", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center gap-2 pt-4", className)} {...props}>
      {children}
    </div>
  );
}

/** Legacy inset panel. Now a sunken well rather than a canvas-coloured box. */
export function CardInset({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md border border-subtle bg-surface-sunken", className)}
      {...props}
    >
      {children}
    </div>
  );
}
