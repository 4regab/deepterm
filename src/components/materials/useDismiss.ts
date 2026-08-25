"use client";

import { useEffect, useRef } from "react";

/**
 * Closes a popover on outside pointer-down or Escape, mirroring the profile
 * menu in Sidebar.tsx. Returns the ref to put on the popover's outermost node
 * (it must also wrap the trigger, so clicking the trigger is not "outside").
 */
export function useDismiss<T extends HTMLElement>(
    open: boolean,
    onDismiss: () => void,
) {
    const ref = useRef<T>(null);
    const handler = useRef(onDismiss);

    useEffect(() => {
        handler.current = onDismiss;
    }, [onDismiss]);

    useEffect(() => {
        if (!open) return;

        const onPointer = (event: PointerEvent) => {
            if (!ref.current?.contains(event.target as Node)) handler.current();
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") handler.current();
        };

        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return ref;
}
