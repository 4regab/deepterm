"use client";

import { useEffect, useMemo } from "react";
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
                <h2 className="font-sans tracking-tight text-[20px] text-foreground">Achievements</h2>
            </div>
            <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        </div>
    );
}

function EmptyAchievements() {
    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-sans tracking-tight text-[20px] text-foreground">Achievements</h2>
                <span className="text-muted-foreground text-sm font-sans">0/0 Unlocked</span>
            </div>
            <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-border">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Trophy size={28} className="text-muted-foreground" />
                </div>
                <h3 className="font-sans font-medium text-foreground text-[16px] mb-2">No achievements yet</h3>
                <p className="font-sans text-[13px] text-muted-foreground max-w-xs">
                    Finish a study session to unlock the first one.
                </p>
            </div>
        </div>
    );
}

export default function Achievements() {
    const achievements = useAchievementsStore((state) => state.achievements);
    const loading = useAchievementsStore((state) => state.loading);

    // Use useEffect for one-time data fetching on mount
    useEffect(() => {
        useAchievementsStore.getState().fetchAchievements();
    }, []);

    // Memoize computed values to avoid O(n) computation on every render (Rule 5.2)
    const unlockedCount = useMemo(
        () => achievements.filter((a: { unlocked: boolean }) => a.unlocked).length,
        [achievements]
    );

    if (loading) return <AchievementsSkeleton />;
    if (achievements.length === 0) return <EmptyAchievements />;

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-sans tracking-tight text-[20px] text-foreground">Achievements</h2>
                <span className="text-muted-foreground text-sm font-sans">{unlockedCount}/{achievements.length} Unlocked</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {achievements.map((achievement: Achievement) => {
                    const IconComponent = ICON_MAP[achievement.icon as AchievementIcon] || Trophy;
                    const progressPercent = Math.round((achievement.progress / achievement.requirement_value) * 100);

                    return (
                        <div
                            key={achievement.id}
                            className={`relative p-4 rounded-xl border transition-all ${achievement.unlocked
                                ? "bg-white border-border shadow-sm"
                                : "bg-muted border-border opacity-80 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"
                            }`}
                        >
                            <div className={`w-10 h-10 rounded-full ${achievement.bg} flex items-center justify-center mb-3`}>
                                <IconComponent size={20} className={achievement.color} />
                            </div>

                            <h3 className="font-sans font-medium text-foreground text-[15px] mb-1">
                                {achievement.title}
                            </h3>
                            <p className="font-sans text-[12px] text-muted-foreground mb-3 leading-tight">
                                {achievement.description}
                            </p>

                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${achievement.unlocked ? "bg-green-500" : "bg-primary/40"}`}
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                            <p className="font-sans text-[10px] text-muted-foreground mt-1">
                                {achievement.progress}/{achievement.requirement_value}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
