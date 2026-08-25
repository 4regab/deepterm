import type { ReactNode } from "react";
import { AlertTriangle, SearchX } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";
import { emptyStateTokens, toneClasses, type EmptyStateVariant } from "./tokens";

export type { EmptyStateVariant };

export interface EmptyStateProps {
  title: string;
  description: string;
  /**
   * `empty` — nothing has ever been created here; teach with two actions.
   * `no-results` — the filter matched nothing; show the query and a way out.
   * `error` — the fetch failed; say so plainly and offer Retry.
   */
  variant?: EmptyStateVariant;
  icon?: ReactNode;
  className?: string;

  /** Primary action. `onAction` keeps the pre-redesign call signature. */
  actionLabel?: string;
  onAction?: () => void;
  /** Second, distinct route into the feature. `empty` variant only. */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;

  /** `no-results`: the search term that matched nothing. */
  query?: string;
  onClearFilters?: () => void;

  /** `error`: retry the failed load. */
  onRetry?: () => void;
}

export function EmptyState({
  title,
  description,
  variant = "empty",
  icon,
  className,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  query,
  onClearFilters,
  onRetry,
}: EmptyStateProps) {
  const tokens = emptyStateTokens(variant);
  const fallbackIcon =
    variant === "error" ? (
      <AlertTriangle size={24} aria-hidden="true" />
    ) : variant === "no-results" ? (
      <SearchX size={24} aria-hidden="true" />
    ) : null;
  const medallion = icon ?? fallbackIcon;

  return (
    <div
      role={tokens.role}
      className={cn(
        "flex flex-col items-center justify-center px-4 py-16 text-center",
        className
      )}
    >
      {medallion ? (
        <div
          className={cn(
            "mb-5 flex size-14 items-center justify-center rounded-full",
            toneClasses(tokens.tone)
          )}
          aria-hidden="true"
        >
          {medallion}
        </div>
      ) : null}

      <h3 className="subtitle text-ink">{title}</h3>

      <p className="body mt-1 max-w-sm text-pretty text-muted">
        {variant === "no-results" && query ? (
          <>
            No matches for <span className="text-ink">“{query}”</span>. {description}
          </>
        ) : (
          description
        )}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        {variant === "error" && onRetry ? (
          <Button size="sm" onClick={onRetry}>
            Try again
          </Button>
        ) : null}
        {variant === "no-results" && onClearFilters ? (
          <Button size="sm" variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        ) : null}
        {actionLabel && onAction ? (
          <Button size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
        {variant === "empty" && secondaryActionLabel && onSecondaryAction ? (
          <Button size="sm" variant="secondary" onClick={onSecondaryAction}>
            {secondaryActionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
