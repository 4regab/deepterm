import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/config/supabase/server";
import MaterialDetailClient, { MaterialData, Term, ReviewerCategory } from "./MaterialDetailClient";
import type { Folder } from "@/lib/schemas/materials";
import { MATERIAL_SELECT, toFolderList } from "@/lib/materials/queries";

interface PageProps {
    params: Promise<{ id: string }>;
}

interface MaterialDetailRow {
    id: string;
    title: string;
    updated_at: string;
    folder_id: string | null;
    folder?: { id: string; name: string } | null;
}

type MaterialResult =
    | { type: 'flashcard'; material: MaterialData; terms: Term[]; folders: Folder[] }
    | { type: 'reviewer'; material: MaterialData; categories: ReviewerCategory[]; folders: Folder[] };

async function getFolders(): Promise<Folder[]> {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
        .from("folders")
        .select(MATERIAL_SELECT.folders)
        .order("name", { ascending: true });
    return toFolderList((data ?? []) as unknown as Array<{ id: string; name: string; created_at?: string | null }>);
}

async function getMaterial(id: string): Promise<MaterialResult | null> {
    const supabase = await createServerSupabaseClient();

    const { data: flashcardSetData } = await supabase
        .from("flashcard_sets")
        .select(MATERIAL_SELECT.flashcardSetDetail)
        .eq("id", id)
        .single();
    const flashcardSet = flashcardSetData as unknown as MaterialDetailRow | null;

    if (flashcardSet) {
        const { data: flashcards } = await supabase
            .from("flashcards")
            .select("id, front, back, status")
            .eq("set_id", id)
            .order("created_at");

        const terms: Term[] = (flashcards || []).map(card => ({
            id: card.id,
            front: card.front,
            back: card.back,
            stage: (card.status || 'new') as Term['stage'],
        }));

        const material: MaterialData = {
            id: flashcardSet.id,
            title: flashcardSet.title,
            updated_at: flashcardSet.updated_at,
            folderId: flashcardSet.folder_id ?? null,
            folderName: flashcardSet.folder?.name ?? null,
        };

        return { type: 'flashcard', material, terms, folders: await getFolders() };
    }

    const { data: reviewerData } = await supabase
        .from("reviewers")
        .select(MATERIAL_SELECT.reviewerDetail)
        .eq("id", id)
        .single();
    const reviewer = reviewerData as unknown as MaterialDetailRow | null;

    if (reviewer) {
        const { data: categories } = await supabase
            .from("reviewer_categories")
            .select("id, name, color, reviewer_terms(id, term, definition)")
            .eq("reviewer_id", id)
            .order("created_at");

        const reviewerCategories: ReviewerCategory[] = (categories || []).map(cat => ({
            id: cat.id,
            name: cat.name,
            color: cat.color || '#E0F2FE',
            terms: (cat.reviewer_terms || []).map((t: { id: string; term: string; definition: string }) => ({
                id: t.id,
                term: t.term,
                definition: t.definition,
            })),
        }));

        const material: MaterialData = {
            id: reviewer.id,
            title: reviewer.title,
            updated_at: reviewer.updated_at,
            folderId: reviewer.folder_id ?? null,
            folderName: reviewer.folder?.name ?? null,
        };

        return { type: 'reviewer', material, categories: reviewerCategories, folders: await getFolders() };
    }

    return null;
}

function LoadingFallback() {
    return (
        <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-border border-t-[var(--ink)] rounded-full animate-spin" />
        </div>
    );
}

export default async function MaterialPage({ params }: PageProps) {
    const { id } = await params;
    const data = await getMaterial(id);

    if (!data) {
        notFound();
    }

    return (
        <Suspense fallback={<LoadingFallback />}>
            {data.type === 'flashcard' ? (
                <MaterialDetailClient 
                    materialType="flashcard"
                    material={data.material} 
                    initialTerms={data.terms} 
                    folders={data.folders}
                />
            ) : (
                <MaterialDetailClient 
                    materialType="reviewer"
                    material={data.material} 
                    initialCategories={data.categories} 
                    folders={data.folders}
                />
            )}
        </Suspense>
    );
}
