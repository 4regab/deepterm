"use client";

import { useEffect } from "react";
import {
  Trophy,
  Zap,
  BrainCircuit,
  Star,
  Flame,
  Timer,
  Clock,
  BookOpen,
  FileText,
  Upload,
} from "lucide-react";
import { useAchievementsStore } from "@/lib/stores";
import { calculateOverallProgress, getUnlockedCount } from "@/utils/achievements";
import { ProgressBar, Card, EmptyState } from "@/components/ui";
import { SkeletonBar } from "@/components/ui/Skeleton";
import type { Achievement, AchievementIcon } from "@/lib/schemas/achievements";

const ICON_MAP: Record<string, typeof Trophy> = {
  Trophy,
  Zap,
  BrainCircuit,
  Star,
  Flame,
  Timer,
  Clock,
  BookOpen,
  FileText,
  Upload,
};

function AllAchievementsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonBar className="h-6 w-40" />
        <SkeletonBar className="h-4 w-16" />
      </div>
      <SkeletonBar className="h-2 w-full" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-default bg-surface p-4 space-y-3">
            <SkeletonBar className="size-10 rounded-full" />
            <SkeletonBar className="h-4 w-3/4" />
            <SkeletonBar className="h-3 w-full" />
            <SkeletonBar className="h-1.5 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AllAchievements() {
  const achievements = useAchievementsStore((state) => state.achievements);
  const loading = useAchievementsStore((state) => state.loading);

  useEffect(() => {
    useAchievementsStore.getState().fetchAchievements();
  }, []);

  const unlockedCount = getUnlockedCount(achievements);
  const overallProgress = calculateOverallProgress(achievements);

  if (loading) return <AllAchievementsSkeleton />;
  if (achievements.length === 0) {
    return (
      <EmptyState
        title="No achievements yet"
        description="Finish a study session to unlock your first achievement badge."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="title font-semibold text-ink">All Achievements</h2>
        <span className="caption text-muted font-medium tabular">
          {unlockedCount}/{achievements.length}
        </span>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Overall Progress</span>
          <span className="font-semibold text-ink tabular">{overallProgress}%</span>
        </div>
        <ProgressBar
          value={overallProgress}
          max={100}
          size="sm"
          tone="brand"
          label="Overall achievements progress"
        />
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {achievements.map((achievement: Achievement) => {
          const IconComponent = ICON_MAP[achievement.icon as AchievementIcon] || Trophy;

          return (
            <Card
              key={achievement.id}
              variant="flat"
              padding="md"
              className={`flex flex-col justify-between transition-all ${
                achievement.unlocked
                  ? "border-default bg-surface shadow-[var(--elev-0)]"
                  : "border-subtle bg-surface-sunken opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
              }`}
            >
              <div>
                <div className="grid size-9 place-items-center rounded-full bg-warn-subtle text-warn-text mb-3">
                  <IconComponent size={18} aria-hidden="true" />
                </div>

                <h3 className="body-sm font-semibold text-ink mb-1">{achievement.title}</h3>
                <p className="caption text-muted mb-3 leading-tight">
                  {achievement.description}
                </p>
              </div>

              <div>
                <ProgressBar
                  value={achievement.progress}
                  max={achievement.requirement_value}
                  size="xs"
                  tone={achievement.unlocked ? "success" : "brand"}
                  label={`${achievement.title} progress`}
                />
                <p className="caption text-muted mt-1 tabular">
                  {achievement.progress}/{achievement.requirement_value}
                </p>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
