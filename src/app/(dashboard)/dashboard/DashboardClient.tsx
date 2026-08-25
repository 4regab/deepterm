"use client";

import { useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import {
  Clock,
  Flame,
  Trophy,
  Zap,
  ArrowRight,
  Plus,
  Sparkles,
} from "lucide-react";
import { getRankTitle } from "@/utils/xp";
import { useActivityStore } from "@/lib/stores";
import { cn } from "@/lib/cn";
import {
  Card,
  CardBody,
  CardHeader,
  ButtonLink,
  Badge,
  TypeIcon,
  SegmentedProgress,
  ProgressBar,
  EmptyState,
} from "@/components/ui";
import { CalendarSkeleton } from "@/components/ui/Skeleton";
import type { MaterialItem } from "@/lib/schemas/materials";

function toContentType(type: string): "Flashcards" | "Reviewer" | "Practice" {
  if (type === "Flashcards") return "Flashcards";
  if (type === "Practice") return "Practice";
  return "Reviewer";
}

// Dynamic import for study calendar with unified CalendarSkeleton fallback
const DynamicStudyCalendar = dynamic(
  () => import("@/components/Dashboard/StudyCalendar/StudyCalendar"),
  {
    loading: () => <CalendarSkeleton weeks={6} />,
    ssr: false,
  }
);

export function StudyCalendarWrapper() {
  return <DynamicStudyCalendar />;
}

export interface HeroDeckInfo {
  id: string;
  title: string;
  type: "Flashcards" | "Reviewer";
  folderName?: string | null;
  lastStudied?: string | null;
  dueCount: number;
  learningCount: number;
  masteredCount: number;
  newCount: number;
  totalCards: number;
  studyUrl: string;
  browseUrl: string;
}

export interface DueStats {
  totalDueCards: number;
  dueSetsCount: number;
}

export interface DashboardData {
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

interface DashboardClientProps {
  initialData?: DashboardData | null;
  recentMaterials?: MaterialItem[];
  heroDeck?: HeroDeckInfo | null;
  dueStats?: DueStats;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return "Hello";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

export function DashboardHeader({ initialData }: { initialData?: DashboardData | null }) {
  const greeting = getGreeting();
  const firstName = initialData?.profile?.full_name?.split(" ")[0] || "there";

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="display-lg tracking-tight text-ink">
          {greeting}, {firstName}
        </h1>
        <p className="body text-muted mt-1">Pick up where you left off.</p>
      </div>

      <ButtonLink href="/materials/create" size="sm" variant="primary" className="gap-1.5">
        <Plus size={16} aria-hidden="true" />
        <span>Create Material</span>
      </ButtonLink>
    </div>
  );
}

export function DueTodayList() {
  return null;
}

export default function DashboardClient({
  initialData,
  recentMaterials = [],
  heroDeck = null,
  dueStats = { totalDueCards: 0, dueSetsCount: 0 },
}: DashboardClientProps) {
  const router = useRouter();
  const greeting = getGreeting();

  const { activity, fetchActivity } = useActivityStore();

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  // Compute today's minutes from client-side activity store (timezone-correct)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const todayActivity = activity.find((a) => a.activity_date === todayStr);
  const clientTodayMinutes = todayActivity?.minutes_studied;

  const firstName = initialData?.profile?.full_name?.split(" ")[0] || "there";
  const level = initialData?.xp?.current_level || 1;
  const xpInLevel = initialData?.xp?.xp_in_level || 0;
  const xpForNext = initialData?.xp?.xp_for_next || 100;
  const rankTitle = getRankTitle(level);

  const todayMinutes = clientTodayMinutes ?? initialData?.stats?.today_study_minutes ?? 0;
  const currentStreak = initialData?.stats?.current_streak ?? 0;
  const longestStreak = initialData?.stats?.longest_streak ?? 0;
  const flashcardsMastered = initialData?.stats?.flashcards_mastered ?? 0;
  const quizzesCompleted = initialData?.stats?.quizzes_completed ?? 0;
  const totalStudyMinutes = initialData?.stats?.total_study_minutes ?? 0;
  const pomodoroSessions = initialData?.stats?.pomodoro_sessions ?? 0;

  // Compute actionable summary message
  let summarySubtitle: string;
  if (dueStats.totalDueCards > 0) {
    summarySubtitle = `You have ${dueStats.totalDueCards} card${
      dueStats.totalDueCards === 1 ? "" : "s"
    } due for review today across ${dueStats.dueSetsCount} set${
      dueStats.dueSetsCount === 1 ? "" : "s"
    }. Let's get them done!`;
  } else if (recentMaterials.length > 0 || heroDeck) {
    summarySubtitle = "All caught up! Ready to learn something new?";
  } else {
    summarySubtitle = "Welcome to DeepTerm! Create your first study set to get started.";
  }

  const hasMaterials = Boolean(heroDeck || recentMaterials.length > 0);

  return (
    <div className="space-y-8">
      {/* 1. Greeting & Summary Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="display-lg tracking-tight text-ink">
            {greeting}, {firstName}
          </h1>
          <p className="body text-muted mt-1.5 max-w-prose">{summarySubtitle}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ButtonLink href="/materials/create" size="md" variant="primary" className="gap-2">
            <Plus size={18} aria-hidden="true" />
            <span>Create</span>
          </ButtonLink>
        </div>
      </header>

      {/* 2. "Continue Studying" Hero Card (Above the fold) */}
      <section aria-labelledby="continue-studying-title">
        <h2 id="continue-studying-title" className="sr-only">
          Continue Studying
        </h2>

        {heroDeck ? (
          <Card
            variant="accent"
            accentType={heroDeck.type}
            padding="lg"
            className="shadow-[var(--elev-1)]"
          >
            <div className="flex flex-col gap-4">
              {/* Top metadata row */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TypeIcon type={heroDeck.type} size="sm" />
                  <Badge tone={heroDeck.type === "Flashcards" ? "cards" : "reviewer"}>
                    {heroDeck.type}
                  </Badge>
                  {heroDeck.folderName && <Badge tone="neutral">{heroDeck.folderName}</Badge>}
                  {heroDeck.lastStudied && (
                    <span className="caption text-muted hidden sm:inline">
                      Studied {heroDeck.lastStudied}
                    </span>
                  )}
                </div>

                {heroDeck.dueCount > 0 ? (
                  <Badge tone="warn" solid>
                    {heroDeck.dueCount} cards due
                  </Badge>
                ) : (
                  <Badge tone="success">Up to date</Badge>
                )}
              </div>

              {/* Title */}
              <div>
                <Link
                  href={heroDeck.browseUrl}
                  className="title font-semibold text-ink hover:text-brand transition-colors block leading-snug line-clamp-2 break-words"
                  title={heroDeck.title}
                >
                  {heroDeck.title}
                </Link>
              </div>

              {/* Mastery Progress Bar */}
              <div className="space-y-2">
                <SegmentedProgress
                  counts={{
                    new: heroDeck.newCount,
                    learning: heroDeck.learningCount,
                    mastered: heroDeck.masteredCount,
                  }}
                  className="h-2"
                />

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                  <span className="flex items-center gap-1.5 text-secondary">
                    <span className="size-2 rounded-full bg-success" aria-hidden="true" />
                    <strong className="text-ink font-semibold tabular">
                      {heroDeck.masteredCount}
                    </strong>{" "}
                    mastered
                  </span>
                  <span className="flex items-center gap-1.5 text-secondary">
                    <span className="size-2 rounded-full bg-warn/60" aria-hidden="true" />
                    <strong className="text-ink font-semibold tabular">
                      {heroDeck.learningCount}
                    </strong>{" "}
                    learning
                  </span>
                  <span className="flex items-center gap-1.5 text-secondary">
                    <span className="size-2 rounded-full bg-surface-sunken" aria-hidden="true" />
                    <strong className="text-ink font-semibold tabular">
                      {heroDeck.newCount}
                    </strong>{" "}
                    new
                  </span>
                  <span className="ml-auto caption text-muted">
                    {heroDeck.totalCards} total {heroDeck.type === "Flashcards" ? "cards" : "terms"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <ButtonLink
                  href={heroDeck.studyUrl}
                  size="md"
                  variant="primary"
                  className="gap-2 font-semibold"
                >
                  <span>Resume Learn</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </ButtonLink>

                <ButtonLink href={heroDeck.browseUrl} size="md" variant="secondary">
                  Browse set
                </ButtonLink>

                {heroDeck.type === "Flashcards" && (
                  <ButtonLink
                    href={`/materials/${heroDeck.id}/flashcards`}
                    size="md"
                    variant="ghost"
                  >
                    Flashcards mode
                  </ButtonLink>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <Card variant="flat" padding="none">
            <EmptyState
              title="Ready to study smarter?"
              description="Transform lecture notes, PDFs, or paste text into flashcard decks, reviewers, and practice tests."
              icon={<Sparkles size={28} className="text-brand-text" />}
              actionLabel="Create Flashcards"
              onAction={() => router.push("/materials/create?mode=flashcards")}
              secondaryActionLabel="Upload Document"
              onSecondaryAction={() => router.push("/materials/create?source=document")}
            />
          </Card>
        )}
      </section>

      {/* 3. 4-Column Stat Tiles Grid */}
      <section aria-labelledby="stats-title">
        <h2 id="stats-title" className="sr-only">
          Study Statistics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Tile 1: Today's Study */}
          <Card variant="flat" padding="md" className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <span className="caption text-muted font-medium">Today&apos;s Study</span>
              <div className="grid size-8 place-items-center rounded-sm bg-brand-subtle text-brand-text">
                <Clock size={16} aria-hidden="true" />
              </div>
            </CardHeader>
            <CardBody>
              <p className="title-lg font-semibold tabular text-ink">{todayMinutes} min</p>
              <p className="caption text-muted mt-1">
                {pomodoroSessions > 0
                  ? `${pomodoroSessions} pomodoro session${pomodoroSessions === 1 ? "" : "s"}`
                  : `All-time: ${totalStudyMinutes}m`}
              </p>
            </CardBody>
          </Card>

          {/* Tile 2: Current Streak */}
          <Card variant="flat" padding="md" className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <span className="caption text-muted font-medium">Current Streak</span>
              <div className="grid size-8 place-items-center rounded-sm bg-warn-subtle text-warn-text">
                <Flame size={16} aria-hidden="true" />
              </div>
            </CardHeader>
            <CardBody>
              <p className="title-lg font-semibold tabular text-ink">{currentStreak} days</p>
              <p className="caption text-muted mt-1">Best streak: {longestStreak} days</p>
            </CardBody>
          </Card>

          {/* Tile 3: Mastered Cards */}
          <Card variant="flat" padding="md" className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <span className="caption text-muted font-medium">Mastered Cards</span>
              <div className="grid size-8 place-items-center rounded-sm bg-cards-subtle text-cards-text">
                <Trophy size={16} aria-hidden="true" />
              </div>
            </CardHeader>
            <CardBody>
              <p className="title-lg font-semibold tabular text-ink">{flashcardsMastered} cards</p>
              <p className="caption text-muted mt-1">{quizzesCompleted} quizzes completed</p>
            </CardBody>
          </Card>

          {/* Tile 4: XP & Level */}
          <Card variant="flat" padding="md" className="flex flex-col justify-between">
            <CardHeader className="pb-2">
              <span className="caption text-muted font-medium">
                Level {level} · {rankTitle}
              </span>
              <div className="grid size-8 place-items-center rounded-sm bg-practice-subtle text-practice-text">
                <Zap size={16} aria-hidden="true" />
              </div>
            </CardHeader>
            <CardBody>
              <p className="subtitle font-semibold tabular text-ink">
                {xpInLevel} / {xpForNext} XP
              </p>
              <ProgressBar
                value={xpInLevel}
                max={xpForNext}
                size="xs"
                tone="practice"
                label="XP level progress"
                className="mt-2.5"
              />
            </CardBody>
          </Card>
        </div>
      </section>

      {/* 4. "Jump Back In" Recent Materials Section */}
      {hasMaterials && (
        <section aria-labelledby="jump-back-in-title" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="jump-back-in-title" className="title font-semibold text-ink">
              Jump Back In
            </h2>
            <Link
              href="/materials"
              className="label text-brand-text hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentMaterials.slice(0, 3).map((material) => (
              <Card
                key={material.id}
                variant="interactive"
                accentType={toContentType(material.type)}
                padding="md"
                className="flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <TypeIcon type={toContentType(material.type)} size="sm" />
                    {material.folderName && (
                      <Badge tone="neutral" className="truncate max-w-[120px]">
                        {material.folderName}
                      </Badge>
                    )}
                  </div>

                  <Link href={`/materials/${material.id}`} className="block">
                    <h3
                      className="subtitle font-semibold text-ink group-hover:text-brand transition-colors line-clamp-2 break-words"
                      title={material.title}
                    >
                      {material.title}
                    </h3>
                  </Link>

                  <p className="caption text-muted mt-1">
                    {material.itemsCount} {material.type === "Flashcards" ? "cards" : "terms"} ·{" "}
                    {material.lastAccessed}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-4 mt-2 border-t border-subtle">
                  {material.type === "Flashcards" ? (
                    <>
                      <ButtonLink
                        href={`/materials/${material.id}/learn`}
                        size="xs"
                        variant="primary"
                        className="flex-1"
                      >
                        Learn
                      </ButtonLink>
                      <ButtonLink
                        href={`/materials/${material.id}/flashcards`}
                        size="xs"
                        variant="secondary"
                      >
                        Cards
                      </ButtonLink>
                    </>
                  ) : (
                    <>
                      <ButtonLink
                        href={`/materials/${material.id}`}
                        size="xs"
                        variant="primary"
                        className="flex-1"
                      >
                        Review
                      </ButtonLink>
                      <ButtonLink
                        href={`/materials/${material.id}/practice`}
                        size="xs"
                        variant="secondary"
                      >
                        Practice
                      </ButtonLink>
                    </>
                  )}
                </div>
              </Card>
            ))}

            {/* Create New Material Tile */}
            <Link
              href="/materials/create"
              className={cn(
                "group flex flex-col items-center justify-center gap-2.5 rounded-lg border border-dashed border-default bg-surface/60 p-5 text-center",
                "transition-all duration-[var(--dur-fast)] hover:border-brand hover:bg-brand-subtle/30",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] min-h-[150px]"
              )}
            >
              <div className="grid size-9 place-items-center rounded-full bg-brand-subtle text-brand-text group-hover:bg-brand group-hover:text-on-solid transition-colors shadow-xs">
                <Plus size={18} aria-hidden="true" />
              </div>
              <div>
                <p className="label font-semibold text-ink group-hover:text-brand transition-colors">
                  Create New Material
                </p>
                <p className="caption text-muted mt-0.5">Flashcards or Reviewer</p>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* 5. Study Activity & History (Heatmap) */}
      <section aria-labelledby="study-history-title" className="pt-2">
        <h2 id="study-history-title" className="sr-only">
          Study Activity & History
        </h2>
        <StudyCalendarWrapper />
      </section>
    </div>
  );
}
