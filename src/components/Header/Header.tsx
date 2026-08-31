"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { imgLogo } from "@/config/assets";
import { createClient } from "@/config/supabase/client";
import { useUIStore } from "@/lib/stores";
import { useScrolled } from "@/lib/hooks";
import CaptchaModal from "@/components/CaptchaModal";
import type { User } from "@supabase/supabase-js";

async function handleGoogleLogin() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
                access_type: "offline",
                prompt: "consent",
            },
        },
    });
}

const LEARN_ITEMS = [
    { label: "Pomodoro", href: "/pomodoro" },
    { label: "Practice Test", href: "/materials" },
    { label: "Flashcards", href: "/materials" },
    { label: "Reviewer", href: "/materials" },
] as const;

const RESOURCES_ITEMS = [
    { label: "Blog", href: "/blog" },
    { label: "Help Center", href: "/help" },
    { label: "Changelog", href: "/changelog" },
    { label: "About", href: "/about" },
] as const;

const GLASS_STYLES_SCROLLED = {
    backgroundColor: "rgba(240, 240, 234, 0.88)",
    borderColor: "rgba(23, 29, 43, 0.08)",
    backdropFilter: "blur(12px)",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
} as const;

const GLASS_STYLES_DEFAULT = {} as const;

function SessionAwareHeader({ user, isLoading, className }: { user: User | null; isLoading: boolean; className?: string }) {
    const isScrolled = useScrolled(20);
    const [isResourcesOpen, setIsResourcesOpen] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const menuPanelRef = useRef<HTMLDivElement>(null);

    const isMenuOpen = useUIStore((state) => state.sidebarMobileOpen);
    const isLearnOpen = useUIStore((state) => state.profileMenuOpen);
    const setIsMenuOpen = useUIStore((state) => state.setSidebarMobileOpen);
    const setIsLearnOpen = useUIStore((state) => state.setProfileMenuOpen);

    const handleLoginClick = () => {
        if (sitekey) {
            setShowCaptcha(true);
        } else {
            handleGoogleLogin();
        }
    };

    const handleCaptchaVerify = () => {
        setShowCaptcha(false);
        handleGoogleLogin();
    };

    const closeMenu = useCallback(() => {
        setIsMenuOpen(false);
        setIsLearnOpen(false);
        setIsResourcesOpen(false);
    }, [setIsMenuOpen, setIsLearnOpen]);

    const toggleMenu = () => {
        if (isMenuOpen) closeMenu();
        else setIsMenuOpen(true);
    };
    const toggleLearn = () => setIsLearnOpen(!isLearnOpen);
    const toggleResources = () => setIsResourcesOpen(!isResourcesOpen);

    useEffect(() => {
        if (!isMenuOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeMenu();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [isMenuOpen, closeMenu]);

    const glassStyles = isScrolled ? GLASS_STYLES_SCROLLED : GLASS_STYLES_DEFAULT;

    return (
        <>
            {isMenuOpen && (
                <button
                    type="button"
                    aria-label="Close menu"
                    className="fixed inset-0 z-40 bg-[#171d2b]/25 backdrop-blur-[2px] md:hidden"
                    onClick={closeMenu}
                />
            )}

            <header
                style={glassStyles}
                className={`relative z-50 flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 transition-all duration-300 rounded-full mx-3 sm:mx-4 mt-3 border border-transparent bg-transparent ${className || ''}`}
            >
                {/* Logo */}
                <Link href="/" className="flex items-center hover:opacity-70 transition-opacity" onClick={closeMenu}>
                    <div className="w-[40px] h-[40px] sm:w-[45px] sm:h-[45px] flex items-center justify-center">
                        <div className="rotate-[292deg]">
                            <Image alt="DeepTerm Logo" className="w-[32px] h-[32px] sm:w-[38px] sm:h-[38px]" src={imgLogo} width={38} height={38} />
                        </div>
                    </div>
                    <span className="font-sora text-[#171d2b] text-[20px] sm:text-[24px]">deepterm</span>
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex items-center gap-6" aria-label="Primary">
                    <div className="flex items-center gap-4">
                        {/* Learn Dropdown */}
                        <div className="relative group">
                            <button
                                type="button"
                                className="font-sans text-[#171d2b] text-[18px] hover:opacity-70 transition-opacity flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] rounded-sm"
                                aria-haspopup="true"
                            >
                                Learn
                                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all">
                                <div className="bg-[#f0f0ea] border border-[#171d2b]/10 rounded-lg shadow-lg py-2 min-w-[160px]">
                                    {LEARN_ITEMS.map((item) => (
                                        <Link
                                            key={`${item.href}-${item.label}`}
                                            href={item.href}
                                            className="block px-4 py-2 font-sans text-[#171d2b] text-[16px] hover:bg-[#171d2b]/5 transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <span className="w-[1px] h-[16px] bg-[#171d2b]/40" aria-hidden="true" />

                        {/* Resources Dropdown */}
                        <div className="relative group">
                            <button
                                type="button"
                                className="font-sans text-[#171d2b] text-[18px] hover:opacity-70 transition-opacity flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] rounded-sm"
                                aria-haspopup="true"
                            >
                                Resources
                                <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible group-focus-within:opacity-100 group-focus-within:visible transition-all">
                                <div className="bg-[#f0f0ea] border border-[#171d2b]/10 rounded-lg shadow-lg py-2 min-w-[160px]">
                                    {RESOURCES_ITEMS.map((item) => (
                                        <Link
                                            key={`${item.href}-${item.label}`}
                                            href={item.href}
                                            className="block px-4 py-2 font-sans text-[#171d2b] text-[16px] hover:bg-[#171d2b]/5 transition-colors"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                    {isLoading ? (
                        <div className="bg-[#171d2b]/10 h-[42px] rounded-[100px] px-6 w-[100px] animate-pulse" aria-hidden="true" />
                    ) : user ? (
                        <Link
                            href="/dashboard"
                            className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <button
                            type="button"
                            onClick={handleLoginClick}
                            className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] focus-visible:ring-offset-2"
                        >
                            Log in
                        </button>
                    )}
                </nav>

                {/* Mobile Menu Button */}
                <button
                    type="button"
                    className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 relative z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#171d2b] rounded-md"
                    onClick={toggleMenu}
                    aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                    aria-expanded={isMenuOpen}
                    aria-controls="mobile-nav-panel"
                >
                    <span className={`block w-6 h-0.5 bg-[#171d2b] transition-transform origin-center ${isMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
                    <span className={`block w-6 h-0.5 bg-[#171d2b] transition-opacity ${isMenuOpen ? "opacity-0" : ""}`} />
                    <span className={`block w-6 h-0.5 bg-[#171d2b] transition-transform origin-center ${isMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
                </button>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div
                        id="mobile-nav-panel"
                        ref={menuPanelRef}
                        className="absolute top-[calc(100%+8px)] left-0 right-0 bg-[#f0f0ea] border border-[#171d2b]/10 md:hidden shadow-xl rounded-2xl z-50"
                    >
                        <nav className="flex flex-col p-4 gap-1" aria-label="Mobile">
                            <div>
                                <button
                                    type="button"
                                    onClick={toggleLearn}
                                    aria-expanded={isLearnOpen}
                                    className="w-full font-sans text-[#171d2b] text-[18px] py-2.5 hover:opacity-70 transition-opacity flex items-center justify-between"
                                >
                                    Learn
                                    <svg className={`w-4 h-4 transition-transform ${isLearnOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isLearnOpen && (
                                    <div className="pl-3 flex flex-col gap-0.5 pb-1">
                                        {LEARN_ITEMS.map((item) => (
                                            <Link
                                                key={`mobile-${item.href}-${item.label}`}
                                                href={item.href}
                                                onClick={closeMenu}
                                                className="font-sans text-[#171d2b]/85 text-[16px] py-2 hover:opacity-70 transition-opacity"
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <button
                                    type="button"
                                    onClick={toggleResources}
                                    aria-expanded={isResourcesOpen}
                                    className="w-full font-sans text-[#171d2b] text-[18px] py-2.5 hover:opacity-70 transition-opacity flex items-center justify-between"
                                >
                                    Resources
                                    <svg className={`w-4 h-4 transition-transform ${isResourcesOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {isResourcesOpen && (
                                    <div className="pl-3 flex flex-col gap-0.5 pb-1">
                                        {RESOURCES_ITEMS.map((item) => (
                                            <Link
                                                key={`mobile-${item.href}-${item.label}`}
                                                href={item.href}
                                                onClick={closeMenu}
                                                className="font-sans text-[#171d2b]/85 text-[16px] py-2 hover:opacity-70 transition-opacity"
                                            >
                                                {item.label}
                                            </Link>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 pt-3 border-t border-[#171d2b]/10">
                                {isLoading ? (
                                    <div className="bg-[#171d2b]/10 h-[42px] rounded-[100px] px-6 w-full animate-pulse" aria-hidden="true" />
                                ) : user ? (
                                    <Link
                                        href="/dashboard"
                                        onClick={closeMenu}
                                        className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center w-full"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            closeMenu();
                                            handleLoginClick();
                                        }}
                                        className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center w-full"
                                    >
                                        Log in
                                    </button>
                                )}
                            </div>
                        </nav>
                    </div>
                )}

                <CaptchaModal
                    isOpen={showCaptcha}
                    onClose={() => setShowCaptcha(false)}
                    onVerify={handleCaptchaVerify}
                />
            </header>
        </>
    );
}

export default function Header({ className }: { className?: string }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const hasCheckedRef = useRef(false);
    const isMountedRef = useRef(false);

    const checkUser = useCallback(async () => {
        if (hasCheckedRef.current || !isMountedRef.current) return;
        hasCheckedRef.current = true;
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (isMountedRef.current) {
                setUser(user);
            }
        } finally {
            if (isMountedRef.current) {
                setIsLoading(false);
            }
        }
    }, []);

    const mountRef = useCallback((node: HTMLElement | null) => {
        if (node && !isMountedRef.current) {
            isMountedRef.current = true;
            checkUser();
        }
    }, [checkUser]);

    return (
        <div ref={mountRef} className="sticky top-0 z-50 w-full pt-2 sm:pt-3 lg:pt-4">
            <div className="max-w-[1440px] mx-auto">
                <SessionAwareHeader user={user} isLoading={isLoading} className={className} />
            </div>
        </div>
    );
}
