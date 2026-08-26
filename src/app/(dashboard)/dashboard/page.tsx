import { cache } from "react";
import { getAuthenticatedClient } from "@/lib/auth/session";
import DashboardClient, {
  type DashboardData,
  type DueStats,
  type HeroDeckInfo,
} from "./DashboardClient";
import {
  MATERIAL_SELECT,
  sortMaterialsByRecency,
  toReviewerItem,
  type ReviewerRow,
} from "@/lib/materials/queries";
import type { MaterialItem } from "@/lib/schemas/materials";

export const dynamic = "force-dynamic";

interface FlashcardDueRow {
  id: string;
  set_id: string;
  front: string;
  status: string | null;
  due_at: string | null;
}

interface FlashcardItemSummary {
  id: string;
  status: string | null;
  due_at: string | null;
}

interface FlashcardSetWithCardsRow {
  id: string;
  title: string;
  created_at: string;
  updated_at: string | null;
  last_studied: string | null;
  folder_id: string | null;
  folder?: { id: string; name: string } | null;
  flashcards?: FlashcardItemSummary[];
}

const getDashboardData = cache(async () => {
  const { supabase, isAuthenticated, userId } = await getAuthenticatedClient();

  if (!isAuthenticated || !userId) {
    return {
      dashboardData: null,
      recentMaterials: [],
      heroDeck: null,
      dueStats: { totalDueCards: 0, dueSetsCount: 0 },
    };
  }

  const [
    dashboardResult,
    flashcardSetsResult,
    reviewersResult,
    dueCardsResult,
  ] = await Promise.all([
    supabase.rpc("get_dashboard_data"),
    supabase
      .from("flashcard_sets")
      .select(
        "id, title, created_at, updated_at, last_studied, folder_id, folder:folders(id, name), flashcards(id, status, due_at)"
      )
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("reviewers")
      .select(MATERIAL_SELECT.reviewers)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("flashcards")
      .select("id, set_id, front, due_at, status")
      .lte("due_at", new Date().toISOString())
      .neq("status", "mastered")
      .limit(100),
  ]);

  if (dashboardResult.error) {
    console.error("[dashboard] get_dashboard_data failed:", dashboardResult.error.message);
  }
  if (flashcardSetsResult.error) {
    console.error("[dashboard] flashcard sets failed:", flashcardSetsResult.error.message);
  }
  if (reviewersResult.error) {
    console.error("[dashboard] reviewers failed:", reviewersResult.error.message);
  }
  if (dueCardsResult.error) {
    console.error("[dashboard] due cards failed:", dueCardsResult.error.message);
  }

  const dashboardData = (dashboardResult.data as DashboardData | null) ?? null;

  const rawFlashcardSets = (flashcardSetsResult.data ?? []) as unknown as FlashcardSetWithCardsRow[];
  const rawReviewers = (reviewersResult.data ?? []) as unknown as ReviewerRow[];
  const dueCards = (dueCardsResult.data ?? []) as unknown as FlashcardDueRow[];

  // Compute due sets count and total due cards
  const dueSetIds = new Set(dueCards.map((c) => c.set_id));
  const dueStats: DueStats = {
    totalDueCards: dueCards.length,
    dueSetsCount: dueSetIds.size,
  };

  // Convert to MaterialItems for the recent materials list
  const recentMaterials: MaterialItem[] = sortMaterialsByRecency([
    ...rawFlashcardSets.map((row) => ({
      id: row.id,
      title: row.title,
      type: "Flashcards" as const,
      itemsCount: row.flashcards?.length ?? 0,
      lastAccessed: row.last_studied
        ? new Date(row.last_studied).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : row.updated_at
        ? new Date(row.updated_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : "Recently",
      sortDate: row.last_studied || row.updated_at || row.created_at,
      folderId: row.folder_id,
      folderName: row.folder?.name ?? null,
    })),
    ...rawReviewers.map((row) => toReviewerItem(row)),
  ]);

  // Determine Hero Deck:
  // 1. Deck with highest due count
  // 2. Or most recently studied/updated deck
  let heroDeck: HeroDeckInfo | null = null;

  if (rawFlashcardSets.length > 0) {
    const setsWithDue = rawFlashcardSets.map((set) => {
      const cards = set.flashcards ?? [];
      const now = new Date().toISOString();
      const dueCardsInSet = cards.filter(
        (c) => c.due_at && c.due_at <= now && c.status !== "mastered"
      );
      const masteredCards = cards.filter((c) => c.status === "mastered");
      const learningCards = cards.filter(
        (c) => c.status === "learning" || c.status === "review"
      );
      const newCards = cards.filter(
        (c) => c.status === "new" || !c.status
      );

      return {
        set,
        cards,
        dueCount: dueCardsInSet.length,
        masteredCount: masteredCards.length,
        learningCount: learningCards.length,
        newCount: newCards.length,
        totalCards: cards.length,
        sortTime: new Date(set.last_studied || set.updated_at || set.created_at).getTime(),
      };
    });

    // Sort by due count descending, then by sortTime descending
    setsWithDue.sort((a, b) => {
      if (b.dueCount !== a.dueCount) {
        return b.dueCount - a.dueCount;
      }
      return b.sortTime - a.sortTime;
    });

    const bestSet = setsWithDue[0];
    if (bestSet && bestSet.totalCards > 0) {
      heroDeck = {
        id: bestSet.set.id,
        title: bestSet.set.title,
        type: "Flashcards",
        folderName: bestSet.set.folder?.name ?? null,
        lastStudied: bestSet.set.last_studied
          ? new Date(bestSet.set.last_studied).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })
          : null,
        dueCount: bestSet.dueCount,
        learningCount: bestSet.learningCount,
        masteredCount: bestSet.masteredCount,
        newCount: bestSet.newCount,
        totalCards: bestSet.totalCards,
        studyUrl: `/materials/${bestSet.set.id}/learn`,
        browseUrl: `/materials/${bestSet.set.id}`,
      };
    }
  }

  // Fallback: If no flashcard hero, check if any reviewer exists
  if (!heroDeck && rawReviewers.length > 0) {
    const reviewer = rawReviewers[0];
    const totalTerms =
      reviewer.reviewer_categories?.reduce(
        (acc, cat) => acc + (cat.reviewer_terms?.[0]?.count ?? 0),
        0
      ) ?? 0;

    heroDeck = {
      id: reviewer.id,
      title: reviewer.title,
      type: "Reviewer",
      folderName: reviewer.folder?.name ?? null,
      lastStudied: reviewer.updated_at
        ? new Date(reviewer.updated_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })
        : null,
      dueCount: 0,
      learningCount: 0,
      masteredCount: 0,
      newCount: totalTerms,
      totalCards: totalTerms,
      studyUrl: `/materials/${reviewer.id}`,
      browseUrl: `/materials/${reviewer.id}`,
    };
  }

  return {
    dashboardData,
    recentMaterials,
    heroDeck,
    dueStats,
  };
});

export default async function DashboardPage() {
  const { dashboardData, recentMaterials, heroDeck, dueStats } =
    await getDashboardData();

  return (
    <DashboardClient
      initialData={dashboardData}
      recentMaterials={recentMaterials}
      heroDeck={heroDeck}
      dueStats={dueStats}
    />
  );
}
