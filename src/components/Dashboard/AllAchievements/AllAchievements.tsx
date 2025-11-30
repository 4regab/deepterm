"use client";

import { Trophy, Zap, BrainCircuit, Star, Flame, Timer, Clock, BookOpen, FileText, Upload } from "lucide-react";
import { useAchievementsStore } from "@/lib/stores";
import { calculateOverallProgress, getUnlockedCount } from "@/utils/achievements";
import type { Achievement, AchievementIcon } from "@/lib/schemas/achievements";

const ICON_MAP: Record<string, typeof Trophy> = {
    Trophy, Zap, BrainCircuit, Star, Flame, Timer, Clock, BookOpen, FileText, Upload
};

function AllAchievementsSkeleton() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-[20px] text-[#171d2b]">All Achievements</h2>
                <div className="h-5 w-16 bg-[#171d2b]/10 rounded animate-pulse" />
            </div>
            <div className="mb-6">
                <div className="h-2 bg-[#171d2b]/10 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-[#171d2b] border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );
}

function EmptyAchievements() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-[20px] text-[#171d2b]">All Achievements</h2>
                <span className="text-[#171d2b]/60 text-sm font-sans">0/0</span>
            </div>
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

// Map vibrant colors to muted brand-consistent colors
const COLOR_MAP: Record<string, { bg: string; color: string }> = {
    'text-blue-600': { bg: 'bg-[#e8e4d8]', color: 'text-[#171d2b]/70' },
    'text-purple-600': { bg: 'bg-[#e0dcd0]', color: 'text-[#171d2b]/70' },
    'text-green-600': { bg: 'bg-[#d8d4c8]', color: 'text-[#171d2b]/70' },
    'text-cyan-600': { bg: 'bg-[#e8e4d8]', color: 'text-[#171d2b]/70' },
    'text-yellow-600': { bg: 'bg-[#f5e6c8]', color: 'text-[#c4875a]' },
    'text-orange-600': { bg: 'bg-[#f5e6c8]', color: 'text-[#c4875a]' },
    'text-red-600': { bg: 'bg-[#e8e4d8]', color: 'text-[#171d2b]/70' },
};

const BG_MAP: Record<string, string> = {
    'bg-blue-100': 'bg-[#e8e4d8]',
    'bg-purple-100': 'bg-[#e0dcd0]',
    'bg-green-100': 'bg-[#d8d4c8]',
    'bg-cyan-100': 'bg-[#e8e4d8]',
    'bg-yellow-100': 'bg-[#f5e6c8]',
    'bg-orange-100': 'bg-[#f5e6c8]',
    'bg-red-100': 'bg-[#e8e4d8]',
};

export default function AllAchievements() {
    const { achievements, loading } = useAchievementsStore();

    // Trigger fetch once (deferred to avoid render-time issues)
    triggerAchievementsFetch();

    if (loading) return <AllAchievementsSkeleton />;
    if (achievements.length === 0) return <EmptyAchievements />;

    const unlockedCount = getUnlockedCount(achievements);
    const overallProgress = calculateOverallProgress(achievements);

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-[20px] text-[#171d2b]">All Achievements</h2>
                <span className="text-[#171d2b]/60 text-sm font-sans font-medium">
                    {unlockedCount}/{achievements.length}
                </span>
            </div>

            {/* Overall Progress Bar */}
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

            {/* Achievement Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {achievements.map((achievement: Achievement) => {
                    const IconComponent = ICON_MAP[achievement.icon as AchievementIcon] || Trophy;
                    const progressPercent = Math.round((achievement.progress / achievement.requirement_value) * 100);
                    
                    // Map to muted colors
                    const mutedBg = BG_MAP[achievement.bg] || achievement.bg;
                    const mutedColor = COLOR_MAP[achievement.color]?.color || achievement.color;

                    return (
                        <div
                            key={achievement.id}
                            className={`relative p-4 rounded-xl border transition-all ${achievement.unlocked
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

                            {/* Individual Progress Bar */}
                            <div className="w-full h-1.5 bg-[#171d2b]/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${achievement.unlocked ? "bg-[#c4875a]" : "bg-[#171d2b]/40"}`}
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
        </div>
    );
}
