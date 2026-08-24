"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { imgLogo } from "@/config/assets";
import { createClient } from "@/config/supabase/client";
import { useUIStore } from "@/lib/stores";
import { useScrolled } from "@/lib/hooks";
import CaptchaModal from "@/components/CaptchaModal";
import { Button, ButtonLink } from "@/components/ui";
import { cn } from "@/lib/cn";
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
    { label: "Practice test", href: "/materials" },
    { label: "Flashcards", href: "/materials" },
    { label: "Reviewer", href: "/materials" },
] as const;

const RESOURCES_ITEMS = [
    { label: "Blog", href: "/blog" },
    { label: "Help center", href: "/help" },
    { label: "Changelog", href: "/changelog" },
    { label: "About", href: "/about" },
] as const;

function NavDropdown({
    label,
    items,
}: {
    label: string;
    items: readonly { label: string; href: string }[];
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onPointer = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                className="font-sans text-foreground text-sm hover:opacity-70 transition-opacity duration-150 flex items-center gap-1 rounded-full px-1 min-h-10"
                aria-expanded={open}
                aria-haspopup="menu"
                onClick={() => setOpen((value) => !value)}
            >
                {label}
                <svg
                    className={cn(
                        "w-4 h-4 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                        open && "rotate-180"
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>
            <div
                role="menu"
                hidden={!open}
                className={cn(
                    "absolute top-full left-0 pt-2 origin-top-left",
                    "transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1 pointer-events-none"
                )}
            >
                <div className="bg-card border border-border rounded-2xl py-1.5 min-w-[168px] shadow-[var(--shadow-floating)]">
                    {items.map((item) => (
                        <Link
                            key={`${item.href}-${item.label}`}
                            href={item.href}
                            role="menuitem"
                            className="block mx-1 rounded-lg px-3 py-2 font-sans text-foreground text-[15px] hover:bg-accent transition-colors duration-150"
                            onClick={() => setOpen(false)}
                        >
                            {item.label}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}

function SessionAwareHeader({ user, isLoading, className }: { user: User | null; isLoading: boolean; className?: string }) {
    const isScrolled = useScrolled(20);
    const [isResourcesOpen, setIsResourcesOpen] = useState(false);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleLearn = () => setIsLearnOpen(!isLearnOpen);
    const toggleResources = () => setIsResourcesOpen(!isResourcesOpen);

    return (
        <header
            data-scrolled={isScrolled}
            className={cn("header-pill", className)}
        >
            <Link href="/" className="flex items-center min-h-10 hover:opacity-70 transition-opacity duration-150">
                <div className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center">
                    <div className="rotate-[292deg]">
                        <Image alt="DeepTerm" className="w-7 h-7 sm:w-8 sm:h-8" src={imgLogo} width={32} height={32} />
                    </div>
                </div>
                <span className="font-sans text-foreground text-[17px] sm:text-[18px] font-medium tracking-tight">deepterm</span>
            </Link>

            <nav className="hidden md:flex items-center gap-4" aria-label="Primary">
                <div className="flex items-center gap-4">
                    <NavDropdown label="Learn" items={LEARN_ITEMS} />
                    <NavDropdown label="Resources" items={RESOURCES_ITEMS} />
                </div>
                {isLoading ? (
                    <div className="h-10 w-[108px] rounded-full bg-muted" aria-hidden="true" />
                ) : user ? (
                    <ButtonLink href="/dashboard" size="sm">
                        Go to dashboard
                    </ButtonLink>
                ) : (
                    <Button size="sm" onClick={handleLoginClick}>
                        Log in
                    </Button>
                )}
            </nav>

            <button
                className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 pressable"
                onClick={toggleMenu}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
            >
                <span className={cn("block w-6 h-0.5 bg-foreground transition-transform duration-150", isMenuOpen && "rotate-45 translate-y-2")} />
                <span className={cn("block w-6 h-0.5 bg-foreground transition-opacity duration-150", isMenuOpen && "opacity-0")} />
                <span className={cn("block w-6 h-0.5 bg-foreground transition-transform duration-150", isMenuOpen && "-rotate-45 -translate-y-2")} />
            </button>

            {isMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border md:hidden shadow-[var(--shadow-floating)] rounded-2xl">
                    <nav className="flex flex-col p-3 gap-1" aria-label="Mobile">
                        <div>
                            <button
                                onClick={toggleLearn}
                                className="w-full font-sans text-foreground text-[16px] py-2.5 px-2 hover:bg-accent rounded-lg transition-colors duration-150 flex items-center justify-between"
                                aria-expanded={isLearnOpen}
                            >
                                Learn
                                <svg className={cn("w-4 h-4 transition-transform duration-150", isLearnOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isLearnOpen && (
                                <div className="pl-3 flex flex-col">
                                    {LEARN_ITEMS.map((item) => (
                                        <Link
                                            key={`mobile-${item.href}-${item.label}`}
                                            href={item.href}
                                            className="font-sans text-foreground text-[15px] py-2.5 px-2 rounded-lg hover:bg-accent transition-colors duration-150"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <button
                                onClick={toggleResources}
                                className="w-full font-sans text-foreground text-[16px] py-2.5 px-2 hover:bg-accent rounded-lg transition-colors duration-150 flex items-center justify-between"
                                aria-expanded={isResourcesOpen}
                            >
                                Resources
                                <svg className={cn("w-4 h-4 transition-transform duration-150", isResourcesOpen && "rotate-180")} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {isResourcesOpen && (
                                <div className="pl-3 flex flex-col">
                                    {RESOURCES_ITEMS.map((item) => (
                                        <Link
                                            key={`mobile-${item.href}-${item.label}`}
                                            href={item.href}
                                            className="font-sans text-foreground text-[15px] py-2.5 px-2 rounded-lg hover:bg-accent transition-colors duration-150"
                                        >
                                            {item.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-2 px-1 pb-1">
                            {isLoading ? (
                                <div className="h-10 w-full rounded-full bg-muted" aria-hidden="true" />
                            ) : user ? (
                                <ButtonLink href="/dashboard" size="sm" className="w-full">
                                    Go to dashboard
                                </ButtonLink>
                            ) : (
                                <Button size="sm" className="w-full" onClick={handleLoginClick}>
                                    Log in
                                </Button>
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
        <div ref={mountRef} className="sticky top-0 z-50 w-full h-16 sm:h-20">
            <SessionAwareHeader user={user} isLoading={isLoading} className={className} />
        </div>
    );
}
