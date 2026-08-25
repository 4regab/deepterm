"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useUIStore } from "@/lib/stores";
import { cn } from "@/lib/cn";
import { imgLogo } from "@/config/assets";
import PomodoroNotification from "@/components/PomodoroNotification";
import TaskReminderNotification from "@/components/TaskReminderNotification";
import { Menu, Plus } from "lucide-react";

const Sidebar = dynamic(() => import("@/components/Sidebar"), {
  ssr: false,
  loading: () => <SidebarSkeleton />,
});

function SidebarSkeleton() {
  return (
    <aside
      className="fixed left-0 top-0 h-screen w-16 bg-surface border-r border-default hidden md:block"
      aria-hidden="true"
    />
  );
}

export default function DashboardChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const sidebarPinned = useUIStore((state) => state.sidebarPinned);
  const setSidebarMobileOpen = useUIStore((state) => state.setSidebarMobileOpen);

  const isStudyMode =
    pathname?.includes("/materials/") &&
    (pathname?.includes("/flashcards") ||
      pathname?.includes("/learn") ||
      pathname?.includes("/practice") ||
      pathname?.includes("/match"));

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <PomodoroNotification />
      <TaskReminderNotification />

      {!isStudyMode && <Sidebar />}

      {/* Mobile Top Header Bar */}
      {!isStudyMode && (
        <header className="md:hidden sticky top-0 z-30 flex h-14 items-center justify-between border-b border-default bg-surface/90 px-4 backdrop-blur-md">
          <button
            type="button"
            onClick={() => setSidebarMobileOpen(true)}
            className="pressable grid size-9 place-items-center rounded-sm text-secondary hover:bg-surface-hover hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            aria-label="Open navigation menu"
          >
            <Menu size={20} aria-hidden="true" />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center">
              <div className="rotate-[292deg]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="" className="size-5" src={imgLogo} />
              </div>
            </div>
            <span className="font-ui text-base font-semibold tracking-tight text-ink">
              deepterm
            </span>
          </Link>

          <Link
            href="/materials/create"
            className="pressable grid size-8 place-items-center rounded-sm bg-brand text-on-solid shadow-[var(--elev-1)] hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            aria-label="Create new material"
          >
            <Plus size={16} aria-hidden="true" />
          </Link>
        </header>
      )}

      {/* Main Content Area */}
      <main
        id="main-content"
        className={cn(
          "min-h-screen",
          !isStudyMode && (sidebarPinned ? "pl-0 md:pl-[240px]" : "pl-0 md:pl-16"),
          !isStudyMode && "transition-[padding] duration-200 ease-[var(--ease-out)]"
        )}
      >
        <div
          className={cn(
            "w-full",
            !isStudyMode
              ? "max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8"
              : "p-0"
          )}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
