"use client";

import Link from "next/link";
import { Clock, Plus } from "lucide-react";
import { createClient } from "@/config/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, TypeIcon, EmptyState } from "@/components/ui";
import { MaterialCardSkeleton } from "@/components/ui/Skeleton";
import type { ContentType } from "@/components/ui/tokens";

interface RecentFile {
  id: string;
  title: string;
  type: ContentType;
  date: string;
}

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

function CreateNewButton() {
  return (
    <Link
      href="/materials/create"
      className="group flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-default bg-surface/50 p-4 text-center text-muted hover:border-brand hover:bg-brand-subtle/30 hover:text-brand-text transition-all min-h-[130px]"
    >
      <div className="grid size-8 place-items-center rounded-full bg-brand-subtle text-brand-text group-hover:bg-brand group-hover:text-on-solid transition-colors">
        <Plus size={16} aria-hidden="true" />
      </div>
      <span className="label font-medium">Create New</span>
    </Link>
  );
}

export default function RecentFiles() {
  const router = useRouter();
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
        flashcardSetsResult.data.forEach((set) => {
          files.push({
            id: set.id,
            title: set.title,
            type: "Flashcards",
            date: formatTimeAgo(new Date(set.last_studied || set.updated_at)),
          });
        });
      }

      if (reviewersResult.data) {
        reviewersResult.data.forEach((reviewer) => {
          files.push({
            id: reviewer.id,
            title: reviewer.title,
            type: "Reviewer",
            date: formatTimeAgo(new Date(reviewer.updated_at)),
          });
        });
      }

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
        <h2 className="title font-semibold text-ink">Recent Activity</h2>
        <Link href="/materials" className="label text-brand-text hover:underline">
          View all
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            {[1, 2, 3].map((i) => (
              <MaterialCardSkeleton key={i} />
            ))}
            <CreateNewButton />
          </>
        ) : recentFiles.length === 0 ? (
          <div className="col-span-full">
            <EmptyState
              title="No recent files"
              description="Create flashcards or reviewers to start studying."
              actionLabel="Create Flashcards"
              onAction={() => router.push("/materials/create")}
            />
          </div>
        ) : (
          <>
            {recentFiles.map((file) => (
              <Card
                key={file.id}
                variant="interactive"
                accentType={file.type}
                padding="md"
                className="flex flex-col justify-between"
              >
                <div>
                  <div className="mb-2">
                    <TypeIcon type={file.type} size="sm" />
                  </div>
                  <Link href={`/materials/${file.id}`}>
                    <h3 className="subtitle font-semibold text-ink hover:text-brand transition-colors line-clamp-1">
                      {file.title}
                    </h3>
                  </Link>
                </div>
                <div className="flex items-center gap-1.5 text-muted caption pt-3 mt-2 border-t border-subtle">
                  <Clock size={12} aria-hidden="true" />
                  <span>{file.date}</span>
                </div>
              </Card>
            ))}
            <CreateNewButton />
          </>
        )}
      </div>
    </div>
  );
}
