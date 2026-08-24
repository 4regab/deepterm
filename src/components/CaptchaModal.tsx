"use client";

import { useRef, useCallback, useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";
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
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const handleVerify = useCallback((token: string) => {
        onVerify(token);
        onClose();
    }, [onVerify, onClose]);

    const handleExpire = useCallback(() => {
        captchaRef.current?.reset();
    }, []);

    const handleError = useCallback(() => {
        captchaRef.current?.reset();
        onError?.();
    }, [onError]);

    useEffect(() => {
        if (isOpen) {
            captchaRef.current?.reset();
        }
    }, [isOpen]);

    if (!siteKey) return null;

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
            <p className="text-sm text-muted-foreground mb-4 text-pretty">
                Complete the check to continue. This usually takes a few seconds.
            </p>
            <div className="flex justify-center">
                <Turnstile
                    ref={captchaRef}
                    siteKey={siteKey}
                    onSuccess={handleVerify}
                    onExpire={handleExpire}
                    onError={handleError}
                    options={{ theme: "light" }}
                />
            </div>
        </Modal>
    );
}
