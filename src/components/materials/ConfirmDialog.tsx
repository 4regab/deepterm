"use client";

import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    /** Spell out the consequence here before the user commits to it. */
    description: React.ReactNode;
    confirmLabel: string;
    busy?: boolean;
    error?: string | null;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel,
    busy = false,
    error = null,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape" && !busy) onCancel();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, busy, onCancel]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
            onClick={() => { if (!busy) onCancel(); }}
        >
            <div
                role="alertdialog"
                aria-modal="true"
                aria-label={title}
                className="w-full max-w-sm rounded-xl border border-border bg-white p-5 shadow-lg"
                onClick={(event) => event.stopPropagation()}
            >
                <h2 className="font-sans text-base font-medium text-foreground">{title}</h2>
                <div className="mt-2 text-sm text-muted-foreground">{description}</div>

                {error && (
                    <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
                        {error}
                    </p>
                )}

                <div className="mt-5 flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={busy}
                        className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-accent disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={busy}
                        className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                        {busy && <Loader2 size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
