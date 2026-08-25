import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function SkeletonBar({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("skeleton-bar block rounded-full", className)}
    />
  );
}

export function SkeletonLine({
  slot = "h-6",
  bar = "h-3 w-2/3",
}: {
  slot?: string;
  bar?: string;
}) {
  return (
    <span className={cn("flex items-center", slot)}>
      <SkeletonBar className={cn("max-w-full", bar)} />
    </span>
  );
}

export function Arrive({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("oa-arrive", className)}>{children}</div>;
}

/*
 * Composed skeletons.
 *
 * These derive from the same layout constants as the real components — tile
 * sizes, row heights, gaps — so hydration swaps content without moving it.
 * Any page-level skeleton that disagrees with these is a bug.
 */

/** Matches a material card: 36px type tile, title, meta line, progress track. */
export function MaterialCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-lg border border-default bg-surface p-4", className)}
    >
      <div className="flex items-start gap-3">
        <SkeletonBar className="size-9 rounded-sm" />
        <div className="min-w-0 flex-1">
          <SkeletonBar className="h-4 w-3/5" />
          <SkeletonBar className="mt-2 h-3 w-2/5" />
        </div>
      </div>
      <SkeletonBar className="mt-4 h-1.5 w-full" />
    </div>
  );
}

/** Matches a material list row: 28px tile, title, trailing meta. */
export function MaterialRowSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "flex items-center gap-3 border-b border-subtle px-4 py-3",
        className
      )}
    >
      <SkeletonBar className="size-7 rounded-sm" />
      <SkeletonBar className="h-4 flex-1" />
      <SkeletonBar className="h-3 w-16" />
    </div>
  );
}

/** Matches a dashboard stat tile: caption label over a 24px numeral. */
export function StatTileSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-lg border border-default bg-surface p-4", className)}
    >
      <SkeletonBar className="h-3 w-16" />
      <SkeletonBar className="mt-2 h-6 w-12" />
    </div>
  );
}

/**
 * Matches StudyCalendar: month label, weekday header, and a 7-column grid of
 * day cells. The canonical replacement for the two divergent
 * StudyCalendarSkeleton definitions that currently ship.
 */
export function CalendarSkeleton({
  weeks = 5,
  className,
}: {
  weeks?: number;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn("rounded-lg border border-default bg-surface p-4", className)}
    >
      <div className="flex items-center justify-between">
        <SkeletonBar className="h-4 w-28" />
        <SkeletonBar className="h-4 w-16" />
      </div>
      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {Array.from({ length: 7 }, (_, i) => (
          <SkeletonBar key={`weekday-${i}`} className="h-3" />
        ))}
        {Array.from({ length: weeks * 7 }, (_, i) => (
          <SkeletonBar key={`day-${i}`} className="aspect-square rounded-xs" />
        ))}
      </div>
    </div>
  );
}
