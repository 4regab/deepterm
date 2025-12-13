"use client";

import { useRef, useCallback, useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";
import HCaptcha from "@hcaptcha/react-hcaptcha";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onVerify: (token: string) => void;
    onError?: () => void;
}

export default function CaptchaModal({ isOpen, onClose, onVerify, onError }: Props) {
    const captchaRef = useRef<HCaptcha>(null);
    const sitekey = process.env.NEXT_PUBLIC_HCAPTCHA_SITEKEY;

    const handleVerify = useCallback((token: string) => {
        onVerify(token);
        onClose();
    }, [onVerify, onClose]);

    const handleExpire = useCallback(() => {
        captchaRef.current?.resetCaptcha();
    }, []);

    const handleError = useCallback(() => {
        captchaRef.current?.resetCaptcha();
        onError?.();
    }, [onError]);

    // Reset captcha when modal opens
    useEffect(() => {
        if (isOpen) {
            captchaRef.current?.resetCaptcha();
        }
    }, [isOpen]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen || !sitekey) return null;

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
                {/* Header */}
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

                {/* Content */}
                <div className="p-6 flex flex-col items-center">
                    <p className="text-sm text-[#171d2b]/60 mb-4 text-center">
                        Complete the captcha to continue with AI generation
                    </p>
                    <HCaptcha
                        ref={captchaRef}
                        sitekey={sitekey}
                        onVerify={handleVerify}
                        onExpire={handleExpire}
                        onError={handleError}
                        theme="light"
                    />
                </div>
            </div>
        </div>
    );
}
