import { Suspense, cache } from "react";
import { RecentActivity } from "@/components/Dashboard";
import { DashboardHeader, StudyCalendarWrapper } from "./DashboardClient";
import { getAuthenticatedClient } from "@/lib/auth/session";

// Force dynamic rendering - this page uses cookies for auth
export const dynamic = 'force-dynamic'

// Cached dashboard data fetch - uses React.cache for request deduplication
// This replaces 3 separate client-side fetches with 1 server-side RPC call
const getDashboardData = cache(async () => {
    const { supabase, isAuthenticated } = await getAuthenticatedClient();

    if (!isAuthenticated) {
        return null;
    }

    const { data, error } = await supabase.rpc('get_dashboard_data');

    if (error) {
        console.error('[Dashboard] Failed to fetch data:', error);
        return null;
    }

    return data as DashboardData | null;
});

// Type for dashboard data from RPC
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



function RecentActivitySkeleton() {
    return (
        <div className="h-full">
            <div className="animate-pulse">
                <div className="h-6 bg-[#171d2b]/10 rounded w-32 mb-4" />
                <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-3 border border-[#171d2b]/5 flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#171d2b]/10 rounded-lg shrink-0" />
                            <div className="flex-1">
                                <div className="h-4 bg-[#171d2b]/10 rounded w-3/4 mb-1.5" />
                                <div className="h-3 bg-[#171d2b]/5 rounded w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default async function DashboardPage() {
    // Server-side data fetch using cached RPC
    // This single call replaces 3 separate client-side fetches
    const dashboardData = await getDashboardData();

    return (
        <div>
            <Suspense fallback={<HeaderSkeleton />}>
                <DashboardHeader
                    initialData={dashboardData}
                />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                <div className="lg:col-span-2">
                    <Suspense fallback={<RecentActivitySkeleton />}>
                        <RecentActivity />
                    </Suspense>
                </div>

                <div className="lg:col-span-8">
                    <Suspense fallback={<StudyCalendarSkeleton />}>
                        <StudyCalendarWrapper />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

function HeaderSkeleton() {
    return (
        <header className="mb-6 animate-pulse">
            <div className="h-10 bg-[#171d2b]/10 rounded w-64 mb-2" />
            <div className="h-5 bg-[#171d2b]/5 rounded w-80" />
        </header>
    );
}


