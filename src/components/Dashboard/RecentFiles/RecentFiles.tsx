"use client";

import Link from "next/link";
import { Clock } from "lucide-react";
import { createClient } from "@/config/supabase/client";
import { useEffect, useState } from "react";

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
            <div className="col-span-2 md:col-span-3 lg:col-span-3 bg-white rounded-xl p-5 border border-border flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                    <Clock size={20} className="text-muted-foreground" />
                </div>
                <h3 className="font-sans font-medium text-foreground text-[15px] mb-1">No recent activity</h3>
                <p className="font-sans text-[12px] text-muted-foreground max-w-xs">
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
                <div key={i} className="bg-white rounded-xl p-3 border border-border animate-pulse">
                    <div className="w-9 h-9 rounded-lg bg-muted mb-2" />
                    <div className="h-4 bg-muted rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-muted rounded w-1/2" />
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
            className="group bg-muted rounded-xl p-3 border border-dashed border-border hover:border-primary/40 hover:bg-accent transition-all flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-foreground min-h-[120px]"
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

    useEffect(() => {
        let mounted = true;

        const fetchRecent = async () => {
            const supabase = createClient();
            const [flashcardSetsResult, reviewersResult] = await Promise.all([
                supabase
                    .from("flashcard_sets")
                    .select("id, title, updated_at, last_studied")
                    .order("updated_at", { ascending: false })
                    .limit(3),
                supabase
                    .from("reviewers")
                    .select("id, title, updated_at")
                    .order("updated_at", { ascending: false })
                    .limit(3),
            ]);

            if (!mounted) return;

            const files: RecentFile[] = [];

            if (flashcardSetsResult.data) {
                flashcardSetsResult.data.forEach(set => {
                    files.push({
                        id: set.id,
                        title: set.title,
                        type: "Flashcards",
                        date: formatTimeAgo(new Date(set.last_studied || set.updated_at)),
                        color: TYPE_COLORS.flashcards,
                    });
                });
            }

            if (reviewersResult.data) {
                reviewersResult.data.forEach(reviewer => {
                    files.push({
                        id: reviewer.id,
                        title: reviewer.title,
                        type: "Reviewer",
                        date: formatTimeAgo(new Date(reviewer.updated_at)),
                        color: TYPE_COLORS.reviewer,
                    });
                });
            }

            files.sort((a, b) => {
                const aTime = a.date.includes("Just") ? 0 : parseInt(a.date) || 999;
                const bTime = b.date.includes("Just") ? 0 : parseInt(b.date) || 999;
                return aTime - bTime;
            });

            setRecentFiles(files.slice(0, 3));
            setLoading(false);
        };

        void fetchRecent();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-sans tracking-tight text-[24px] text-foreground">Recent Activity</h2>
                <Link href="/materials" className="text-muted-foreground hover:text-foreground text-sm font-sans transition-colors">
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
                                className="group bg-white rounded-xl p-3 border border-border hover:border-border hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`w-9 h-9 rounded-lg ${file.color} flex items-center justify-center`} />
                                </div>

                                <h3 className="font-sans font-medium text-foreground text-[15px] mb-1 line-clamp-1 group-hover:text-foreground/70 transition-colors">
                                    {file.title}
                                </h3>

                                <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] font-sans">
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
