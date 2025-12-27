'use client'

import Link from 'next/link'
import type { CategoryWithCount } from '@/lib/blog'

interface CategoryFilterProps {
  categories: CategoryWithCount[]
  activeCategory?: string
}

export default function CategoryFilter({ categories, activeCategory }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 sm:mb-10 pb-6 border-b border-[#171d2b]/10">
      <Link
        href="/blog"
        className={`font-sans text-[13px] sm:text-[14px] transition-colors ${
          !activeCategory
            ? 'text-[#171d2b] font-medium'
            : 'text-[#171d2b]/50 hover:text-[#171d2b]'
        }`}
      >
        All
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={`/blog?category=${category.slug}`}
          className={`font-sans text-[13px] sm:text-[14px] transition-colors ${
            activeCategory === category.slug
              ? 'text-[#171d2b] font-medium'
              : 'text-[#171d2b]/50 hover:text-[#171d2b]'
          }`}
        >
          {category.name}
        </Link>
      ))}
    </div>
  )
}
