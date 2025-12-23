import { Suspense, cache } from "react";
import { createServerSupabaseClient } from "@/config/supabase/server";
import MaterialsClient from "./MaterialsClient";
import type { MaterialItem } from "@/lib/schemas/materials";

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${diffWeeks}w ago`;
}

interface FlashcardCount {
    count: number;
}

interface ReviewerCategory {
    reviewer_terms?: { count: number }[];
}

// Cached server-side data fetch for materials
// React's cache() deduplicates calls within the same request lifecycle
const getMaterials = cache(async (): Promise<MaterialItem[]> => {
    const supabase = await createServerSupabaseClient();

    // Parallel fetch - efficient server-side data loading
    const [flashcardSetsResult, reviewersResult] = await Promise.all([
        supabase
            .from("flashcard_sets")
            // Optimized: only select needed columns + counts
            .select(`id, title, created_at, updated_at, flashcards(count)`)
            .order("updated_at", { ascending: false }),
        supabase
            .from("reviewers")
            // Optimized: only select needed columns + nested counts
            .select(`id, title, created_at, updated_at, reviewer_categories(reviewer_terms(count))`)
            .order("updated_at", { ascending: false })
    ]);

    const materials: MaterialItem[] = [];

    // Add flashcard sets
    if (flashcardSetsResult.data) {
        flashcardSetsResult.data.forEach((set: {
            id: string;
            title: string;
            created_at: string;
            updated_at: string | null;
            flashcards?: FlashcardCount[];
        }) => {
            const dateStr = set.updated_at || set.created_at;
            materials.push({
                id: set.id,
                title: set.title,
                type: "Flashcards",
                itemsCount: set.flashcards?.[0]?.count || 0,
                lastAccessed: formatTimeAgo(new Date(dateStr)),
                sortDate: dateStr,
            });
        });
    }

    // Add reviewers
    if (reviewersResult.data) {
        reviewersResult.data.forEach((reviewer: {
            id: string;
            title: string;
            created_at: string;
            updated_at: string | null;
            reviewer_categories?: ReviewerCategory[];
        }) => {
            const totalTerms = reviewer.reviewer_categories?.reduce((acc: number, cat: ReviewerCategory) => {
                return acc + (cat.reviewer_terms?.[0]?.count || 0);
            }, 0) || 0;

            const dateStr = reviewer.updated_at || reviewer.created_at;
            materials.push({
                id: reviewer.id,
                title: reviewer.title,
                type: "Reviewer",
                itemsCount: totalTerms,
                lastAccessed: formatTimeAgo(new Date(dateStr)),
                sortDate: dateStr,
            });
        });
    }

    // Sort by most recent
    materials.sort((a, b) => new Date(b.sortDate || 0).getTime() - new Date(a.sortDate || 0).getTime());

    return materials;
});

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#171d2b]/20 border-t-[#171d2b] rounded-full animate-spin" />
        </div>
    );
}

export default async function MaterialsPage() {
    const materials = await getMaterials();

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-4xl font-sora font-bold text-[#171d2b] mb-2">Materials</h1>
            </div>
            <Suspense fallback={<LoadingFallback />}>
                <MaterialsClient initialItems={materials} />
            </Suspense>
        </div>
    );
}
