import { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getPublishedPosts, getCategoryBySlug, getCategoriesWithCounts } from '@/lib/blog'
import { createMetadata, siteConfig, generateBreadcrumbJsonLd } from '@/lib/seo'
import CategoryFilter from '../../components/CategoryFilter'

interface PageProps {
  params: Promise<{ cat: string }>
  searchParams: Promise<{ page?: string }>
}

function normalizePage(pageParam?: string): number {
  const page = Number.parseInt(pageParam || '1', 10)
  return Number.isFinite(page) && page > 1 ? page : 1
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { cat } = await params
  const { page: pageParam } = await searchParams
  const category = await getCategoryBySlug(cat)

  if (!category) {
    return { title: 'Category Not Found' }
  }

  const page = normalizePage(pageParam)

  return createMetadata({
    title: page > 1 ? `${category.name} - Blog - Page ${page}` : `${category.name} - Blog`,
    description: category.description || `Browse ${category.name} articles on DeepTerm. Study tips, guides, and resources.`,
    path: page > 1 ? `/blog/category/${cat}?page=${page}` : `/blog/category/${cat}`,
  })
}

const POSTS_PER_PAGE = 20

export default async function CategoryPage({ params, searchParams }: PageProps) {
  const { cat } = await params
  const { page: pageParam } = await searchParams
  
  const category = await getCategoryBySlug(cat)
  
  if (!category) {
    notFound()
  }

  const page = normalizePage(pageParam)

  if (pageParam && page === 1) {
    permanentRedirect(`/blog/category/${cat}`)
  }

  const offset = (page - 1) * POSTS_PER_PAGE

  const [posts, categories] = await Promise.all([
    getPublishedPosts(POSTS_PER_PAGE, offset, cat),
    getCategoriesWithCounts(),
  ])

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: siteConfig.url },
    { name: 'Blog', url: `${siteConfig.url}/blog` },
    { name: category.name, url: `${siteConfig.url}/blog/category/${cat}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="bg-[#f0f0ea] min-h-screen">
        <Header />

        <main id="main-content" className="max-w-[65ch] mx-auto px-4 sm:px-6 py-12 sm:py-20">
          {/* Hero Section */}
          <div className="mb-12 sm:mb-16">
            <Link 
              href="/blog" 
              className="inline-flex items-center gap-2 font-sans text-[13px] text-[#171d2b]/50 hover:text-[#171d2b] transition-colors mb-4"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              All articles
            </Link>
            <h1 className="font-serif text-[42px] sm:text-[56px] lg:text-[72px] text-[#171d2b] leading-[1.1] tracking-tight">
              {category.name}
            </h1>
            {category.description && (
              <p className="font-sans text-[15px] sm:text-[17px] text-[#171d2b]/60 mt-4 max-w-[600px]">
                {category.description}
              </p>
            )}
          </div>

          {/* Category Filter */}
          <CategoryFilter categories={categories} activeCategory={cat} />

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

                    {/* Title */}
                    <h2 className="font-serif text-[17px] sm:text-[19px] text-[#171d2b] leading-snug group-hover:text-[#171d2b]/70 transition-colors flex-1">
                      {post.title}
                    </h2>
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
                No articles in this category. See the rest of the blog.
              </p>
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 font-sans text-[14px] text-[#171d2b] hover:text-[#171d2b]/70 transition-colors"
              >
                ← View all articles
              </Link>
            </div>
          )}

          {/* See More */}
          {posts.length === POSTS_PER_PAGE && (
            <div className="mt-8 pt-6 border-t border-[#171d2b]/10">
              <Link
                href={`/blog/category/${cat}?page=${page + 1}`}
                className="inline-flex items-center gap-2 font-sans text-[14px] sm:text-[15px] text-[#171d2b] hover:text-[#171d2b]/70 transition-colors"
              >
                See more
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </main>

        <Footer />
      </div>
    </>
  )
}
