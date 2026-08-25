"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  breadcrumb?: readonly Breadcrumb[];
  description?: string;
  /** Buttons on the title row, right-aligned. */
  actions?: React.ReactNode;
  /** Search, filters, view switches. Sits under the description. */
  toolbar?: React.ReactNode;
  /** Collapses to a 56px blurred bar once the page scrolls past 80px. */
  sticky?: boolean;
  className?: string;
}

const COLLAPSE_AT = 80;

/**
 * The one page-title treatment. Seven pages currently ship four different h1
 * recipes; every one of them should end up here.
 *
 * The title is responsive: `text-4xl` is 36px whether the viewport is 1440px
 * or 375px, which is why long deck names wrap to three lines on a phone.
 */
export function PageHeader({
  title,
  breadcrumb,
  description,
  actions,
  toolbar,
  sticky = false,
  className,
}: PageHeaderProps) {
  const [collapsed, setCollapsed] = React.useState(false);

  React.useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setCollapsed(window.scrollY > COLLAPSE_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  return (
    <header
      data-collapsed={collapsed || undefined}
      className={cn(
        "ds-collapse mb-8 transition-[padding,box-shadow,background-color] duration-[var(--dur-base)] ease-[var(--ease-out)]",
        sticky && "sticky top-0 z-30 -mx-4 px-4",
        sticky && collapsed &&
          "min-h-14 bg-[color-mix(in_srgb,var(--canvas)_80%,transparent)] shadow-[var(--elev-1)] backdrop-blur-[12px]",
        className
      )}
    >
      {breadcrumb && breadcrumb.length > 0 && !collapsed ? (
        <nav aria-label="Breadcrumb" className="mb-2">
          <ol className="caption flex flex-wrap items-center gap-1 text-muted">
            {breadcrumb.map((crumb, index) => (
              <li key={crumb.label} className="flex items-center gap-1 min-w-0 max-w-[180px] sm:max-w-[280px]">
                {index > 0 ? (
                  <ChevronRight aria-hidden="true" size={12} className="text-disabled shrink-0" />
                ) : null}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-ink truncate block min-w-0" title={crumb.label}>
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="truncate text-ink font-medium block min-w-0" title={crumb.label}>
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1
            className={cn(
              "text-ink transition-[font-size] duration-[var(--dur-base)] ease-[var(--ease-out)] break-words",
              collapsed ? "subtitle" : "title-lg sm:display"
            )}
          >
            {title}
          </h1>
          {description && !collapsed ? (
            <p className="body mt-1 max-w-prose text-muted">{description}</p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>

      {toolbar ? <div className="mt-4">{toolbar}</div> : null}
    </header>
  );
}
