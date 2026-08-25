import * as React from "react";
import { BookOpen, Layers, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { contentTypeTokens, type ContentType } from "./tokens";

export type { ContentType };

/**
 * One glyph per content type, forever. BookOpen is also the marker that keeps
 * reviewer amber from being mistaken for warning amber (see globals.css).
 */
const ICONS: Record<ContentType, LucideIcon> = {
  Flashcards: Layers,
  Reviewer: BookOpen,
  Practice: Target,
};

const TILE_SIZE = { sm: 28, md: 36, lg: 48 } as const;
const GLYPH_SIZE = { sm: 14, md: 18, lg: 22 } as const;

export interface TypeIconProps {
  type: ContentType;
  size?: keyof typeof TILE_SIZE;
  /** Renders the label next to the tile. */
  showLabel?: boolean;
  className?: string;
}

export function TypeIcon({
  type,
  size = "md",
  showLabel = false,
  className,
}: TypeIconProps) {
  const tokens = contentTypeTokens(type);
  const Icon = ICONS[type];
  const px = TILE_SIZE[size];

  const tile = (
    <span
      aria-hidden={showLabel ? "true" : undefined}
      role={showLabel ? undefined : "img"}
      aria-label={showLabel ? undefined : tokens.label}
      className={cn("grid shrink-0 place-items-center rounded-sm", tokens.tile)}
      style={{ width: px, height: px }}
    >
      <Icon size={GLYPH_SIZE[size]} aria-hidden="true" />
    </span>
  );

  if (!showLabel) return <span className={className}>{tile}</span>;

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      {tile}
      <span className="label text-ink">{tokens.label}</span>
    </span>
  );
}

/** The icon on its own, for places that already have their own container. */
export function typeIconFor(type: ContentType): LucideIcon {
  return ICONS[type];
}
