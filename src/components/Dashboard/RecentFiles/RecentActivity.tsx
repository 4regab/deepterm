"use client";

import Link from "next/link";
import { Clock, Trophy, Zap, BrainCircuit, Star, Flame, Timer, BookOpen, FileText, Upload } from "lucide-react";
import { createClient } from "@/config/supabase/client";
import { useEffect, useState } from "react";
import { useAchievementsStore } from "@/lib/stores";
import type { Achievement, AchievementIcon } from "@/lib/schemas/achievements";

interface RecentActivityItem {
    id: string;
    title: string;
    type: 'flashcards' | 'reviewer' | 'achievement';
    date: string;
    timestamp: number;
    color: string;
    icon?: string;
}

const TYPE_COLORS: Record<string, string> = {
    flashcards: "bg-muted",
    reviewer: "bg-muted",
    achievement: "bg-[#f5e6c8]",
};

const ICON_MAP: Record<string, typeof Trophy> = {
    Trophy, Zap, BrainCircuit, Star, Flame, Timer, Clock, BookOpen, FileText, Upload
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

function EmptyState() {
    return (
        <div className="bg-white rounded-xl p-5 border border-border flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <Clock size={20} className="text-muted-foreground" />
            </div>
            <h3 className="font-sans font-medium text-foreground text-[15px] mb-1">No recent activity</h3>
            <p className="font-sans text-[12px] text-muted-foreground max-w-xs">
                Your recent files and achievements will appear here.
            </p>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-border animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted shrink-0" />
                    <div className="flex-1">
                        <div className="h-4 bg-muted rounded w-3/4 mb-1.5" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}


function AchievementRow({ item }: { item: RecentActivityItem }) {
    const IconComponent = ICON_MAP[item.icon as AchievementIcon] || Trophy;
    
    return (
        <div className="group bg-white rounded-lg p-3 border border-border hover:border-primary/15 hover:shadow-sm transition-all flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5e6c8] flex items-center justify-center shrink-0">
                <IconComponent size={16} className="text-[#c4875a]" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-sans font-medium text-foreground text-[12px] truncate">
                    {item.title}
                </h3>
                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-sans">
                    <span className="text-[#c4875a] font-medium">Achievement</span>
                    <span>·</span>
                    <span>{item.date}</span>
                </div>
            </div>

        </div>
    );
}

export default function RecentActivity() {
    const [recentFileItems, setRecentFileItems] = useState<RecentActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const achievements = useAchievementsStore((state) => state.achievements);

    // Use useEffect for one-time data fetching on mount
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
                flashcardSetsResult.data.forEach(set => {
                    const timestamp = new Date(set.last_studied || set.updated_at).getTime();
                    items.push({
                        id: set.id,
                        title: set.title,
                        type: "flashcards",
                        date: formatTimeAgo(new Date(set.last_studied || set.updated_at)),
                        timestamp,
                        color: TYPE_COLORS.flashcards,
                    });
                });
            }

            if (reviewersResult.data) {
                reviewersResult.data.forEach(reviewer => {
                    const timestamp = new Date(reviewer.updated_at).getTime();
                    items.push({
                        id: reviewer.id,
                        title: reviewer.title,
                        type: "reviewer",
                        date: formatTimeAgo(new Date(reviewer.updated_at)),
                        timestamp,
                        color: TYPE_COLORS.reviewer,
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
                    color: TYPE_COLORS.achievement,
                    icon: achievement.icon,
                };
            }),
    ]
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5);

    return (
        <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden h-full flex flex-col">
            {/* Header - matching Study History style */}
            <div className="bg-[#f5e6c8] px-3 py-2 border-b border-border">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-muted-foreground" />
                    <h2 className="font-sans tracking-tight text-sm text-foreground">Recent Activity</h2>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 flex-1 overflow-y-auto">
                {loading ? (
                    <LoadingSkeleton />
                ) : recentItems.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="flex flex-col gap-2">
                        {recentItems.map((item) => (
                            item.type === 'achievement' ? (
                                <AchievementRow key={item.id} item={item} />
                            ) : (
                                <Link
                                    key={item.id}
                                    href={`/materials/${item.id}`}
                                    className="group bg-[#f5f5f0] rounded-lg p-3 border border-border hover:border-primary/15 hover:shadow-sm transition-all flex items-center gap-3"
                                >
                                    <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0`}>
                                        {item.type === 'flashcards' ? (
                                            <FileText size={14} className="text-muted-foreground" />
                                        ) : (
                                            <BookOpen size={14} className="text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-sans font-medium text-foreground text-[12px] truncate group-hover:text-foreground/70 transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-sans">
                                            <span>{item.type === 'flashcards' ? 'Flashcards' : 'Reviewer'}</span>
                                            <span>·</span>
                                            <span>{item.date}</span>
                                        </div>
                                    </div>
                                </Link>
                            )
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
