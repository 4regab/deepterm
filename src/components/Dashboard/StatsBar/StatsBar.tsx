"use client";

import { Clock, Flame, Trophy } from "lucide-react";
import { useActivityStore } from "@/lib/stores";
import { StatTileSkeleton } from "@/components/ui/Skeleton";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconToneClass: string;
  loading?: boolean;
}

function StatCard({ label, value, icon, iconToneClass, loading }: StatCardProps) {
  if (loading) {
    return <StatTileSkeleton />;
  }

  return (
    <Card variant="flat" padding="md" className="flex flex-col justify-between">
      <CardHeader className="pb-2">
        <span className="caption text-muted font-medium">{label}</span>
        <div className={`grid size-8 place-items-center rounded-sm ${iconToneClass}`}>
          {icon}
        </div>
      </CardHeader>
      <CardBody>
        <p className="title-lg font-semibold tabular text-ink">{value}</p>
      </CardBody>
    </Card>
  );
}

export default function StatsBar() {
  const { stats, activity, loading } = useActivityStore();

  // Get today's date in YYYY-MM-DD format (local timezone)
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  // Find today's activity from the activity array (daily data)
  const todayActivity = activity.find((a) => a.activity_date === todayStr);
  const todayMinutes = todayActivity?.minutes_studied ?? 0;

  const currentStreak = stats?.current_streak ?? 0;
  const bestStreak = stats?.longest_streak ?? 0;

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Today's Study"
          value={`${todayMinutes} min`}
          icon={<Clock size={16} aria-hidden="true" />}
          iconToneClass="bg-brand-subtle text-brand-text"
          loading={loading}
        />
        <StatCard
          label="Current Streak"
          value={`${currentStreak} days`}
          icon={<Flame size={16} aria-hidden="true" />}
          iconToneClass="bg-warn-subtle text-warn-text"
          loading={loading}
        />
        <StatCard
          label="Best Streak"
          value={`${bestStreak} days`}
          icon={<Trophy size={16} aria-hidden="true" />}
          iconToneClass="bg-cards-subtle text-cards-text"
          loading={loading}
        />
      </div>
    </div>
  );
}
