"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { useActivityStore } from "@/lib/stores";
import { generateMonthGrid, type CalendarDay } from "@/utils/calendar";
import { CalendarSkeleton } from "@/components/ui/Skeleton";
import { IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";

const LEVEL_STYLES = [
  "bg-surface-sunken text-secondary",
  "bg-brand-subtle text-brand-text font-medium",
  "bg-[#c7d2fe] text-[#3730a3] font-semibold",
  "bg-[#818cf8] text-white font-semibold",
  "bg-brand text-on-solid font-semibold",
] as const;

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface CalendarDayCellProps {
  day: CalendarDay;
  selected: boolean;
  onSelect: (day: CalendarDay) => void;
}

function CalendarDayCell({ day, selected, onSelect }: CalendarDayCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const isToday = day.isToday;
  const isCurrentMonth = day.isCurrentMonth;

  return (
    <div className="relative aspect-square">
      <button
        type="button"
        className={cn(
          "size-full flex flex-col items-center justify-center rounded-xs text-xs transition-all",
          "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--focus)]",
          !isCurrentMonth && "opacity-25 pointer-events-none",
          isCurrentMonth && LEVEL_STYLES[day.level],
          isCurrentMonth && "cursor-pointer hover:scale-105 active:scale-95",
          selected && "ring-2 ring-ink ring-offset-1 ring-offset-surface",
          isToday && !selected && "ring-2 ring-brand ring-offset-1 ring-offset-surface"
        )}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => isCurrentMonth && onSelect(day)}
        disabled={!isCurrentMonth}
        aria-label={`${day.date.toLocaleDateString()}: ${day.minutesStudied} minutes studied`}
      >
        <span>{day.dayOfMonth}</span>
        {isToday && (
          <span className="size-1 rounded-full bg-current mt-0.5" aria-hidden="true" />
        )}
      </button>

      {showTooltip && isCurrentMonth && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-surface-inverse text-on-solid text-xs rounded-xs whitespace-nowrap z-30 shadow-[var(--elev-2)] pointer-events-none"
        >
          <div className="font-medium">
            {day.minutesStudied > 0 ? `${day.minutesStudied}m studied` : "No activity"}
          </div>
          <div className="caption text-muted text-[10px]">
            {day.date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudyCalendar() {
  const { activity, loading } = useActivityStore();
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<CalendarDay | null>(null);

  const grid = generateMonthGrid(currentYear, currentMonth, activity);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  if (loading) {
    return <CalendarSkeleton weeks={6} />;
  }

  return (
    <div className="rounded-lg border border-default bg-surface shadow-[var(--elev-0)] overflow-hidden flex flex-col h-full">
      {/* Card Header & Month Navigation */}
      <div className="flex items-center justify-between border-b border-subtle px-4 py-3 bg-surface">
        <div className="flex items-center gap-2">
          <CalendarIcon size={18} className="text-secondary" aria-hidden="true" />
          <h3 className="subtitle font-semibold text-ink">Study History</h3>
        </div>

        <div className="flex items-center gap-2">
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handlePrevMonth}
            aria-label="Previous month"
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </IconButton>
          <span className="body-sm font-semibold text-ink min-w-[120px] text-center">
            {MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight size={16} aria-hidden="true" />
          </IconButton>
        </div>
      </div>

      {/* Grid Content */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {DAY_HEADERS.map((day) => (
            <div key={day} className="caption text-muted font-medium py-1">
              {day}
            </div>
          ))}
        </div>

        {/* 42-day Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5">
          {grid.flat().map((day, index) => (
            <CalendarDayCell
              key={index}
              day={day}
              selected={selectedDay?.date.getTime() === day.date.getTime()}
              onSelect={setSelectedDay}
            />
          ))}
        </div>

        {/* Selected day summary or helper */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-subtle text-xs">
          <div>
            {selectedDay && selectedDay.isCurrentMonth ? (
              <span className="body-sm text-secondary">
                <strong className="text-ink font-semibold">
                  {selectedDay.date.toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </strong>
                : {selectedDay.minutesStudied} min studied
              </span>
            ) : (
              <span className="caption text-muted">Click any day to see study time</span>
            )}
          </div>

          {/* Activity Intensity Legend */}
          <div className="flex items-center gap-1.5">
            <span className="caption text-muted">Less</span>
            <div className="flex items-center gap-1">
              {LEVEL_STYLES.map((style, i) => (
                <div
                  key={i}
                  className={cn("size-3 rounded-xs", style)}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="caption text-muted">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
