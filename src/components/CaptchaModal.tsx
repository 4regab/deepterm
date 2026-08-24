"use client";

import { useRef, useCallback, useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";

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

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !siteKey) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="captcha-modal-title"
        >
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-6 py-4 border-b border-[#171d2b]/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={20} className="text-[#171d2b]" />
                        <h2 id="captcha-modal-title" className="font-sora font-bold text-lg text-[#171d2b]">
                            Verify You&apos;re Human
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label="Close captcha modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex flex-col items-center">
                    <p className="text-sm text-[#171d2b]/60 mb-4 text-center">
                        Complete the captcha to continue with AI generation
                    </p>
                    <Turnstile
                        ref={captchaRef}
                        siteKey={siteKey}
                        onSuccess={handleVerify}
                        onExpire={handleExpire}
                        onError={handleError}
                        options={{ theme: "light" }}
                    />
                </div>
            </div>
        </div>
    );
}
