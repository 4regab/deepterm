"use client";

import Link from "next/link";
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
import { createClient } from "@/config/supabase/client";
import { useEffect, useState } from "react";
import { useAchievementsStore } from "@/lib/stores";
import { Card, CardHeader, CardBody, TypeIcon, EmptyState } from "@/components/ui";
import { MaterialRowSkeleton } from "@/components/ui/Skeleton";
import type { Achievement, AchievementIcon } from "@/lib/schemas/achievements";

interface RecentActivityItem {
  id: string;
  title: string;
  type: "flashcards" | "reviewer" | "achievement";
  date: string;
  timestamp: number;
  icon?: string;
}

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

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <MaterialRowSkeleton key={i} />
      ))}
    </div>
  );
}

function AchievementRow({ item }: { item: RecentActivityItem }) {
  const IconComponent = ICON_MAP[item.icon as AchievementIcon] || Trophy;

  return (
    <div className="flex items-center gap-3 rounded-sm border border-subtle bg-surface p-2.5 transition-colors hover:border-default">
      <div className="grid size-7 shrink-0 place-items-center rounded-full bg-warn-subtle text-warn-text">
        <IconComponent size={14} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="body-sm font-medium text-ink truncate leading-tight">{item.title}</p>
        <p className="caption text-muted truncate text-[11px] leading-tight">
          <span className="text-warn-text font-medium">Achievement</span> · {item.date}
        </p>
      </div>
    </div>
  );
}

export default function RecentActivity() {
  const [recentFileItems, setRecentFileItems] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const achievements = useAchievementsStore((state) => state.achievements);

  useEffect(() => {
    useAchievementsStore.getState().fetchAchievements();
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchRecent = async () => {
      const supabase = createClient();
      const [flashcardSetsResult, reviewersResult] = await Promise.all([
        supabase
          .from("flashcard_sets")
          .select("id, title, updated_at, last_studied")
          .order("updated_at", { ascending: false })
          .limit(4),
        supabase
          .from("reviewers")
          .select("id, title, updated_at")
          .order("updated_at", { ascending: false })
          .limit(4),
      ]);

      if (!mounted) return;

      const items: RecentActivityItem[] = [];

      if (flashcardSetsResult.data) {
        flashcardSetsResult.data.forEach((set) => {
          const timestamp = new Date(set.last_studied || set.updated_at).getTime();
          items.push({
            id: set.id,
            title: set.title,
            type: "flashcards",
            date: formatTimeAgo(new Date(set.last_studied || set.updated_at)),
            timestamp,
          });
        });
      }

      if (reviewersResult.data) {
        reviewersResult.data.forEach((reviewer) => {
          const timestamp = new Date(reviewer.updated_at).getTime();
          items.push({
            id: reviewer.id,
            title: reviewer.title,
            type: "reviewer",
            date: formatTimeAgo(new Date(reviewer.updated_at)),
            timestamp,
          });
        });
      }

      setRecentFileItems(items);
      setLoading(false);
    };

    void fetchRecent();

    return () => {
      mounted = false;
    };
  }, []);

  const recentItems = [
    ...recentFileItems,
    ...achievements
      .filter((achievement: Achievement) => achievement.unlocked && achievement.unlocked_at)
      .slice(-2)
      .map((achievement: Achievement) => {
        const unlockedDate = new Date(achievement.unlocked_at as string);
        return {
          id: achievement.id,
          title: achievement.title,
          type: "achievement" as const,
          date: formatTimeAgo(unlockedDate),
          timestamp: unlockedDate.getTime(),
          icon: achievement.icon,
        };
      }),
  ]
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  return (
    <Card variant="flat" padding="none" className="overflow-hidden flex flex-col h-full">
      {/* Header */}
      <CardHeader className="border-b border-subtle px-4 py-3 bg-surface">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-secondary" aria-hidden="true" />
          <h3 className="subtitle font-semibold text-ink">Recent Activity</h3>
        </div>
      </CardHeader>

      {/* Content */}
      <CardBody className="p-4 flex-1 overflow-y-auto">
        {loading ? (
          <LoadingSkeleton />
        ) : recentItems.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Your recent study sessions and achievements will appear here."
          />
        ) : (
          <div className="space-y-2">
            {recentItems.map((item) =>
              item.type === "achievement" ? (
                <AchievementRow key={item.id} item={item} />
              ) : (
                <Link
                  key={item.id}
                  href={`/materials/${item.id}`}
                  className="group flex items-center gap-3 rounded-sm border border-subtle bg-surface p-2.5 transition-colors hover:border-default hover:bg-surface-hover"
                >
                  <TypeIcon
                    type={item.type === "flashcards" ? "Flashcards" : "Reviewer"}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="body-sm font-medium text-ink truncate group-hover:text-brand transition-colors leading-tight">
                      {item.title}
                    </p>
                    <p className="caption text-muted truncate text-[11px] leading-tight">
                      <span>{item.type === "flashcards" ? "Flashcards" : "Reviewer"}</span> ·{" "}
                      <span>{item.date}</span>
                    </p>
                  </div>
                </Link>
              )
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
