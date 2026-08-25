"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { MAX_SEGMENTS, nextRovingIndex } from "./tokens";

export interface SegmentedItem<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  items: readonly SegmentedItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  /** Announced name for the group, e.g. "Layout". */
  label: string;
  className?: string;
}

/**
 * A view switch: same content, different presentation (grid vs list, week vs
 * month). It is NOT Tabs — Tabs move you between different panels of content.
 * Sunken track, one surface thumb that slides to the active option.
 */
export function SegmentedControl<T extends string = string>({
  items,
  value,
  onValueChange,
  label,
  className,
}: SegmentedControlProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const visible = items.slice(0, MAX_SEGMENTS);
  const activeIndex = Math.max(
    0,
    visible.findIndex((item) => item.value === value)
  );

  if (process.env.NODE_ENV !== "production" && items.length > MAX_SEGMENTS) {
    console.warn(
      `SegmentedControl: ${items.length} items exceeds ${MAX_SEGMENTS}. Use a Select instead.`
    );
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = event.key;
    if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End") {
      return;
    }
    event.preventDefault();
    const next = nextRovingIndex(activeIndex, visible.length, key);
    const item = visible[next];
    if (!item) return;
    onValueChange(item.value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative inline-grid gap-1 rounded-sm bg-surface-sunken p-1",
        className
      )}
      style={{ gridTemplateColumns: `repeat(${visible.length}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="ds-thumb pointer-events-none absolute inset-y-1 left-1 rounded-xs bg-surface shadow-[var(--elev-1)] transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]"
        style={{
          width: `calc((100% - 0.5rem - ${(visible.length - 1) * 0.25}rem) / ${visible.length})`,
          transform: `translateX(calc(${activeIndex} * (100% + 0.25rem)))`,
        }}
      />
      {visible.map((item, index) => {
        const selected = index === activeIndex;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "label relative z-10 inline-flex h-7 cursor-pointer items-center justify-center gap-1.5 rounded-xs px-3",
              "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
              selected ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
