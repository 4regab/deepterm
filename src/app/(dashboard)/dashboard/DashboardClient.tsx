"use client";

import { motion } from "framer-motion";
import { Clock, Flame, Trophy } from "lucide-react";
import { useProfileStore, useXPStore, useActivityStore } from "@/lib/stores";
import { getRankTitle, calculateProgressPercent } from "@/utils/xp";

interface DashboardHeaderProps {
    greeting: string;
}

// Module-level flag for one-time fetch
let dashboardFetchTriggered = false;
function triggerDashboardFetch() {
    if (!dashboardFetchTriggered) {
        dashboardFetchTriggered = true;
        queueMicrotask(() => {
            useProfileStore.getState().fetchProfile();
            useXPStore.getState().fetchXPStats();
            useActivityStore.getState().fetchActivity();
        });
    }
}

// Skeleton component for loading states
function HeaderSkeleton() {
    return (
        <header className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                    <div className="h-10 w-64 bg-[#171d2b]/10 rounded-lg animate-pulse mb-2" />
                    <div className="h-5 w-48 bg-[#171d2b]/5 rounded animate-pulse" />
                </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-[#171d2b]/5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="h-7 w-20 bg-[#171d2b]/10 rounded-md animate-pulse" />
                        <div className="h-5 w-24 bg-[#171d2b]/5 rounded animate-pulse" />
                    </div>
                    <div className="h-5 w-20 bg-[#171d2b]/5 rounded animate-pulse" />
                </div>
                <div className="h-3 bg-[#171d2b]/5 rounded-full mb-4" />
                <div className="grid grid-cols-3 gap-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-[#f5f0e0] rounded-lg p-3 animate-pulse">
                            <div className="h-3 bg-[#171d2b]/10 rounded w-16 mb-2" />
                            <div className="h-5 bg-[#171d2b]/10 rounded w-12" />
                        </div>
                    ))}
                </div>
            </div>
        </header>
    );
}

export function DashboardHeader({ greeting }: DashboardHeaderProps) {
    const { profile, loading: profileLoading } = useProfileStore();
    const { stats: xpStats, loading: xpLoading } = useXPStore();
    const { stats: activityStats, loading: activityLoading } = useActivityStore();

    // Trigger fetch once (deferred to avoid render-time issues)
    triggerDashboardFetch();

    // Show skeleton during initial load
    if (profileLoading || xpLoading) {
        return <HeaderSkeleton />;
    }

    const firstName = profile?.full_name?.split(' ')[0] || "there";
    const level = xpStats?.currentLevel || 1;
    const xpInLevel = xpStats?.xpInLevel || 0;
    const xpForNext = xpStats?.xpForNext || 100;
    const rankTitle = getRankTitle(level);
    const progressPercent = calculateProgressPercent(xpInLevel, xpForNext);

    const todayMinutes = activityStats?.total_study_minutes ?? 0;
    const currentStreak = activityStats?.current_streak ?? 0;
    const bestStreak = activityStats?.longest_streak ?? 0;

    return (
        <motion.header
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
        >
            {/* Greeting */}
            <div className="mb-4">
                <h1 className="font-serif text-[32px] sm:text-[40px] text-[#171d2b] mb-1">
                    {`${greeting}, ${firstName}!`}
                </h1>
                <p className="font-sans text-[16px] text-[#171d2b]/60">
                    Ready to continue your learning journey?
                </p>
            </div>
            
            {/* Level Progress Bar Component with Stats */}
            <div className="bg-white rounded-xl p-4 border border-[#171d2b]/5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                    {/* Left: Level badge + Rank */}
                    <div className="flex items-center gap-3">
                        <div className="bg-[#171d2b] text-white px-3 py-1 rounded-md font-sans font-semibold text-sm">
                            LEVEL {level}
                        </div>
                        <span className="font-sans text-[#171d2b]/60 text-sm font-medium">
                            {rankTitle}
                        </span>
                    </div>
                    
                    {/* Right: Progress text */}
                    <span className="font-sans text-sm text-[#171d2b]/60">
                        {xpInLevel}/{xpForNext} XP
                    </span>
                </div>
                
                {/* Progress bar */}
                <div className="h-3 bg-[#171d2b]/5 rounded-full overflow-hidden mb-4">
                    <motion.div
                        className="h-full bg-gradient-to-r from-[#c4a574] to-[#c4875a] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-[#f5f0e0] rounded-lg p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                            <Clock size={16} className="text-[#171d2b]/70" />
                        </div>
                        <div>
                            <p className="font-sans text-[11px] text-[#171d2b]/60">Today&apos;s Study</p>
                            <p className="font-sans font-semibold text-[16px] text-[#171d2b]">
                                {activityLoading ? "..." : `${todayMinutes} min`}
                            </p>
                        </div>
                    </div>
                    <div className="bg-[#e8e4d8] rounded-lg p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                            <Flame size={16} className="text-[#171d2b]/70" />
                        </div>
                        <div>
                            <p className="font-sans text-[11px] text-[#171d2b]/60">Current Streak</p>
                            <p className="font-sans font-semibold text-[16px] text-[#171d2b]">
                                {activityLoading ? "..." : `${currentStreak} days`}
                            </p>
                        </div>
                    </div>
                    <div className="bg-[#e0dcd0] rounded-lg p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                            <Trophy size={16} className="text-[#171d2b]/70" />
                        </div>
                        <div>
                            <p className="font-sans text-[11px] text-[#171d2b]/60">Best Streak</p>
                            <p className="font-sans font-semibold text-[16px] text-[#171d2b]">
                                {activityLoading ? "..." : `${bestStreak} days`}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}



