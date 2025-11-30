"use client";

import { useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { imgLogo } from "@/config/assets";
import { createClient } from "@/config/supabase/client";
import { useUIStore, useProfileStore } from "@/lib/stores";
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

// Profile fetch trigger - runs once on client hydration
let profileFetchTriggered = false;
function triggerProfileFetch() {
    if (!profileFetchTriggered) {
        profileFetchTriggered = true;
        // Schedule fetch after render completes
        queueMicrotask(() => {
            useProfileStore.getState().fetchProfile();
        });
    }
}

export default function Sidebar() {
    const pathname = usePathname();
    const profileMenuRef = useRef<HTMLDivElement>(null);

    // Zustand stores
    const {
        sidebarPinned,
        sidebarMobileOpen,
        profileMenuOpen,
        toggleSidebarPinned,
        setSidebarMobileOpen,
        setProfileMenuOpen
    } = useUIStore();

    const { profile } = useProfileStore();

    // Trigger profile fetch once (deferred to avoid render-time setState)
    triggerProfileFetch();



    const handleSignOut = async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    const closeMobileMenu = () => setSidebarMobileOpen(false);

    return (
        <>
            <button
                onClick={() => setSidebarMobileOpen(true)}
                className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 bg-[#171d2b] text-white rounded-lg flex items-center justify-center shadow-lg"
                aria-label="Open menu"
            >
                <Menu size={20} />
            </button>

            {sidebarMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            <aside className={`fixed left-0 top-0 h-screen bg-[#f0f0ea] border-r border-[#171d2b]/10 flex flex-col z-50 transition-all duration-300 overflow-hidden shadow-sm
                ${sidebarMobileOpen ? "w-[220px] translate-x-0" : "-translate-x-full w-[220px]"}
                ${sidebarPinned ? "md:translate-x-0 md:w-[220px]" : "md:translate-x-0 md:w-[64px] md:hover:w-[220px] md:hover:shadow-xl group"}`}>

                <button
                    onClick={closeMobileMenu}
                    className="absolute top-4 right-4 md:hidden w-8 h-8 flex items-center justify-center text-[#171d2b]/60 hover:text-[#171d2b]"
                    aria-label="Close menu"
                >
                    <X size={20} />
                </button>

                <div className="p-4 flex items-center justify-between h-[64px]">
                    <div className="flex items-center gap-1">
                        <div className="w-[32px] h-[32px] flex items-center justify-center flex-shrink-0">
                            <div className="rotate-[292deg]">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img alt="Deepterm Logo" className="w-[26px] h-[26px]" src={imgLogo} />
                            </div>
                        </div>
                        <span className={`font-sora text-[#171d2b] text-[20px] transition-opacity duration-300 whitespace-nowrap overflow-hidden ${sidebarPinned ? "md:opacity-100" : "md:opacity-0 md:group-hover:opacity-100"}`}>
                            deepterm
                        </span>
                    </div>
                    <button
                        onClick={toggleSidebarPinned}
                        className={`hidden md:flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0 ${sidebarPinned
                            ? "opacity-100 bg-[#171d2b]/10 text-[#171d2b]"
                            : "opacity-0 group-hover:opacity-100 text-[#171d2b]/60 hover:bg-[#171d2b]/5 hover:text-[#171d2b]"
                            }`}
                        title={sidebarPinned ? "Unpin sidebar (collapsible)" : "Pin sidebar (fixed)"}
                        aria-label={sidebarPinned ? "Unpin sidebar" : "Pin sidebar"}
                    >
                        <Pin size={16} className={`transition-transform ${sidebarPinned ? "rotate-0" : "rotate-45"}`} />
                    </button>
                </div>

                <div className="px-3 mb-2">
                    <Link
                        href="/materials/create"
                        onClick={closeMobileMenu}
                        className={`w-full h-[44px] rounded-xl flex items-center font-sans font-medium transition-all duration-300 overflow-hidden ${sidebarPinned ? "md:justify-start md:pl-4" : "md:justify-center md:pl-0 md:group-hover:justify-start md:group-hover:pl-4"} justify-start pl-4 ${pathname === "/materials/create" ? "bg-[#171d2b] text-white" : "text-[#171d2b]/60 hover:bg-[#171d2b]/5 hover:text-[#171d2b]"}`}
                    >
                        <Plus size={20} className="flex-shrink-0" />
                        <span className={`ml-4 transition-all duration-300 whitespace-nowrap overflow-hidden ${sidebarPinned ? "md:opacity-100 md:max-w-[150px] md:ml-4" : "md:opacity-0 md:max-w-0 md:ml-0 md:group-hover:opacity-100 md:group-hover:max-w-[150px] md:group-hover:ml-4"}`}>
                            Create
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={closeMobileMenu}
                                className={`flex items-center py-2.5 rounded-lg transition-all duration-200 ${sidebarPinned ? "md:justify-start md:pl-4 md:pr-3" : "md:justify-center md:pl-0 md:pr-0 md:group-hover:justify-start md:group-hover:pl-4 md:group-hover:pr-3"} justify-start pl-4 pr-3 ${isActive
                                    ? "bg-[#171d2b] text-white font-medium"
                                    : "text-[#171d2b]/60 hover:bg-[#171d2b]/5 hover:text-[#171d2b]"
                                    }`}
                            >
                                <item.icon
                                    size={20}
                                    className={`flex-shrink-0 ${isActive ? "text-white" : "text-[#171d2b]/60"}`}
                                />
                                <span className={`font-sans text-[15px] ml-4 transition-all duration-300 whitespace-nowrap overflow-hidden ${sidebarPinned ? "md:opacity-100 md:max-w-[150px] md:ml-4" : "md:opacity-0 md:max-w-0 md:ml-0 md:group-hover:opacity-100 md:group-hover:max-w-[150px] md:group-hover:ml-4"}`}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 pb-2">
                    <Link
                        href="/help"
                        onClick={closeMobileMenu}
                        className={`flex items-center py-2.5 rounded-lg transition-all duration-200 ${sidebarPinned ? "md:justify-start md:pl-4 md:pr-3" : "md:justify-center md:pl-0 md:pr-0 md:group-hover:justify-start md:group-hover:pl-4 md:group-hover:pr-3"} justify-start pl-4 pr-3 text-[#171d2b]/60 hover:bg-[#171d2b]/5 hover:text-[#171d2b]`}
                    >
                        <LifeBuoy size={20} className="flex-shrink-0" />
                        <span className={`font-sans text-[15px] ml-4 transition-all duration-300 whitespace-nowrap overflow-hidden ${sidebarPinned ? "md:opacity-100 md:max-w-[150px] md:ml-4" : "md:opacity-0 md:max-w-0 md:ml-0 md:group-hover:opacity-100 md:group-hover:max-w-[150px] md:group-hover:ml-4"}`}>
                            Help Center
                        </span>
                    </Link>
                </div>

                <div className="p-2 border-t border-[#171d2b]/10 relative" ref={profileMenuRef}>
                    <button
                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                        className={`w-full flex items-center py-2 rounded-lg hover:bg-[#171d2b]/5 transition-all duration-200 cursor-pointer ${sidebarPinned ? "md:justify-start md:pl-2" : "md:justify-center md:pl-0 md:group-hover:justify-start md:group-hover:pl-2"} justify-start pl-2`}
                    >
                        {profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={profile.avatar_url}
                                alt="Profile"
                                className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#171d2b] to-[#2a3347] flex items-center justify-center text-white font-sora text-sm flex-shrink-0">
                                {getInitials(profile?.full_name ?? null)}
                            </div>
                        )}
                        <div className={`min-w-0 ml-3 transition-all duration-300 overflow-hidden ${sidebarPinned ? "md:opacity-100 md:max-w-[150px] md:ml-3" : "md:opacity-0 md:max-w-0 md:ml-0 md:group-hover:opacity-100 md:group-hover:max-w-[150px] md:group-hover:ml-3"}`}>
                            <p className="font-sans text-[14px] font-medium text-[#171d2b] truncate">
                                {profile?.full_name || "Loading..."}
                            </p>
                        </div>
                    </button>

                    {profileMenuOpen && (
                        <div className="absolute bottom-full left-2 mb-2 bg-white border border-[#171d2b]/10 rounded-lg shadow-lg py-1 min-w-[160px] z-50">
                            <Link
                                href="/account"
                                onClick={() => { setProfileMenuOpen(false); closeMobileMenu(); }}
                                className="flex items-center gap-3 px-4 py-2.5 text-[#171d2b]/70 hover:bg-[#171d2b]/5 hover:text-[#171d2b] transition-colors"
                            >
                                <span className="font-sans text-[14px]">Account Settings</span>
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-[#171d2b]/70 hover:bg-red-50 hover:text-red-600 transition-colors"
                            >
                                <LogOut size={18} />
                                <span className="font-sans text-[14px]">Sign Out</span>
                            </button>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}
