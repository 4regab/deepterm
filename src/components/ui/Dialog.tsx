"use client";

import * as React from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { IconButton } from "./Button";

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

export type DialogSize = "sm" | "md" | "lg";

/** 400 / 520 / 720 — confirm, form, and "this is basically a page". */
const SIZES: Record<DialogSize, string> = {
  sm: "sm:max-w-100",
  md: "sm:max-w-130",
  lg: "sm:max-w-180",
};

export interface DialogContentProps
  extends React.ComponentProps<typeof Primitive.Content> {
  size?: DialogSize;
  /** Renders a close button in the top-right of the panel. */
  showClose?: boolean;
  closeLabel?: string;
}

export function DialogContent({
  className,
  size = "md",
  showClose = true,
  closeLabel = "Close",
  children,
  ...props
}: DialogContentProps) {
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-50 bg-[rgb(16_20_31/.45)] backdrop-blur-[2px]" />
      <Primitive.Content
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden border border-default bg-surface shadow-[var(--elev-3)]",
          "max-h-[min(85vh,720px)]",
          // Bottom sheet on phones: a centred 400px panel on a 375px screen is
          // a panel with no margins and a thumb that cannot reach the top.
          "inset-x-0 bottom-0 rounded-t-lg",
          // Centred panel from 640px up.
          "sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-full",
          "sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-lg",
          SIZES[size],
          className
        )}
        {...props}
      >
        {children}
        {showClose ? (
          <Primitive.Close asChild>
            <IconButton aria-label={closeLabel} className="absolute right-3 top-3">
              <X aria-hidden="true" size={16} />
            </IconButton>
          </Primitive.Close>
        ) : null}
      </Primitive.Content>
    </Primitive.Portal>
  );
}

/** Pinned. Stays put while the body scrolls. */
export function DialogHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col gap-1 border-b border-subtle px-5 py-4 pr-14",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Title>) {
  return <Primitive.Title className={cn("title text-ink", className)} {...props} />;
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      className={cn("body-sm text-muted", className)}
      {...props}
    />
  );
}

/** The only scrolling region in the dialog. */
export function DialogBody({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)}
      {...props}
    >
      {children}
    </div>
  );
}

/** Pinned. Primary action last, so it sits under the thumb on mobile. */
export function DialogFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-end gap-2 border-t border-subtle px-5 py-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
