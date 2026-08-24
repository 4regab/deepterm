"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { imgLogo } from "@/config/assets";
import { createClient } from "@/config/supabase/client";
import { useUIStore, useProfileStore } from "@/lib/stores";
import { cn } from "@/lib/cn";
import {
    Home,
    Library,
    Plus,
    Menu,
    X,
    LogOut,
    Timer,
    Pin,
    LifeBuoy,
    Trophy
} from "lucide-react";

const NAV_ITEMS = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Materials", href: "/materials", icon: Library },
    { label: "Pomodoro", href: "/pomodoro", icon: Timer },
    { label: "Achievements", href: "/achievements", icon: Trophy },
] as const;

function getInitials(name: string | null): string {
    if (!name) return "?";
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Sidebar() {
    const pathname = usePathname();
    const profileMenuRef = useRef<HTMLDivElement>(null);

    const sidebarPinned = useUIStore((state) => state.sidebarPinned);
    const sidebarMobileOpen = useUIStore((state) => state.sidebarMobileOpen);
    const profileMenuOpen = useUIStore((state) => state.profileMenuOpen);
    const toggleSidebarPinned = useUIStore((state) => state.toggleSidebarPinned);
    const setSidebarMobileOpen = useUIStore((state) => state.setSidebarMobileOpen);
    const setProfileMenuOpen = useUIStore((state) => state.setProfileMenuOpen);

    const profile = useProfileStore((state) => state.profile);

    useEffect(() => {
        useProfileStore.getState().fetchProfile();
    }, []);

    useEffect(() => {
        if (!profileMenuOpen) return;
        const onPointer = (event: PointerEvent) => {
            if (!profileMenuRef.current?.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setProfileMenuOpen(false);
        };
        document.addEventListener("pointerdown", onPointer);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("pointerdown", onPointer);
            document.removeEventListener("keydown", onKey);
        };
    }, [profileMenuOpen, setProfileMenuOpen]);

    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const closeMobileMenu = () => setSidebarMobileOpen(false);

    const labelClass = cn(
        "font-sans text-[15px] ml-4 whitespace-nowrap overflow-hidden transition-[opacity,max-width,margin] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
        sidebarPinned
            ? "md:opacity-100 md:max-w-[150px] md:ml-4"
            : "md:opacity-0 md:max-w-0 md:ml-0 md:group-hover:opacity-100 md:group-hover:max-w-[150px] md:group-hover:ml-4"
    );

    const itemLayout = cn(
        "flex items-center rounded-full min-h-11 px-3",
        "transition-[background-color,color,padding,justify-content] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
        sidebarPinned
            ? "md:justify-start md:pl-4 md:pr-3"
            : "md:justify-center md:pl-0 md:pr-0 md:group-hover:justify-start md:group-hover:pl-4 md:group-hover:pr-3",
        "justify-start pl-4 pr-3"
    );

    return (
        <>
            <button
                onClick={() => setSidebarMobileOpen(true)}
                className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-[var(--shadow-floating)] pressable"
                aria-label="Open menu"
            >
                <Menu size={20} aria-hidden="true" />
            </button>

            {sidebarMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />
            )}

            <aside
                className={cn(
                    "fixed left-0 top-0 h-screen bg-background border-r border-border flex flex-col z-50 overflow-hidden",
                    "transition-[width,transform,box-shadow] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    sidebarMobileOpen ? "w-[220px] translate-x-0" : "-translate-x-full w-[220px]",
                    sidebarPinned
                        ? "md:translate-x-0 md:w-[220px]"
                        : "md:translate-x-0 md:w-[64px] md:hover:w-[220px] md:hover:shadow-[var(--shadow-floating)] group"
                )}
            >
                <button
                    onClick={closeMobileMenu}
                    className="absolute top-4 right-4 md:hidden w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    aria-label="Close menu"
                >
                    <X size={20} aria-hidden="true" />
                </button>

                <div className="p-4 flex items-center justify-between h-16">
                    <Link href="/dashboard" className="flex items-center gap-1 min-h-10" onClick={closeMobileMenu}>
                        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                            <div className="rotate-[292deg]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="" className="w-[26px] h-[26px]" src={imgLogo} />
                            </div>
                        </div>
                        <span className={cn(
                            "font-sans text-foreground text-[20px] whitespace-nowrap overflow-hidden transition-opacity duration-200",
                            sidebarPinned ? "md:opacity-100" : "md:opacity-0 md:group-hover:opacity-100"
                        )}>
                            deepterm
                        </span>
                    </Link>
                    <button
                        onClick={toggleSidebarPinned}
                        className={cn(
                            "hidden md:flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
                            "transition-[opacity,background-color,color] duration-150",
                            sidebarPinned
                                ? "opacity-100 bg-accent text-foreground"
                                : "opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                        title={sidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
                        aria-label={sidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
                        aria-pressed={sidebarPinned}
                    >
                        <Pin size={16} className={cn("transition-transform duration-150", sidebarPinned ? "rotate-0" : "rotate-45")} aria-hidden="true" />
                    </button>
                </div>

                <div className="px-3 mb-2">
                    <Link
                        href="/materials/create"
                        onClick={closeMobileMenu}
                        className={cn(
                            itemLayout,
                            "font-medium overflow-hidden",
                            pathname === "/materials/create"
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                        )}
                    >
                        <Plus size={20} className="flex-shrink-0" aria-hidden="true" />
                        <span className={labelClass}>Create</span>
                    </Link>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden" aria-label="Dashboard">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMobileMenu}
                                aria-current={isActive ? "page" : undefined}
                                className={cn(
                                    itemLayout,
                                    isActive
                                        ? "bg-primary text-primary-foreground font-medium"
                                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                )}
                            >
                                <item.icon
                                    size={20}
                                    className={cn("flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")}
                                    aria-hidden="true"
                                />
                                <span className={labelClass}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 pb-2">
                    <Link
                        href="/help"
                        onClick={closeMobileMenu}
                        className={cn(itemLayout, "text-muted-foreground hover:bg-accent hover:text-foreground")}
                    >
                        <LifeBuoy size={20} className="flex-shrink-0" aria-hidden="true" />
                        <span className={labelClass}>Help center</span>
                    </Link>
                </div>

                <div className="p-2 relative" ref={profileMenuRef}>
                    <button
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        aria-expanded={profileMenuOpen}
                        aria-haspopup="menu"
                        className={cn(
                            "w-full flex items-center py-2 rounded-full hover:bg-accent transition-colors duration-150 cursor-pointer min-h-11",
                            sidebarPinned ? "md:justify-start md:pl-2" : "md:justify-center md:pl-0 md:group-hover:justify-start md:group-hover:pl-2",
                            "justify-start pl-2"
                        )}
                    >
                        {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.avatar_url}
                                alt=""
                                className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-sans text-sm flex-shrink-0" aria-hidden="true">
                                {getInitials(profile?.full_name ?? null)}
                            </div>
                        )}
                        <span className="sr-only">Account menu{profile?.full_name ? ` for ${profile.full_name}` : ""}</span>
                        <div className={cn(
                            "min-w-0 ml-3 overflow-hidden transition-[opacity,max-width,margin] duration-200",
                            sidebarPinned
                                ? "md:opacity-100 md:max-w-[150px] md:ml-3"
                                : "md:opacity-0 md:max-w-0 md:ml-0 md:group-hover:opacity-100 md:group-hover:max-w-[150px] md:group-hover:ml-3"
                        )}>
                            <p className="font-sans text-sm font-medium text-foreground truncate">
                                {profile?.full_name || "Account"}
                            </p>
                        </div>
                    </button>

                    {profileMenuOpen && (
                        <div
                            role="menu"
                            className="absolute bottom-full left-2 mb-2 bg-card border border-border rounded-2xl py-1 min-w-[168px] z-50 shadow-[var(--shadow-floating)] origin-bottom-left"
                        >
                            <Link
                                href="/account"
                                role="menuitem"
                                onClick={() => { setProfileMenuOpen(false); closeMobileMenu(); }}
                                className="flex items-center gap-3 mx-1 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-150"
                            >
                                <span className="font-sans text-sm">Account settings</span>
                            </Link>
                            <button
                                role="menuitem"
                                onClick={handleSignOut}
                                className="w-[calc(100%-0.5rem)] mx-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive-foreground transition-colors duration-150"
                            >
                                <LogOut size={16} aria-hidden="true" />
                                <span className="font-sans text-sm">Sign out</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
