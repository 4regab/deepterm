import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/config/supabase/server";
import MaterialDetailClient, { MaterialData, Term, ReviewerCategory } from "./MaterialDetailClient";
import { asQueryData, selectWithOptionalColumn } from "@/utils/optionalColumn";
import { sanitizeFolder } from "@/utils/materialFolder";

interface PageProps {
    params: Promise<{ id: string }>;
}

type MaterialResult = 
    | { type: 'flashcard'; material: MaterialData; terms: Term[] }
    | { type: 'reviewer'; material: MaterialData; categories: ReviewerCategory[] };

async function getMaterial(id: string): Promise<MaterialResult | null> {
    const supabase = await createServerSupabaseClient();

    const { data: flashcardSet } = await selectWithOptionalColumn<{
        id: string;
        title: string;
        updated_at: string;
        folder?: string | null;
    }>(
        async () => asQueryData(await supabase.from("flashcard_sets").select("id, title, updated_at, folder").eq("id", id).single()),
        async () => asQueryData(await supabase.from("flashcard_sets").select("id, title, updated_at").eq("id", id).single()),
        "folder",
    );

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
            folder: sanitizeFolder(flashcardSet.folder),
        };

        return { type: 'flashcard', material, terms };
    }

    const { data: reviewer } = await selectWithOptionalColumn<{
        id: string;
        title: string;
        updated_at: string;
        folder?: string | null;
    }>(
        async () => asQueryData(await supabase.from("reviewers").select("id, title, updated_at, folder").eq("id", id).single()),
        async () => asQueryData(await supabase.from("reviewers").select("id, title, updated_at").eq("id", id).single()),
        "folder",
    );

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
            folder: sanitizeFolder(reviewer.folder),
        };

        return { type: 'reviewer', material, categories: reviewerCategories };
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
                />
            ) : (
                <MaterialDetailClient 
                    materialType="reviewer"
                    material={data.material} 
                    initialCategories={data.categories} 
                />
            )}
        </Suspense>
    );
}
