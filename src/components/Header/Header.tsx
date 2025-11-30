"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { imgLogo } from "@/config/assets";
import { createClient } from "@/config/supabase/client";
import { useUIStore } from "@/lib/stores";
import type { User } from "@supabase/supabase-js";

const LEARN_ITEMS = [
    { label: "Pomodoro", href: "/pomodoro" },
    { label: "Practice Test", href: "/materials" },
    { label: "Flashcards", href: "/materials" },
    { label: "Reviewer", href: "/materials" },
] as const;

function SessionAwareHeader({ user, isLoading }: { user: User | null; isLoading: boolean }) {
    
    const { 
        sidebarMobileOpen: isMenuOpen, 
        profileMenuOpen: isLearnOpen,
        setSidebarMobileOpen: setIsMenuOpen,
        setProfileMenuOpen: setIsLearnOpen 
    } = useUIStore();

    const handleLogin = async () => {
        const supabase = createClient();
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        });
    };

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleLearn = () => setIsLearnOpen(!isLearnOpen);

    return (
        <header className="relative z-50 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <div className="w-[40px] h-[40px] sm:w-[45px] sm:h-[45px] flex items-center justify-center">
                    <div className="rotate-[292deg]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img alt="Deepterm Logo" className="w-[32px] h-[32px] sm:w-[38px] sm:h-[38px]" src={imgLogo} />
                    </div>
                </div>
                <span className="font-sora text-[#171d2b] text-[20px] sm:text-[24px]">deepterm</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
                <div className="flex items-center gap-4">
                    {/* Learn Dropdown */}
                    <div className="relative group">
                        <button className="font-sans text-[#171d2b] text-[18px] hover:opacity-70 transition-opacity flex items-center gap-1">
                            Learn
                            <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                        <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                            <div className="bg-[#f0f0ea] border border-[#171d2b]/10 rounded-lg shadow-lg py-2 min-w-[160px]">
                                {LEARN_ITEMS.map((item) => (
                                    <a
                                        key={`${item.href}-${item.label}`}
                                        href={item.href}
                                        className="block px-4 py-2 font-sans text-[#171d2b] text-[16px] hover:bg-[#171d2b]/5 transition-colors"
                                    >
                                        {item.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <span className="w-[1px] h-[16px] bg-[#171d2b] opacity-50" />
                    <Link href="/help" className="font-sans text-[#171d2b] text-[18px] hover:opacity-70 transition-opacity">Help</Link>
                </div>
                {isLoading ? (
                    <div className="bg-[#171d2b]/10 h-[42px] rounded-[100px] px-6 w-[100px] animate-pulse" />
                ) : user ? (
                    <Link
                        href="/dashboard"
                        className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center"
                    >
                        Dashboard
                    </Link>
                ) : (
                    <button
                        onClick={handleLogin}
                        className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center"
                    >
                        Log in
                    </button>
                )}
            </nav>

            {/* Mobile Menu Button */}
            <button
                className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5"
                onClick={toggleMenu}
                aria-label="Toggle menu"
            >
                <span className={`block w-6 h-0.5 bg-[#171d2b] transition-transform ${isMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
                <span className={`block w-6 h-0.5 bg-[#171d2b] transition-opacity ${isMenuOpen ? "opacity-0" : ""}`} />
                <span className={`block w-6 h-0.5 bg-[#171d2b] transition-transform ${isMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-[#f0f0ea] border-t border-[#171d2b]/10 md:hidden shadow-lg">
                    <nav className="flex flex-col p-4 gap-2">
                        {/* Mobile Learn Accordion */}
                        <div>
                            <button
                                onClick={toggleLearn}
                                className="w-full font-sans text-[#171d2b] text-[18px] py-2 hover:opacity-70 transition-opacity flex items-center justify-between"
                            >
                                Learn
                                <svg className={`w-4 h-4 transition-transform ${isLearnOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isLearnOpen && (
                                <div className="pl-4 flex flex-col gap-1">
                                    {LEARN_ITEMS.map((item) => (
                                        <a
                                            key={`mobile-${item.href}-${item.label}`}
                                            href={item.href}
                                            className="font-sans text-[#171d2b] text-[16px] py-2 hover:opacity-70 transition-opacity"
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link href="/help" className="font-sans text-[#171d2b] text-[18px] py-2 hover:opacity-70 transition-opacity">Help</Link>
                        <div className="mt-2">
                            {isLoading ? (
                                <div className="bg-[#171d2b]/10 h-[42px] rounded-[100px] px-6 w-full animate-pulse" />
                            ) : user ? (
                                <Link
                                    href="/dashboard"
                                    className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center w-full"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <button
                                    onClick={handleLogin}
                                    className="bg-[#171d2b] h-[42px] rounded-[100px] px-6 text-[#fefeff] font-sora text-[16px] hover:bg-[#2a3347] transition-colors flex items-center justify-center w-full"
                                >
                                    Log in
                                </button>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}

export default function Header() {
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
    
    // Use ref callback to detect mount and trigger check
    const mountRef = useCallback((node: HTMLElement | null) => {
        if (node && !isMountedRef.current) {
            isMountedRef.current = true;
            checkUser();
        }
    }, [checkUser]);
    
    return (
        <div ref={mountRef}>
            <SessionAwareHeader user={user} isLoading={isLoading} />
        </div>
    );
}
