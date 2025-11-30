"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { createClient } from "@/config/supabase/client";
import { useState, useCallback, useSyncExternalStore } from "react";

interface RecentFile {
    id: string;
    title: string;
    type: string;
    date: string;
    color: string;
}

const TYPE_COLORS: Record<string, string> = {
    flashcards: "bg-[#f5e6c8]",
    reviewer: "bg-[#e8e4d8]",
    quiz: "bg-[#e0dcd0]",
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
        <>
            <div className="col-span-2 md:col-span-3 lg:col-span-3 bg-white rounded-xl p-5 border border-[#171d2b]/5 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-[#171d2b]/5 rounded-full flex items-center justify-center mb-3">
                    <Clock size={20} className="text-[#171d2b]/30" />
                </div>
                <h3 className="font-sans font-medium text-[#171d2b] text-[15px] mb-1">No recent activity</h3>
                <p className="font-sans text-[12px] text-[#171d2b]/50 max-w-xs">
                    Your recent files will appear here.
                </p>
            </div>
            <CreateNewButton />
        </>
    );
}

function LoadingSkeleton() {
    return (
        <>
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl p-3 border border-[#171d2b]/5 animate-pulse">
                    <div className="w-9 h-9 rounded-lg bg-[#171d2b]/10 mb-2" />
                    <div className="h-4 bg-[#171d2b]/10 rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-[#171d2b]/5 rounded w-1/2" />
                </div>
            ))}
            <CreateNewButton />
        </>
    );
}

function CreateNewButton() {
    return (
        <Link
            href="/materials/create"
            className="group bg-[#171d2b]/5 rounded-xl p-3 border border-dashed border-[#171d2b]/20 hover:border-[#171d2b]/40 hover:bg-[#171d2b]/10 transition-all flex flex-col items-center justify-center gap-2 text-[#171d2b]/60 hover:text-[#171d2b] min-h-[120px]"
        >
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                <span className="text-xl font-light leading-none">+</span>
            </div>
            <span className="font-sans font-medium text-[13px]">Create New</span>
        </Link>
    );
}

export default function RecentFiles() {
    const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
    const [loading, setLoading] = useState(true);

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
                    .limit(3);

                // Fetch recent reviewers
                const { data: reviewers } = await supabase
                    .from("reviewers")
                    .select("id, title, updated_at")
                    .order("updated_at", { ascending: false })
                    .limit(3);

                if (!mounted) return;

                const files: RecentFile[] = [];

                if (flashcardSets) {
                    flashcardSets.forEach(set => {
                        files.push({
                            id: set.id,
                            title: set.title,
                            type: "Flashcards",
                            date: formatTimeAgo(new Date(set.last_studied || set.updated_at)),
                            color: TYPE_COLORS.flashcards,
                        });
                    });
                }

                if (reviewers) {
                    reviewers.forEach(rev => {
                        files.push({
                            id: rev.id,
                            title: rev.title,
                            type: "Reviewer",
                            date: formatTimeAgo(new Date(rev.updated_at)),
                            color: TYPE_COLORS.reviewer,
                        });
                    });
                }

                // Sort by most recent and take top 3
                files.sort((a, b) => {
                    const aTime = a.date.includes("Just") ? 0 : parseInt(a.date) || 999;
                    const bTime = b.date.includes("Just") ? 0 : parseInt(b.date) || 999;
                    return aTime - bTime;
                });

                setRecentFiles(files.slice(0, 3));
                setLoading(false);
            };

            fetchRecent();
            return () => { mounted = false; };
        }, []),
        () => null,
        () => null
    );

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif text-[24px] text-[#171d2b]">Recent Activity</h2>
                <Link href="/materials" className="text-[#171d2b]/60 hover:text-[#171d2b] text-sm font-sans transition-colors">
                    View all
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {loading ? (
                    <LoadingSkeleton />
                ) : recentFiles.length === 0 ? (
                    <EmptyState />
                ) : (
                    <>
                        {recentFiles.map((file) => (
                            <Link
                                key={file.id}
                                href={`/materials/${file.id}`}
                                className="group bg-white rounded-xl p-3 border border-[#171d2b]/5 hover:border-[#171d2b]/20 hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`w-9 h-9 rounded-lg ${file.color} flex items-center justify-center`} />
                                </div>

                                <h3 className="font-sans font-medium text-[#171d2b] text-[15px] mb-1 line-clamp-1 group-hover:text-[#171d2b]/70 transition-colors">
                                    {file.title}
                                </h3>

                                <div className="flex items-center gap-1.5 text-[#171d2b]/50 text-[11px] font-sans">
                                    <span>{file.type}</span>
                                    <span>·</span>
                                    <div className="flex items-center gap-1">
                                        <Clock size={11} />
                                        <span>{file.date}</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                        <CreateNewButton />
                    </>
                )}
            </div>
        </div>
    );
}
