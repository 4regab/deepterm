"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Flame, Trophy } from "lucide-react";
import { getRankTitle, calculateProgressPercent } from "@/utils/xp";
import { useActivityStore } from "@/lib/stores";
import dynamic from "next/dynamic";

// Dynamic import for study calendar (client-side only)
const DynamicStudyCalendar = dynamic(
    () => import("@/components/Dashboard/StudyCalendar").then(mod => ({ default: mod.StudyCalendar })),
    {
        loading: () => <StudyCalendarSkeleton />,
        ssr: false
    }
);

function StudyCalendarSkeleton() {
    return (
        <div className="bg-white rounded-2xl p-6 border border-[#171d2b]/5 shadow-sm">
            <div className="animate-pulse">
                <div className="h-6 bg-[#171d2b]/10 rounded w-32 mb-4" />
                <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: 42 }).map((_, i) => (
                        <div key={i} className="h-8 bg-[#171d2b]/5 rounded" />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Wrapper component for dynamic calendar (must be in client component)
export function StudyCalendarWrapper() {
    return <DynamicStudyCalendar />;
}

// Type for server-side dashboard data
interface DashboardData {
    profile: {
        full_name: string | null;
        email: string | null;
        avatar_url: string | null;
    };
    xp: {
        total_xp: number;
        current_level: number;
        xp_in_level: number;
        xp_for_next: number;
    };
    stats: {
        total_study_minutes: number;
        today_study_minutes: number;
        current_streak: number;
        longest_streak: number;
        pomodoro_sessions: number;
        flashcards_mastered: number;
        quizzes_completed: number;
        last_study_date: string | null;
    };
}

interface DashboardHeaderProps {
    initialData?: DashboardData | null;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return "Hello";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
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

export function DashboardHeader({ initialData }: DashboardHeaderProps) {
    // Compute greeting on client side using user's local time
    const greeting = getGreeting();

    // Subscribe to the client-side activity store for live updates
    // This fixes timezone mismatch: server uses UTC current_date, but activity
    // is recorded with the client's local date. The client store matches correctly.
    const { activity, fetchActivity } = useActivityStore();

    // Fetch fresh activity data on mount to ensure the store is populated
    // with the latest data (e.g., after completing a Pomodoro session)
    useEffect(() => {
        fetchActivity(true);
    }, [fetchActivity]);

    // Compute today's minutes from client-side activity store (timezone-correct)
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const todayActivity = activity.find(a => a.activity_date === todayStr);
    // Prefer client-side store data (timezone-correct) over server data
    const clientTodayMinutes = todayActivity?.minutes_studied;

    // Show skeleton if no initial data (shouldn't happen with proper server fetch)
    if (!initialData) {
        return <HeaderSkeleton />;
    }

    const firstName = initialData.profile?.full_name?.split(' ')[0] || "there";
    const level = initialData.xp?.current_level || 1;
    const xpInLevel = initialData.xp?.xp_in_level || 0;
    const xpForNext = initialData.xp?.xp_for_next || 100;
    const rankTitle = getRankTitle(level);
    const progressPercent = calculateProgressPercent(xpInLevel, xpForNext);

    // Use client-side data when available (fixes timezone issue), fall back to server data
    const todayMinutes = clientTodayMinutes ?? initialData.stats?.today_study_minutes ?? 0;
    const currentStreak = initialData.stats?.current_streak ?? 0;
    const bestStreak = initialData.stats?.longest_streak ?? 0;

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
                                {todayMinutes} min
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
                                {currentStreak} days
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
                                {bestStreak} days
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.header>
    );
}



