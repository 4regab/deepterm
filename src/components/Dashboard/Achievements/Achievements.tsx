"use client";

import { Trophy, Zap, BrainCircuit, Star, Flame, Timer, Clock, BookOpen, FileText, Upload } from "lucide-react";
import { useAchievementsStore } from "@/lib/stores";
import type { Achievement, AchievementIcon } from "@/lib/schemas/achievements";

const ICON_MAP: Record<string, typeof Trophy> = {
    Trophy, Zap, BrainCircuit, Star, Flame, Timer, Clock, BookOpen, FileText, Upload
};

function AchievementsSkeleton() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-[20px] text-[#171d2b]">Achievements</h2>
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
                <h2 className="font-serif text-[20px] text-[#171d2b]">Achievements</h2>
                <span className="text-[#171d2b]/60 text-sm font-sans">0/0 Unlocked</span>
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

export default function Achievements() {
    const { achievements, loading } = useAchievementsStore();

    // Trigger fetch once (deferred to avoid render-time issues)
    triggerAchievementsFetch();

    if (loading) return <AchievementsSkeleton />;
    if (achievements.length === 0) return <EmptyAchievements />;

    const unlockedCount = achievements.filter((a: { unlocked: boolean }) => a.unlocked).length;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-[20px] text-[#171d2b]">Achievements</h2>
                <span className="text-[#171d2b]/60 text-sm font-sans">{unlockedCount}/{achievements.length} Unlocked</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {achievements.map((achievement: Achievement) => {
                    const IconComponent = ICON_MAP[achievement.icon as AchievementIcon] || Trophy;
                    const progressPercent = Math.round((achievement.progress / achievement.requirement_value) * 100);

                    return (
                        <div
                            key={achievement.id}
                            className={`relative p-4 rounded-xl border transition-all ${achievement.unlocked
                                ? "bg-white border-[#171d2b]/10 shadow-sm"
                                : "bg-[#f9f9f7] border-[#171d2b]/5 opacity-80 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full ${achievement.bg} flex items-center justify-center mb-3`}>
                                <IconComponent size={20} className={achievement.color} />
                            </div>

                            <h3 className="font-sans font-medium text-[#171d2b] text-[15px] mb-1">
                                {achievement.title}
                            </h3>
                            <p className="font-sans text-[12px] text-[#171d2b]/60 mb-3 leading-tight">
                                {achievement.description}
                            </p>

                            <div className="w-full h-1.5 bg-[#171d2b]/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${achievement.unlocked ? "bg-green-500" : "bg-[#171d2b]/40"}`}
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
