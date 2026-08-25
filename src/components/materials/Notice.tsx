"use client";

import { AlertTriangle, X } from "lucide-react";

interface NoticeProps {
    message: string | null;
    onDismiss?: () => void;
}

/** Inline, non-blocking failure banner. Anything that fails to save says so here. */
export default function Notice({ message, onDismiss }: NoticeProps) {
    if (!message) return null;

    return (
        <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span className="flex-1">{message}</span>
            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    aria-label="Dismiss"
                    className="rounded p-0.5 hover:bg-red-100"
                >
                    <X size={14} />
                </button>
            )}
        </div>
    );
}
