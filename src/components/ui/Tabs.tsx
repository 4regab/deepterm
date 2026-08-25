"use client";

import * as React from "react";
import { cn } from "@/lib/cn";
import { nextRovingIndex } from "./tokens";
import { CountBadge } from "./Badge";

export interface TabItem<T extends string = string> {
  value: T;
  label: string;
  count?: number;
}

export interface TabsProps<T extends string = string> {
  items: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  label: string;
  className?: string;
}

/**
 * Navigates between panels of *different* content. A 2px brand underline marks
 * the active tab and a 1px strip carries the row. For switching how the same
 * content is presented, use SegmentedControl.
 */
export function Tabs<T extends string = string>({
  items,
  value,
  onValueChange,
  label,
  className,
}: TabsProps<T>) {
  const refs = React.useRef<(HTMLButtonElement | null)[]>([]);
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value)
  );

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const key = event.key;
    if (key !== "ArrowLeft" && key !== "ArrowRight" && key !== "Home" && key !== "End") {
      return;
    }
    event.preventDefault();
    const next = nextRovingIndex(activeIndex, items.length, key);
    const item = items[next];
    if (!item) return;
    onValueChange(item.value);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn(
        "flex items-stretch gap-1 overflow-x-auto border-b border-default",
        className
      )}
    >
      {items.map((item, index) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onValueChange(item.value)}
            className={cn(
              "label -mb-px inline-flex cursor-pointer items-center gap-2 whitespace-nowrap border-b-2 px-3 pb-2.5 pt-2",
              "transition-colors duration-[var(--dur-fast)] ease-[var(--ease-out)]",
              "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--focus)]",
              selected
                ? "border-b-brand text-ink"
                : "border-b-transparent text-muted hover:text-ink"
            )}
          >
            {item.label}
            {typeof item.count === "number" ? (
              <CountBadge count={item.count} tone={selected ? "brand" : "neutral"} />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
