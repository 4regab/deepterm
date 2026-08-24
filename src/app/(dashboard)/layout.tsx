"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useUIStore } from "@/lib/stores";
import PomodoroNotification from "@/components/PomodoroNotification";
import TaskReminderNotification from "@/components/TaskReminderNotification";
import { cn } from "@/lib/cn";

const Sidebar = dynamic(() => import("@/components/Sidebar"), {
    ssr: false,
    loading: () => <SidebarSkeleton />,
});

function SidebarSkeleton() {
    return (
        <aside className="fixed left-0 top-0 h-screen w-16 bg-background border-r border-border hidden md:block" aria-hidden="true" />
    );
}

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const sidebarPinned = useUIStore((state) => state.sidebarPinned);

    const isStudyMode = pathname?.includes("/materials/") && (
        pathname?.includes("/flashcards") ||
        pathname?.includes("/learn") ||
        pathname?.includes("/practice") ||
        pathname?.includes("/match")
    );

    return (
        <div className="min-h-screen bg-background">
            <PomodoroNotification />
            <TaskReminderNotification />
            {!isStudyMode && (
                <Suspense fallback={<SidebarSkeleton />}>
                    <Sidebar />
                </Suspense>
            )}
            <main
                id="main-content"
                className={cn(
                    "min-h-screen",
                    !isStudyMode && (sidebarPinned ? "pl-0 md:pl-[220px]" : "pl-0 md:pl-16"),
                    !isStudyMode && "transition-[padding] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
                )}
            >
                <div className={cn(
                    "w-full",
                    !isStudyMode
                        ? "px-4 sm:px-6 pt-16 pb-24 sm:pt-6 md:pt-8 md:pb-28"
                        : "p-0"
                )}>
                    {children}
                </div>
            </main>
        </div>
    );
}
