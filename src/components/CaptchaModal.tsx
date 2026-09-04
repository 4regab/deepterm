"use client";

import { useRef, useCallback, useState } from "react";
import { X, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { Modal } from "@/components/ui";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (token: string) => void;
    onError?: () => void;
}

export default function CaptchaModal({ isOpen, onClose, onVerify, onError }: Props) {
    const captchaRef = useRef<TurnstileInstance>(null);
    const siteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();
    const [widgetError, setWidgetError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);
    const [wasOpen, setWasOpen] = useState(isOpen);

    // Reset widget state when the modal newly opens (React render-time adjust pattern).
    if (isOpen !== wasOpen) {
        setWasOpen(isOpen);
        if (isOpen) {
            setWidgetError(null);
            setRetryCount((count) => count + 1);
        }
    }

    const handleVerify = useCallback((token: string) => {
        setWidgetError(null);
        onVerify(token);
        onClose();
    }, [onVerify, onClose]);

    const handleExpire = useCallback(() => {
        captchaRef.current?.reset();
    }, []);

    const handleError = useCallback(() => {
        setWidgetError("Verification failed to load. Check your connection and try again.");
        onError?.();
    }, [onError]);

    const handleRetry = useCallback(() => {
        setWidgetError(null);
        setRetryCount((count) => count + 1);
    }, []);

    return (
        <Modal open={isOpen} onClose={onClose} labelledBy="captcha-modal-title">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                    <ShieldCheck size={20} className="text-foreground" aria-hidden="true" />
                    <h2 id="captcha-modal-title" className="font-sans font-medium text-base text-foreground">
                        Verify you&apos;re human
                    </h2>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-accent transition-colors duration-150 pressable"
                    aria-label="Close verification"
                >
                    <X size={18} aria-hidden="true" />
                </button>
            </div>

            {!siteKey ? (
                <div
                    className="rounded-md border border-danger bg-danger-subtle p-3 text-danger-text text-sm"
                    role="alert"
                >
                    <div className="flex items-start gap-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
                        <div>
                            <p className="font-medium">Human verification is not configured</p>
                            <p className="mt-1 text-pretty opacity-90">
                                Set <code className="text-xs">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code> for this
                                environment. Server-side Turnstile checks remain required for generation.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    <p className="text-sm text-muted-foreground mb-4 text-pretty">
                        Complete the check to continue. This usually takes a few seconds.
                    </p>
                    <div className="flex min-h-[65px] flex-col items-center justify-center gap-3">
                        {widgetError ? (
                            <div className="w-full rounded-md border border-danger bg-danger-subtle p-3 text-danger-text text-sm" role="alert">
                                <p>{widgetError}</p>
                                <button
                                    type="button"
                                    onClick={handleRetry}
                                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium underline-offset-2 hover:underline"
                                >
                                    <RefreshCw size={14} aria-hidden="true" />
                                    Retry
                                </button>
                            </div>
                        ) : (
                            <Turnstile
                                key={`turnstile-${retryCount}`}
                                ref={captchaRef}
                                siteKey={siteKey}
                                onSuccess={handleVerify}
                                onExpire={handleExpire}
                                onError={handleError}
                                options={{ theme: "light", appearance: "always" }}
                            />
                        )}
                    </div>
                </>
            )}
        </Modal>
    );
}
