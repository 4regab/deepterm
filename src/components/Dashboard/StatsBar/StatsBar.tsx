"use client";

import { Clock, Flame, Trophy } from "lucide-react";
import { useActivityStore } from "@/lib/stores";

interface StatCardProps {
    label: string;
    value: string | number;
    icon: React.ReactNode;
    bgColor: string;
    iconColor: string;
    loading?: boolean;
}

function StatCardSkeleton({ bgColor }: { bgColor: string }) {
    return (
        <div className={`${bgColor} rounded-xl p-4 animate-pulse`}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/30" />
                <div className="flex-1">
                    <div className="h-3 bg-white/30 rounded w-20 mb-2" />
                    <div className="h-6 bg-white/30 rounded w-12" />
                </div>
            </div>
        </div>
    );
}

function StatCard({ label, value, icon, bgColor, iconColor, loading }: StatCardProps) {
    if (loading) {
        return <StatCardSkeleton bgColor={bgColor} />;
    }

    return (
        <div className={`${bgColor} rounded-xl p-4 transition-all hover:shadow-md border border-[#171d2b]/5`}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                    <span className={iconColor}>{icon}</span>
                </div>
                <div>
                    <p className="font-sans text-[12px] text-[#171d2b]/60 mb-0.5">{label}</p>
                    <p className="font-sans font-semibold text-[20px] text-[#171d2b]">{value}</p>
                </div>
            </div>
        </div>
    );
}

export default function StatsBar() {
    const { stats, loading } = useActivityStore();

    const todayMinutes = stats?.total_study_minutes ?? 0;
    const currentStreak = stats?.current_streak ?? 0;
    const bestStreak = stats?.longest_streak ?? 0;

    return (
        <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                    label="Today's Study"
                    value={`${todayMinutes} min`}
                    icon={<Clock size={20} />}
                    bgColor="bg-[#f5f0e0]"
                    iconColor="text-[#171d2b]/70"
                    loading={loading}
                />
                <StatCard
                    label="Current Streak"
                    value={`${currentStreak} days`}
                    icon={<Flame size={20} />}
                    bgColor="bg-[#e8e4d8]"
                    iconColor="text-[#171d2b]/70"
                    loading={loading}
                />
                <StatCard
                    label="Best Streak"
                    value={`${bestStreak} days`}
                    icon={<Trophy size={20} />}
                    bgColor="bg-[#e0dcd0]"
                    iconColor="text-[#171d2b]/70"
                    loading={loading}
                />
            </div>
        </div>
    );
}
