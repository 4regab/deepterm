"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  progressPercent,
  segmentedProgressWidths,
  stepState,
  TONE_FILL,
  type StudyCounts,
  type Tone,
} from "./tokens";

/* -------------------------------------------------------------------------- */

const BAR_HEIGHT = { xs: "h-1", sm: "h-1.5", md: "h-2.5" } as const;

export interface ProgressBarProps {
  value: number;
  max?: number;
  size?: keyof typeof BAR_HEIGHT;
  tone?: Tone;
  /** Announced name. Required — a bare bar tells a screen reader nothing. */
  label: string;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = "sm",
  tone = "brand",
  label,
  className,
}: ProgressBarProps) {
  const percent = progressPercent(value, max);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      className={cn(
        "w-full overflow-hidden rounded-full bg-surface-sunken",
        BAR_HEIGHT[size],
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-[var(--dur-slow)] ease-[var(--ease-out)]",
          TONE_FILL[tone]
        )}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export interface SegmentedProgressProps {
  counts: StudyCounts;
  label?: string;
  className?: string;
}

/**
 * One 6px track split proportionally across the three study states. This is
 * the "where is this deck at" glance for a library row — three counts in the
 * width of a progress bar.
 */
export function SegmentedProgress({
  counts,
  label = "Study progress",
  className,
}: SegmentedProgressProps) {
  const widths = segmentedProgressWidths(counts);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(counts.mastered)}
      aria-valuemin={0}
      aria-valuemax={Math.max(0, widths.total)}
      aria-valuetext={`${counts.mastered} of ${widths.total} mastered, ${counts.learning} learning, ${counts.new} new`}
      className={cn(
        "flex h-1.5 w-full gap-px overflow-hidden rounded-full bg-surface-sunken",
        className
      )}
    >
      {widths.total === 0 ? null : (
        <>
          <span
            className="h-full bg-surface-sunken"
            style={{ width: `${widths.new}%` }}
          />
          {/* Learning sits at 60% alpha so it reads as "in flight", not "done". */}
          <span
            className="h-full bg-warn/60"
            style={{ width: `${widths.learning}%` }}
          />
          <span
            className="h-full bg-success"
            style={{ width: `${widths.mastered}%` }}
          />
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const RING_SIZE = { sm: 40, md: 56, lg: 72 } as const;
const RING_STROKE = 4;

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: keyof typeof RING_SIZE;
  tone?: Tone;
  label: string;
  /** Centre content. Defaults to the rounded percentage. */
  children?: React.ReactNode;
  className?: string;
}

const RING_STROKE_COLOR: Record<Tone, string> = {
  neutral: "var(--border-input)",
  brand: "var(--brand)",
  cards: "var(--type-cards)",
  reviewer: "var(--type-reviewer)",
  practice: "var(--type-practice)",
  success: "var(--success)",
  warn: "var(--warn)",
  danger: "var(--danger)",
};

export function ProgressRing({
  value,
  max = 100,
  size = "md",
  tone = "brand",
  label,
  children,
  className,
}: ProgressRingProps) {
  const px = RING_SIZE[size];
  const percent = progressPercent(value, max);
  const radius = (px - RING_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative inline-grid place-items-center", className)}
      style={{ width: px, height: px }}
    >
      <svg width={px} height={px} className="-rotate-90" aria-hidden="true">
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-sunken)"
          strokeWidth={RING_STROKE}
        />
        <circle
          cx={px / 2}
          cy={px / 2}
          r={radius}
          fill="none"
          stroke={RING_STROKE_COLOR[tone]}
          strokeWidth={RING_STROKE}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
        />
      </svg>
      <span className="caption tabular absolute text-ink">
        {children ?? `${Math.round(percent)}%`}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

export interface StepIndicatorProps {
  steps: readonly string[];
  /** Zero-based index of the step the user is on. */
  current: number;
  label?: string;
  className?: string;
}

export function StepIndicator({
  steps,
  current,
  label = "Progress",
  className,
}: StepIndicatorProps) {
  return (
    <ol
      aria-label={label}
      className={cn("flex w-full items-start", className)}
    >
      {steps.map((step, index) => {
        const state = stepState(index, current);
        const last = index === steps.length - 1;
        return (
          <li
            key={step}
            aria-current={state === "current" ? "step" : undefined}
            className={cn("flex items-start", !last && "flex-1")}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "label grid size-7 place-items-center rounded-full border transition-colors duration-[var(--dur-base)] ease-[var(--ease-out)]",
                  state === "complete" && "border-brand bg-brand text-on-solid",
                  state === "current" &&
                    "border-brand bg-brand text-on-solid ring-3 ring-brand-subtle",
                  state === "upcoming" && "border-input bg-surface text-muted"
                )}
              >
                {state === "complete" ? (
                  <Check aria-hidden="true" size={14} />
                ) : (
                  index + 1
                )}
              </span>
              {/* Labels are noise on a 375px screen — the numerals carry it. */}
              <span
                className={cn(
                  "caption hidden whitespace-nowrap sm:block",
                  state === "upcoming" ? "text-muted" : "text-ink"
                )}
              >
                {step}
              </span>
            </div>
            {!last ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-2 mt-3.5 h-0.5 flex-1 rounded-full",
                  index < current ? "bg-brand" : "bg-surface-sunken"
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
