"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { FADE_IN, FADE_OUT, POP, POP_EXIT } from "@/lib/motion";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      lastFocus.current?.focus();
    };
  }, [open, onClose]);

  const labelId = labelledBy ?? (title ? titleId : undefined);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: FADE_OUT }}
          style={{ overscrollBehavior: "contain" }}
        >
          <button
            aria-label="Close"
            type="button"
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-black/30"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelId}
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={
              reduce
                ? { opacity: 1, transition: FADE_IN }
                : { opacity: 1, scale: 1, y: 0, transition: POP }
            }
            exit={
              reduce
                ? { opacity: 0, transition: FADE_OUT }
                : { opacity: 0, scale: 0.96, y: 8, transition: POP_EXIT }
            }
            className={cn(
              "relative w-full max-w-md rounded-3xl border border-border bg-card p-5",
              "shadow-[var(--shadow-floating)]",
              className
            )}
          >
            {title ? (
              <h2 id={titleId} className="font-sans text-base font-medium text-foreground mb-3">
                {title}
              </h2>
            ) : null}
            {children}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
