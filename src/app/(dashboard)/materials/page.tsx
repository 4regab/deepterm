import { Suspense, cache } from "react";
import { createServerSupabaseClient } from "@/config/supabase/server";
import MaterialsClient from "./MaterialsClient";
import type { Folder, MaterialItem } from "@/lib/schemas/materials";
import { getSession } from "@/lib/auth/session";
import {
    MATERIAL_SELECT,
    sortMaterialsByRecency,
    toFlashcardSetItem,
    toFolderList,
    toReviewerItem,
    type FlashcardSetRow,
    type ReviewerRow,
} from "@/lib/materials/queries";
import { describeDbError } from "@/utils/dbError";
import { MaterialRowSkeleton } from "@/components/ui/Skeleton";

interface MaterialsPayload {
    materials: MaterialItem[];
    folders: Folder[];
    userId: string | null;
    loadError: string | null;
}

// Cached server-side data fetch for materials
// React's cache() deduplicates calls within the same request lifecycle
const getMaterials = cache(async (): Promise<MaterialsPayload> => {
    const supabase = await createServerSupabaseClient();
    const { userId } = await getSession();

    const [flashcardSetsResult, reviewersResult, foldersResult] = await Promise.all([
        supabase
            .from("flashcard_sets")
            .select(MATERIAL_SELECT.flashcardSets)
            .order("updated_at", { ascending: false }),
        supabase
            .from("reviewers")
            .select(MATERIAL_SELECT.reviewers)
            .order("updated_at", { ascending: false }),
        supabase
            .from("folders")
            .select(MATERIAL_SELECT.folders)
            .order("name", { ascending: true }),
    ]);

    // A failed read used to fall back to an empty list, which looks exactly
    // like an empty library. Surface it instead.
    const firstError =
        flashcardSetsResult.error ?? reviewersResult.error ?? foldersResult.error;
    if (firstError) {
        return {
            materials: [],
            folders: [],
            userId,
            loadError: describeDbError(firstError, "Could not load your library."),
        };
    }

    const flashcardRows = (flashcardSetsResult.data ?? []) as unknown as FlashcardSetRow[];
    const reviewerRows = (reviewersResult.data ?? []) as unknown as ReviewerRow[];
    const folderRows = (foldersResult.data ?? []) as unknown as Array<{
        id: string;
        name: string;
        created_at?: string | null;
    }>;

    const materials = sortMaterialsByRecency([
        ...flashcardRows.map((row) => toFlashcardSetItem(row)),
        ...reviewerRows.map((row) => toReviewerItem(row)),
    ]);

    return { materials, folders: toFolderList(folderRows), userId, loadError: null };
});

function LoadingFallback() {
    return (
        <div className="space-y-3 pt-6">
            <MaterialRowSkeleton />
            <MaterialRowSkeleton />
            <MaterialRowSkeleton />
            <MaterialRowSkeleton />
        </div>
    );
}

export default async function MaterialsPage() {
    const { materials, folders, userId, loadError } = await getMaterials();

    return (
        <div className="w-full">
            <Suspense fallback={<LoadingFallback />}>
                <MaterialsClient
                    initialItems={materials}
                    initialFolders={folders}
                    userId={userId}
                    loadError={loadError}
                />
            </Suspense>
        </div>
    );
}
