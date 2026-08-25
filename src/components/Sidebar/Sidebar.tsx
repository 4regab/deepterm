"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { imgLogo } from "@/config/assets";
import { createClient } from "@/config/supabase/client";
import { useUIStore, useProfileStore, useMaterialsStore } from "@/lib/stores";
import { cn } from "@/lib/cn";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  TypeIcon,
  CountBadge,
  IconButton,
} from "@/components/ui";
import {
  Home,
  Library,
  Plus,
  X,
  LogOut,
  Timer,
  Trophy,
  LifeBuoy,
  PanelLeftClose,
  PanelLeftOpen,
  Folder as FolderIcon,
  User as UserIcon,
  ChevronsUpDown,
} from "lucide-react";
import {
  MATERIAL_SELECT,
  sortMaterialsByRecency,
  toFlashcardSetItem,
  toFolderList,
  toReviewerItem,
  type FlashcardSetRow,
  type ReviewerRow,
} from "@/lib/materials/queries";

const NAV_ITEMS = [
  { label: "Home", href: "/dashboard", icon: Home },
  { label: "Materials", href: "/materials", icon: Library },
  { label: "Pomodoro", href: "/pomodoro", icon: Timer },
  { label: "Achievements", href: "/achievements", icon: Trophy },
  { label: "Help", href: "/help", icon: LifeBuoy },
] as const;

function toContentType(type: string): "Flashcards" | "Reviewer" | "Practice" {
  if (type === "Flashcards") return "Flashcards";
  return "Reviewer";
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function Sidebar() {
  const pathname = usePathname();
  const [avatarError, setAvatarError] = useState(false);

  const sidebarPinned = useUIStore((state) => state.sidebarPinned);
  const sidebarMobileOpen = useUIStore((state) => state.sidebarMobileOpen);
  const toggleSidebarPinned = useUIStore((state) => state.toggleSidebarPinned);
  const setSidebarMobileOpen = useUIStore((state) => state.setSidebarMobileOpen);

  const profile = useProfileStore((state) => state.profile);
  const items = useMaterialsStore((state) => state.items);
  const folders = useMaterialsStore((state) => state.folders);

  useEffect(() => {
    useProfileStore.getState().fetchProfile();
  }, []);

  useEffect(() => {
    const store = useMaterialsStore.getState();
    if (!store.seeded) {
      const supabase = createClient();
      void Promise.all([
        supabase
          .from("flashcard_sets")
          .select(MATERIAL_SELECT.flashcardSets)
          .order("updated_at", { ascending: false })
          .limit(8),
        supabase
          .from("reviewers")
          .select(MATERIAL_SELECT.reviewers)
          .order("updated_at", { ascending: false })
          .limit(8),
        supabase
          .from("folders")
          .select(MATERIAL_SELECT.folders)
          .order("name", { ascending: true }),
      ]).then(([flashcardsRes, reviewersRes, foldersRes]) => {
        const flashcardRows = (flashcardsRes.data ?? []) as unknown as FlashcardSetRow[];
        const reviewerRows = (reviewersRes.data ?? []) as unknown as ReviewerRow[];
        const folderRows = (foldersRes.data ?? []) as unknown as Array<{
          id: string;
          name: string;
          created_at?: string | null;
        }>;

        const materials = sortMaterialsByRecency([
          ...flashcardRows.map((row) => toFlashcardSetItem(row)),
          ...reviewerRows.map((row) => toReviewerItem(row)),
        ]);
        store.setItems(materials);
        store.setFolders(toFolderList(folderRows));
      });
    }
  }, []);

  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const closeMobileMenu = () => setSidebarMobileOpen(false);

  const recentMaterials = items.slice(0, 5);

  const isNavActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    if (href === "/materials") {
      return pathname.startsWith("/materials") && pathname !== "/materials/create";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const renderNavContent = (isMobile = false, isCollapsed = false) => (
    <div className="flex h-full flex-col">
      {/* Top Brand Header */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-subtle px-3",
          isCollapsed ? "justify-center" : "justify-between"
        )}
      >
        <Link
          href="/dashboard"
          onClick={closeMobileMenu}
          className="flex items-center gap-2.5 overflow-hidden outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
          aria-label="DeepTerm dashboard"
        >
          <div className="flex size-7 shrink-0 items-center justify-center">
            <div className="rotate-[292deg]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="size-6" src={imgLogo} />
            </div>
          </div>
          {!isCollapsed && (
            <span className="font-ui text-base font-semibold tracking-tight text-ink">
              deepterm
            </span>
          )}
        </Link>

        {isMobile ? (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={closeMobileMenu}
            aria-label="Close navigation menu"
          >
            <X size={18} aria-hidden="true" />
          </IconButton>
        ) : (
          <IconButton
            variant="ghost"
            size="sm"
            onClick={toggleSidebarPinned}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(isCollapsed && "hidden")}
          >
            <PanelLeftClose size={18} aria-hidden="true" />
          </IconButton>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="p-2.5">
        {!isCollapsed ? (
          <Link
            href="/materials/create"
            onClick={closeMobileMenu}
            className={cn(
              "pressable flex h-9 w-full items-center justify-center gap-2 rounded-sm",
              "bg-brand text-sm font-medium text-on-solid shadow-[var(--elev-1)]",
              "transition-colors duration-[var(--dur-fast)] hover:bg-brand-hover active:bg-brand-active",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            )}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Create</span>
          </Link>
        ) : (
          <Link
            href="/materials/create"
            onClick={closeMobileMenu}
            title="Create new material"
            aria-label="Create new material"
            className={cn(
              "pressable grid size-9 mx-auto place-items-center rounded-sm",
              "bg-brand text-on-solid shadow-[var(--elev-1)]",
              "transition-colors duration-[var(--dur-fast)] hover:bg-brand-hover active:bg-brand-active",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
            )}
          >
            <Plus size={18} aria-hidden="true" />
          </Link>
        )}
      </div>

      {/* Navigation Links & Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-4 py-1">
        <nav aria-label="Main Navigation" className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = isNavActive(item.href);
            const Icon = item.icon;
            const isMaterials = item.href === "/materials";

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileMenu}
                aria-current={isActive ? "page" : undefined}
                title={isCollapsed ? item.label : undefined}
                aria-label={isCollapsed ? item.label : undefined}
                className={cn(
                  "relative flex h-9 items-center rounded-sm text-[14px] font-medium transition-colors duration-[var(--dur-fast)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
                  isCollapsed ? "justify-center px-0" : "px-2.5 gap-3",
                  isActive
                    ? "bg-brand-subtle text-brand-text font-medium before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-r-sm before:bg-brand"
                    : "text-secondary hover:bg-surface-hover hover:text-ink"
                )}
              >
                <Icon
                  size={18}
                  className={cn("shrink-0", isActive ? "text-brand-text" : "text-secondary")}
                  aria-hidden="true"
                />
                {!isCollapsed && (
                  <>
                    <span className="truncate flex-1">{item.label}</span>
                    {isMaterials && items.length > 0 && (
                      <CountBadge
                        count={items.length}
                        tone={isActive ? "brand" : "neutral"}
                        className="ml-auto"
                      />
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapsed expand toggle trigger */}
        {isCollapsed && (
          <div className="pt-2 flex justify-center">
            <IconButton
              variant="ghost"
              size="sm"
              onClick={toggleSidebarPinned}
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={18} aria-hidden="true" />
            </IconButton>
          </div>
        )}

        {/* Recent Materials Section (Expanded only) */}
        {!isCollapsed && recentMaterials.length > 0 && (
          <div className="pt-3">
            <div className="overline px-2.5 pb-1.5 text-muted uppercase tracking-wider text-[11px] font-semibold">
              Recent
            </div>
            <div className="flex flex-col gap-1">
              {recentMaterials.map((material) => {
                const isCurrentMaterial = pathname === `/materials/${material.id}`;
                return (
                  <Link
                    key={material.id}
                    href={`/materials/${material.id}`}
                    onClick={closeMobileMenu}
                    aria-current={isCurrentMaterial ? "page" : undefined}
                    title={material.title}
                    className={cn(
                      "group flex min-h-[42px] items-center gap-2.5 rounded-sm px-2 py-1 text-xs transition-colors duration-[var(--dur-fast)] overflow-hidden",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
                      isCurrentMaterial
                        ? "bg-surface-sunken text-ink font-medium"
                        : "text-secondary hover:bg-surface-hover hover:text-ink"
                    )}
                  >
                    <TypeIcon type={toContentType(material.type)} size="sm" className="shrink-0" />
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <p className="truncate text-xs font-medium leading-snug text-ink block w-full">
                        {material.title}
                      </p>
                      <p className="caption truncate text-muted text-[11px] leading-snug block w-full">
                        {material.itemsCount} {material.type === "Flashcards" ? "cards" : "terms"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Folders Section (Expanded only) */}
        {!isCollapsed && folders.length > 0 && (
          <div className="pt-3">
            <div className="overline px-2.5 pb-1.5 text-muted uppercase tracking-wider text-[11px] font-semibold">
              Folders
            </div>
            <div className="flex flex-col gap-0.5">
              {folders.map((folder) => {
                const folderCount = items.filter((item) => item.folderId === folder.id).length;
                return (
                  <Link
                    key={folder.id}
                    href={`/materials?folder=${folder.id}`}
                    onClick={closeMobileMenu}
                    title={folder.name}
                    className={cn(
                      "flex h-8 items-center gap-2 rounded-sm px-2.5 text-xs text-secondary transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover hover:text-ink overflow-hidden",
                      "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]"
                    )}
                  >
                    <FolderIcon size={15} className="shrink-0 text-muted" aria-hidden="true" />
                    <span className="truncate flex-1 font-medium min-w-0">{folder.name}</span>
                    {folderCount > 0 && (
                      <CountBadge count={folderCount} tone="neutral" className="ml-auto shrink-0" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Profile & Account */}
      <div className="border-t border-subtle p-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className={cn(
                "pressable flex w-full items-center rounded-sm transition-colors duration-[var(--dur-fast)] hover:bg-surface-hover",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)]",
                isCollapsed ? "h-10 justify-center px-0" : "h-11 px-2 gap-2.5"
              )}
              aria-label="Account menu"
            >
              {profile?.avatar_url && !avatarError ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  onError={() => setAvatarError(true)}
                  className="size-7 shrink-0 rounded-full object-cover ring-1 ring-border"
                />
              ) : (
                <div
                  className="grid size-7 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-on-solid"
                  aria-hidden="true"
                >
                  {getInitials(profile?.full_name ?? null)}
                </div>
              )}

              {!isCollapsed && (
                <>
                  <div className="min-w-0 flex-1 text-left">
                    <p className="body-sm truncate font-medium text-ink leading-tight">
                      {profile?.full_name || "Account"}
                    </p>
                    <p className="caption truncate text-muted text-[11px] leading-tight">
                      {profile?.email || "Signed in"}
                    </p>
                  </div>
                  <ChevronsUpDown size={14} className="shrink-0 text-muted" aria-hidden="true" />
                </>
              )}
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={isCollapsed ? "right" : "top"}
            align={isCollapsed ? "end" : "start"}
            sideOffset={8}
            className="w-56"
          >
            <DropdownMenuLabel className="truncate">
              <span className="block font-semibold text-ink truncate">
                {profile?.full_name || "Account"}
              </span>
              {profile?.email && (
                <span className="block font-normal text-muted truncate text-[11px]">
                  {profile.email}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/account"
                onClick={closeMobileMenu}
                className="flex items-center gap-2 w-full cursor-pointer"
              >
                <UserIcon size={15} aria-hidden="true" />
                <span>Account settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem tone="danger" onClick={handleSignOut} className="cursor-pointer">
              <LogOut size={15} aria-hidden="true" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Drawer Backdrop Scrim */}
      {sidebarMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity duration-[var(--dur-base)] md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <aside
        className={cn(
          "fixed left-0 top-0 bottom-0 z-50 w-[280px] bg-surface border-r border-default shadow-[var(--elev-3)] md:hidden transition-transform duration-[var(--dur-base)] ease-[var(--ease-out)]",
          sidebarMobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
        )}
        aria-hidden={!sidebarMobileOpen}
        inert={!sidebarMobileOpen}
      >
        {renderNavContent(true, false)}
      </aside>

      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 hidden h-screen bg-surface border-r border-default z-30 md:flex flex-col transition-[width] duration-200 ease-[var(--ease-out)]",
          sidebarPinned ? "w-[240px]" : "w-[64px]"
        )}
        aria-label="Sidebar"
      >
        {renderNavContent(false, !sidebarPinned)}
      </aside>
    </>
  );
}
