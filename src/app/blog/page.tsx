import { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getPublishedPosts, getCategoriesWithCounts } from '@/lib/blog'
import { createMetadata } from '@/lib/seo'
import CategoryFilter from './components/CategoryFilter'

export const metadata: Metadata = createMetadata({
  title: 'Blog - Study Tips, AI Tools & Learning Science',
  description:
    'Discover research-backed study techniques, AI learning tools, and productivity tips. Free guides to help you study smarter, not harder.',
  path: '/blog',
})

interface PageProps {
  searchParams: Promise<{ category?: string; page?: string }>
}

const POSTS_PER_PAGE = 20

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const categorySlug = params.category
  const page = parseInt(params.page || '1', 10)
  const offset = (page - 1) * POSTS_PER_PAGE

  const [posts, categories] = await Promise.all([
    getPublishedPosts(POSTS_PER_PAGE, offset, categorySlug),
    getCategoriesWithCounts(),
  ])

  return (
    <div className="bg-[#f0f0ea] min-h-screen">
      <Header />

      <main className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
        {/* Hero Section */}
        <div className="mb-12 sm:mb-16">
          <h1 className="font-serif text-[42px] sm:text-[56px] lg:text-[72px] text-[#171d2b] leading-[1.1] tracking-tight">
            Blog
          </h1>
        </div>

        {/* Category Filter */}
        <Suspense fallback={<div className="h-10" />}>
          <CategoryFilter
            categories={categories}
            activeCategory={categorySlug}
          />
        </Suspense>

        {/* Posts List */}
        {posts.length > 0 ? (
          <div className="divide-y divide-[#171d2b]/10">
            {posts.map((post) => {
              const formattedDate = post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
                : null

              return (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6 py-5 sm:py-6 hover:bg-[#171d2b]/[0.02] -mx-4 px-4 transition-colors"
                >
                  {/* Date */}
                  <span className="font-sans text-[13px] sm:text-[14px] text-[#171d2b]/50 sm:w-[100px] shrink-0">
                    {formattedDate}
                  </span>

                  {/* Category + Title */}
                  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 flex-1 min-w-0">
                    {post.category_name && (
                      <span className="font-sans text-[12px] sm:text-[13px] text-[#171d2b]/60 uppercase tracking-wide sm:w-[140px] shrink-0">
                        {post.category_name}
                      </span>
                    )}
                    <h2 className="font-serif text-[17px] sm:text-[19px] text-[#171d2b] leading-snug group-hover:text-[#171d2b]/70 transition-colors">
                      {post.title}
                    </h2>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <h3 className="font-serif text-[20px] text-[#171d2b] mb-2">
              No articles yet
            </h3>
            <p className="font-sans text-[14px] text-[#171d2b]/60 mb-6">
              {categorySlug
                ? 'No articles in this category yet. Check back soon!'
                : 'Articles are coming soon. Check back later!'}
            </p>
            {categorySlug && (
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 font-sans text-[14px] text-[#171d2b] hover:text-[#171d2b]/70 transition-colors"
              >
                ← View all articles
              </Link>
            )}
          </div>
        )}

        {/* See More */}
        {posts.length === POSTS_PER_PAGE && (
          <div className="mt-8 pt-6 border-t border-[#171d2b]/10 flex items-center justify-between">
            <Link
              href={`/blog?${categorySlug ? `category=${categorySlug}&` : ''}page=${page + 1}`}
              className="inline-flex items-center gap-2 font-sans text-[14px] sm:text-[15px] text-[#171d2b] hover:text-[#171d2b]/70 transition-colors"
            >
              See more
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/blog/archive"
              className="font-sans text-[13px] text-[#171d2b]/50 hover:text-[#171d2b]/70 transition-colors"
            >
              View all articles →
            </Link>
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
