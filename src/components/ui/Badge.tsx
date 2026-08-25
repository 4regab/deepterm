"use client";

import * as React from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { toneClasses, type Tone } from "./tokens";

export type { Tone };

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Solid fill instead of the subtle tint. One per view, at most. */
  solid?: boolean;
}

/** Status, never a control. If it can be clicked it is a Chip. */
export function Badge({
  className,
  tone = "neutral",
  solid = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "caption inline-flex h-5 shrink-0 items-center gap-1 rounded-xs px-1.5",
        toneClasses(tone, solid),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export interface ChipProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onSelect"> {
  selected?: boolean;
  /** Renders a trailing X. Only for chips that represent an applied filter. */
  onRemove?: () => void;
  removeLabel?: string;
}

/** An interactive filter toggle. Reports its state with aria-pressed. */
export function Chip({
  className,
  selected = false,
  onRemove,
  removeLabel = "Remove filter",
  children,
  type,
  ...props
}: ChipProps) {
  return (
    <span className="inline-flex">
      <button
        type={type ?? "button"}
        aria-pressed={selected}
        className={cn(
          "pressable label inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-sm border px-3",
          "transition-[background-color,border-color,color] duration-[var(--dur-fast)] ease-[var(--ease-out)]",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
          "disabled:pointer-events-none disabled:opacity-50",
          selected
            ? "border-brand bg-brand-subtle text-brand-text"
            : "border-default bg-surface text-secondary hover:bg-surface-hover hover:text-ink",
          onRemove && "rounded-r-none border-r-0",
          className
        )}
        {...props}
      >
        {selected ? <Check aria-hidden="true" size={14} /> : null}
        {children}
      </button>
      {onRemove ? (
        <button
          type="button"
          aria-label={removeLabel}
          onClick={onRemove}
          className={cn(
            "inline-flex h-8 cursor-pointer items-center rounded-r-sm border pl-1 pr-2",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
            selected
              ? "border-brand bg-brand-subtle text-brand-text"
              : "border-default bg-surface text-muted hover:text-ink"
          )}
        >
          <X aria-hidden="true" size={14} />
        </button>
      ) : null}
    </span>
  );
}

export interface CountBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  count: number;
  tone?: Tone;
  /** Renders "99+" past this. Counts wider than three glyphs break rows. */
  max?: number;
}

/** A number that sits beside a label. Tabular so it does not jitter. */
export function CountBadge({
  className,
  count,
  tone = "neutral",
  max = 99,
  ...props
}: CountBadgeProps) {
  return (
    <span
      className={cn(
        "caption tabular inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5",
        toneClasses(tone),
        className
      )}
      {...props}
    >
      {count > max ? `${max}+` : count}
    </span>
  );
}
