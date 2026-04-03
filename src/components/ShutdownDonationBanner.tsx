"use client";

import { useEffect, useState } from "react";

const BANNER_HIDE_UNTIL_KEY = "deepterm.shutdownBanner.hideUntil.v2";
const DONATE_URL = "https://ko-fi.com/4regab";
const HIDE_DURATION_MS = 24 * 60 * 60 * 1000;

function shouldHideBanner(): boolean {
    try {
        const hideUntilRaw = window.localStorage.getItem(BANNER_HIDE_UNTIL_KEY);
        const hideUntil = hideUntilRaw ? Number(hideUntilRaw) : 0;

        if (Number.isFinite(hideUntil) && hideUntil > Date.now()) {
            return true;
        }

        if (hideUntilRaw) {
            window.localStorage.removeItem(BANNER_HIDE_UNTIL_KEY);
        }
    } catch {
        // Ignore storage access issues.
    }

    return false;
}

export default function ShutdownDonationBanner() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (!shouldHideBanner()) {
            return;
        }

        const timer = window.setTimeout(() => {
            setIsVisible(false);
        }, 0);

        return () => {
            window.clearTimeout(timer);
        };
    }, []);

    const dismissBanner = () => {
        setIsVisible(false);
        try {
            window.localStorage.setItem(BANNER_HIDE_UNTIL_KEY, String(Date.now() + HIDE_DURATION_MS));
        } catch {
            // Ignore storage access issues.
        }
    };

    if (!isVisible) {
        return null;
    }

    return (
        <aside
            role="status"
            aria-live="polite"
            className="w-full border-b border-[#171d2b]/10 bg-[#f0f0ea] text-[#171d2b]"
        >
            <div className="mx-auto max-w-[1440px] px-4 py-2.5 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <p className="font-sans text-[12px] leading-[1.45] text-[#171d2b]/90 sm:text-[13px]">
                        <span className="mr-2 inline-block rounded-full bg-[#171d2b] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#fefeff]">
                            Announcement
                        </span>
                        We are moving to new domain{" "}
                        <a
                            href="http://deepterm.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline decoration-[#171d2b]/40 underline-offset-2 hover:text-[#171d2b]"
                        >
                            http://deepterm.app/
                        </a>
                        .
                    </p>

                    <div className="flex items-center gap-2">
                        <a
                            href={DONATE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-[34px] shrink-0 items-center justify-center rounded-full bg-[#171d2b] px-4 font-sora text-[12px] font-semibold text-[#fefeff] transition-colors hover:bg-[#2a3347] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6efe6]"
                            aria-label="Donate on Ko-fi to support Deepterm"
                        >
                            Donate
                        </a>

                        <button
                            type="button"
                            onClick={dismissBanner}
                            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#171d2b]/20 text-[#171d2b] transition-colors hover:bg-[#171d2b]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6efe6]"
                            aria-label="Dismiss announcement banner"
                        >
                            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </aside>
    );
}