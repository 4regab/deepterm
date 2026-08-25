"use client";

import * as React from "react";
import * as Primitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/cn";

/**
 * Radix owns the hard parts: focus trapping, roving tabindex, typeahead,
 * collision-aware flipping, Esc to close, and returning focus to the trigger.
 * We only supply the skin.
 */
export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;
export const DropdownMenuGroup = Primitive.Group;

export function DropdownMenuContent({
  className,
  sideOffset = 6,
  align = "end",
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        align={align}
        collisionPadding={8}
        className={cn(
          "z-50 min-w-50 overflow-hidden rounded-md border border-default bg-surface p-1",
          "shadow-[var(--elev-2)]",
          className
        )}
        {...props}
      />
    </Primitive.Portal>
  );
}

export function DropdownMenuItem({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<typeof Primitive.Item> & { tone?: "default" | "danger" }) {
  return (
    <Primitive.Item
      className={cn(
        "body-sm flex h-[34px] cursor-pointer select-none items-center gap-2 rounded-xs px-2 outline-none",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        tone === "danger"
          ? "text-danger-text data-[highlighted]:bg-danger-subtle"
          : "text-ink data-[highlighted]:bg-surface-hover",
        className
      )}
      {...props}
    />
  );
}

export function DropdownMenuLabel({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Label>) {
  return (
    <Primitive.Label
      className={cn("overline px-2 pb-1 pt-2 text-muted", className)}
      {...props}
    />
  );
}

export function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Separator>) {
  return (
    <Primitive.Separator
      className={cn("-mx-1 my-1 h-px bg-[var(--border-subtle)]", className)}
      {...props}
    />
  );
}
