"use client";

import { useState } from "react";
import { Trophy, Zap, BrainCircuit, Star, Flame, Timer, Clock, BookOpen, FileText, Upload } from "lucide-react";
import { useAchievementsStore } from "@/lib/stores";
import { calculateOverallProgress, getUnlockedCount } from "@/utils/achievements";
import type { Achievement, AchievementIcon } from "@/lib/schemas/achievements";

const ICON_MAP: Record<string, typeof Trophy> = {
    Trophy, Zap, BrainCircuit, Star, Flame, Timer, Clock, BookOpen, FileText, Upload
};

type FilterType = "all" | "unlocked" | "locked";

const FILTERS: { label: string; value: FilterType }[] = [
    { label: "All", value: "all" },
    { label: "Unlocked", value: "unlocked" },
    { label: "Locked", value: "locked" },
];

const BG_MAP: Record<string, string> = {
    "bg-blue-100": "bg-[#e8e4d8]",
    "bg-purple-100": "bg-[#e0dcd0]",
    "bg-green-100": "bg-[#d8d4c8]",
    "bg-cyan-100": "bg-[#e8e4d8]",
    "bg-yellow-100": "bg-[#f5e6c8]",
    "bg-orange-100": "bg-[#f5e6c8]",
    "bg-red-100": "bg-[#e8e4d8]",
};

const COLOR_MAP: Record<string, { color: string }> = {
    "text-blue-600": { color: "text-[#171d2b]/70" },
    "text-purple-600": { color: "text-[#171d2b]/70" },
    "text-green-600": { color: "text-[#171d2b]/70" },
    "text-cyan-600": { color: "text-[#171d2b]/70" },
    "text-yellow-600": { color: "text-[#c4875a]" },
    "text-orange-600": { color: "text-[#c4875a]" },
    "text-red-600": { color: "text-[#171d2b]/70" },
};

let achievementsFetchTriggered = false;
function triggerAchievementsFetch() {
    if (!achievementsFetchTriggered) {
        achievementsFetchTriggered = true;
        queueMicrotask(() => {
            useAchievementsStore.getState().fetchAchievements();
        });
    }
}

export default function AchievementsPage() {
    const [filter, setFilter] = useState<FilterType>("all");
    const { achievements, loading } = useAchievementsStore();

    triggerAchievementsFetch();

    if (loading) return <AchievementsSkeleton />;

    const unlockedCount = getUnlockedCount(achievements);
    const overallProgress = calculateOverallProgress(achievements);

    const filteredAchievements = achievements.filter((a: Achievement) => {
        if (filter === "unlocked") return a.unlocked;
        if (filter === "locked") return !a.unlocked;
        return true;
    });

    if (achievements.length === 0) return <EmptyAchievements />;

    return (
        <div>
            <header className="mb-6">
                <h1 className="font-serif text-[28px] text-[#171d2b] mb-1">Achievements</h1>
                <p className="text-[#171d2b]/60 font-sans text-[15px]">
                    Track your progress and unlock rewards
                </p>
            </header>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div className="flex gap-2">
                    {FILTERS.map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-4 py-2 rounded-lg font-sans text-[14px] transition-all ${
                                filter === f.value
                                    ? "bg-[#171d2b] text-white"
                                    : "bg-white border border-[#171d2b]/10 text-[#171d2b]/70 hover:bg-[#171d2b]/5"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <span className="text-[#171d2b]/60 text-sm font-sans font-medium">
                    {unlockedCount}/{achievements.length} Unlocked
                </span>
            </div>

            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] text-[#171d2b]/50 font-sans">Overall Progress</span>
                    <span className="text-[12px] text-[#171d2b]/70 font-sans font-medium">{overallProgress}%</span>
                </div>
                <div className="w-full h-2 bg-[#171d2b]/5 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-[#c4a574] to-[#c4875a] transition-all duration-500"
                        style={{ width: `${overallProgress}%` }}
                    />
                </div>
            </div>

            {filteredAchievements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-[#171d2b]/5">
                    <div className="w-16 h-16 bg-[#171d2b]/5 rounded-full flex items-center justify-center mb-4">
                        <Trophy size={28} className="text-[#171d2b]/30" />
                    </div>
                    <h3 className="font-sans font-medium text-[#171d2b] text-[16px] mb-2">
                        No {filter} achievements
                    </h3>
                    <p className="font-sans text-[13px] text-[#171d2b]/50 max-w-xs">
                        {filter === "unlocked" 
                            ? "Keep studying to unlock achievements." 
                            : "You have unlocked all achievements."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredAchievements.map((achievement: Achievement) => {
                        const IconComponent = ICON_MAP[achievement.icon as AchievementIcon] || Trophy;
                        const progressPercent = Math.round((achievement.progress / achievement.requirement_value) * 100);
                        const mutedBg = BG_MAP[achievement.bg] || achievement.bg;
                        const mutedColor = COLOR_MAP[achievement.color]?.color || achievement.color;

                        return (
                            <div
                                key={achievement.id}
                                className={`relative p-4 rounded-xl border transition-all ${
                                    achievement.unlocked
                                        ? "bg-white border-[#171d2b]/10 shadow-sm"
                                        : "bg-[#f9f9f7] border-[#171d2b]/5 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                }`}
                            >
                                <div className={`w-10 h-10 rounded-full ${mutedBg} flex items-center justify-center mb-3`}>
                                    <IconComponent size={20} className={mutedColor} />
                                </div>
                                <h3 className="font-sans font-medium text-[#171d2b] text-[15px] mb-1">
                                    {achievement.title}
                                </h3>
                                <p className="font-sans text-[12px] text-[#171d2b]/60 mb-3 leading-tight">
                                    {achievement.description}
                                </p>
                                <div className="w-full h-1.5 bg-[#171d2b]/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all ${
                                            achievement.unlocked ? "bg-[#c4875a]" : "bg-[#171d2b]/40"
                                        }`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="font-sans text-[10px] text-[#171d2b]/40 mt-1">
                                    {achievement.progress}/{achievement.requirement_value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function AchievementsSkeleton() {
    return (
        <div>
            <header className="mb-6 animate-pulse">
                <div className="h-8 bg-[#171d2b]/10 rounded w-48 mb-2" />
                <div className="h-5 bg-[#171d2b]/5 rounded w-64" />
            </header>
            <div className="flex gap-2 mb-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 w-20 bg-[#171d2b]/10 rounded-lg" />
                ))}
            </div>
            <div className="h-2 bg-[#171d2b]/5 rounded w-full mb-6" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="h-32 bg-[#171d2b]/5 rounded-xl" />
                ))}
            </div>
        </div>
    );
}

function EmptyAchievements() {
    return (
        <div>
            <header className="mb-6">
                <h1 className="font-serif text-[28px] text-[#171d2b] mb-1">Achievements</h1>
                <p className="text-[#171d2b]/60 font-sans text-[15px]">
                    Track your progress and unlock rewards
                </p>
            </header>
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-[#171d2b]/5">
                <div className="w-16 h-16 bg-[#171d2b]/5 rounded-full flex items-center justify-center mb-4">
                    <Trophy size={28} className="text-[#171d2b]/30" />
                </div>
                <h3 className="font-sans font-medium text-[#171d2b] text-[16px] mb-2">No achievements yet</h3>
                <p className="font-sans text-[13px] text-[#171d2b]/50 max-w-xs">
                    Start studying to unlock achievements and track your progress.
                </p>
            </div>
        </div>
    );
}
