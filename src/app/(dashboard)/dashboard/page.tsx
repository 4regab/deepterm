"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { RecentActivity } from "@/components/Dashboard";
import { DashboardHeader } from "./DashboardClient";

// Dynamic imports for heavy components with loading fallbacks
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

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 5) return "Hello";
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    if (hour < 21) return "Good evening";
    return "Good night";
}

export default function DashboardPage() {
    const greeting = getGreeting();

    return (
        <div>
            <Suspense fallback={<HeaderSkeleton />}>
                <DashboardHeader greeting={greeting} />
            </Suspense>

            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
                <div className="lg:col-span-2">
                    <Suspense fallback={<RecentActivitySkeleton />}>
                        <RecentActivity />
                    </Suspense>
                </div>

                <div className="lg:col-span-8">
                    <Suspense fallback={<StudyCalendarSkeleton />}>
                        <DynamicStudyCalendar />
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


