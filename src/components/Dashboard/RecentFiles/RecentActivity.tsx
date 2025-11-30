"use client";

import Link from "next/link";
import { Clock, Trophy, Zap, BrainCircuit, Star, Flame, Timer, BookOpen, FileText, Upload } from "lucide-react";
import { createClient } from "@/config/supabase/client";
import { useState, useCallback, useSyncExternalStore } from "react";
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
    flashcards: "bg-[#171d2b]/10",
    reviewer: "bg-[#171d2b]/10",
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
        <div className="bg-white rounded-xl p-5 border border-[#171d2b]/5 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-[#171d2b]/5 rounded-full flex items-center justify-center mb-3">
                <Clock size={20} className="text-[#171d2b]/30" />
            </div>
            <h3 className="font-sans font-medium text-[#171d2b] text-[15px] mb-1">No recent activity</h3>
            <p className="font-sans text-[12px] text-[#171d2b]/50 max-w-xs">
                Your recent files and achievements will appear here.
            </p>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col gap-2">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-[#171d2b]/5 animate-pulse flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#171d2b]/10 shrink-0" />
                    <div className="flex-1">
                        <div className="h-4 bg-[#171d2b]/10 rounded w-3/4 mb-1.5" />
                        <div className="h-3 bg-[#171d2b]/5 rounded w-1/2" />
                    </div>
                </div>
            ))}
        </div>
    );
}


function AchievementRow({ item }: { item: RecentActivityItem }) {
    const IconComponent = ICON_MAP[item.icon as AchievementIcon] || Trophy;
    
    return (
        <div className="group bg-white rounded-lg p-3 border border-[#171d2b]/5 hover:border-[#171d2b]/15 hover:shadow-sm transition-all flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#f5e6c8] flex items-center justify-center shrink-0">
                <IconComponent size={16} className="text-[#c4875a]" />
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-sans font-medium text-[#171d2b] text-[12px] truncate">
                    {item.title}
                </h3>
                <div className="flex items-center gap-1.5 text-[#171d2b]/50 text-[10px] font-sans">
                    <span className="text-[#c4875a] font-medium">Achievement</span>
                    <span>·</span>
                    <span>{item.date}</span>
                </div>
            </div>

        </div>
    );
}

// Module-level flag for one-time fetch
let achievementsFetchTriggered = false;
function triggerAchievementsFetch() {
    if (!achievementsFetchTriggered) {
        achievementsFetchTriggered = true;
        queueMicrotask(() => {
            useAchievementsStore.getState().fetchAchievements();
        });
    }
}

export default function RecentActivity() {
    const [recentItems, setRecentItems] = useState<RecentActivityItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { achievements } = useAchievementsStore();

    // Trigger achievements fetch
    triggerAchievementsFetch();

    // Fetch recent files once on mount
    useSyncExternalStore(
        useCallback(() => {
            let mounted = true;
            const fetchRecent = async () => {
                const supabase = createClient();

                // Fetch recent flashcard sets
                const { data: flashcardSets } = await supabase
                    .from("flashcard_sets")
                    .select("id, title, updated_at, last_studied")
                    .order("updated_at", { ascending: false })
                    .limit(4);

                // Fetch recent reviewers
                const { data: reviewers } = await supabase
                    .from("reviewers")
                    .select("id, title, updated_at")
                    .order("updated_at", { ascending: false })
                    .limit(4);

                if (!mounted) return;

                const items: RecentActivityItem[] = [];

                if (flashcardSets) {
                    flashcardSets.forEach(set => {
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

                if (reviewers) {
                    reviewers.forEach(rev => {
                        const timestamp = new Date(rev.updated_at).getTime();
                        items.push({
                            id: rev.id,
                            title: rev.title,
                            type: "reviewer",
                            date: formatTimeAgo(new Date(rev.updated_at)),
                            timestamp,
                            color: TYPE_COLORS.reviewer,
                        });
                    });
                }

                // Add recently unlocked achievements
                const unlockedAchievements = achievements.filter((a: Achievement) => a.unlocked && a.unlocked_at);
                unlockedAchievements.slice(-2).forEach((achievement: Achievement) => {
                    const unlockedDate = new Date(achievement.unlocked_at as string);
                    items.push({
                        id: achievement.id,
                        title: achievement.title,
                        type: "achievement",
                        date: formatTimeAgo(unlockedDate),
                        timestamp: unlockedDate.getTime(),
                        color: TYPE_COLORS.achievement,
                        icon: achievement.icon,
                    });
                });

                // Sort by most recent timestamp
                items.sort((a, b) => b.timestamp - a.timestamp);

                setRecentItems(items.slice(0, 5));
                setLoading(false);
            };

            fetchRecent();
            return () => { mounted = false; };
        }, [achievements]),
        () => null,
        () => null
    );

    return (
        <div className="bg-white rounded-xl border border-[#171d2b]/5 shadow-sm overflow-hidden h-full flex flex-col">
            {/* Header - matching Study History style */}
            <div className="bg-[#f5e6c8] px-3 py-2 border-b border-[#171d2b]/5">
                <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-[#171d2b]/70" />
                    <h2 className="font-serif-4 text-sm text-[#171d2b]">Recent Activity</h2>
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
                                    className="group bg-[#f5f5f0] rounded-lg p-3 border border-[#171d2b]/5 hover:border-[#171d2b]/15 hover:shadow-sm transition-all flex items-center gap-3"
                                >
                                    <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0`}>
                                        {item.type === 'flashcards' ? (
                                            <FileText size={14} className="text-[#171d2b]/60" />
                                        ) : (
                                            <BookOpen size={14} className="text-[#171d2b]/60" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-sans font-medium text-[#171d2b] text-[12px] truncate group-hover:text-[#171d2b]/70 transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-[#171d2b]/50 text-[10px] font-sans">
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
