import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getPostBySlug, getRelatedPosts, getAdjacentPosts } from '@/lib/blog'
import { siteConfig, generateArticleJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo'
import BlogPostCard from '../components/BlogPostCard'
import BlogPostClient from './BlogPostClient'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    return { title: 'Post Not Found' }
  }

  const url = `${siteConfig.url}/blog/${post.slug}`
  const ogImage = post.og_image_url || `${siteConfig.url}/api/og/blog?title=${encodeURIComponent(post.title)}`

  return {
    title: post.title,
    description: post.meta_description || post.excerpt || undefined,
    keywords: post.keywords || undefined,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.meta_description || post.excerpt || undefined,
      url,
      siteName: siteConfig.name,
      type: 'article',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at || undefined,
      authors: ['DeepTerm'],
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.meta_description || post.excerpt || undefined,
      images: [ogImage],
    },
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(slug, post.category_slug, 3)
  const adjacentPosts = post.published_at
    ? await getAdjacentPosts(post.published_at)
    : { prev: null, next: null }

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    : null

  // JSON-LD structured data
  const articleJsonLd = generateArticleJsonLd({
    title: post.title,
    description: post.meta_description || post.excerpt || '',
    url: `${siteConfig.url}/blog/${post.slug}`,
    image: post.og_image_url || `${siteConfig.url}/api/og/blog?title=${encodeURIComponent(post.title)}`,
    datePublished: post.published_at || new Date().toISOString(),
    dateModified: post.updated_at || undefined,
  })

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'Home', url: siteConfig.url },
    { name: 'Blog', url: `${siteConfig.url}/blog` },
    ...(post.category_name
      ? [{ name: post.category_name, url: `${siteConfig.url}/blog/category/${post.category_slug}` }]
      : []),
    { name: post.title, url: `${siteConfig.url}/blog/${post.slug}` },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd).replace(/</g, '\\u003c') }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="bg-background min-h-screen">
        <Header />

        <main className="max-w-[800px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] font-sans text-muted-foreground mb-6 sm:mb-8">
            <Link href="/blog" className="hover:text-foreground transition-colors">
              Blog
            </Link>
            <span>/</span>
            {post.category_name && (
              <>
                <Link
                  href={`/blog/category/${post.category_slug}`}
                  className="hover:text-foreground transition-colors"
                >
                  {post.category_name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-muted-foreground truncate max-w-[200px]">{post.title}</span>
          </nav>

          {/* Article Header */}
          <header className="mb-4">
            <h1 className="font-sans tracking-tight text-[28px] sm:text-[36px] lg:text-[42px] text-foreground leading-tight mb-4">
              {post.title}
            </h1>
          </header>

          {/* Hero Image */}
          {post.og_image_url && (
            <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8 sm:mb-10">
              <Image
                src={post.og_image_url}
                alt={post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}

          {/* Article Metadata + Content (Client Component for TTS) */}
          <BlogPostClient
            content={post.content}
            formattedDate={formattedDate}
            readTimeMinutes={post.read_time_minutes}
          />

          {/* Previous/Next Navigation */}
          {(adjacentPosts.prev || adjacentPosts.next) && (
            <nav className="flex flex-col sm:flex-row gap-4 mt-12 pt-8 border-t border-border">
              {adjacentPosts.prev ? (
                <Link
                  href={`/blog/${adjacentPosts.prev.slug}`}
                  className="flex-1 group p-4 rounded-xl bg-muted hover:bg-accent transition-colors"
                >
                  <span className="text-[12px] uppercase tracking-wide text-muted-foreground font-sans flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Previous
                  </span>
                  <span className="block mt-1 font-sans tracking-tight text-[16px] text-foreground group-hover:text-foreground/80 line-clamp-2">
                    {adjacentPosts.prev.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
              {adjacentPosts.next ? (
                <Link
                  href={`/blog/${adjacentPosts.next.slug}`}
                  className="flex-1 group p-4 rounded-xl bg-muted hover:bg-accent transition-colors text-right"
                >
                  <span className="text-[12px] uppercase tracking-wide text-muted-foreground font-sans flex items-center justify-end gap-1">
                    Next
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </span>
                  <span className="block mt-1 font-sans tracking-tight text-[16px] text-foreground group-hover:text-foreground/80 line-clamp-2">
                    {adjacentPosts.next.title}
                  </span>
                </Link>
              ) : (
                <div className="flex-1" />
              )}
            </nav>
          )}

          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <section className="mt-12 sm:mt-16">
              <h2 className="font-sans tracking-tight text-[22px] sm:text-[26px] text-foreground mb-6 sm:mb-8">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <BlogPostCard key={relatedPost.id} post={relatedPost} />
                ))}
              </div>
            </section>
          )}

          {/* CTA Section */}
          <div className="bg-primary rounded-2xl p-6 sm:p-8 mt-10 sm:mt-12 text-center">
            <h3 className="font-sans tracking-tight text-[22px] sm:text-[26px] text-white mb-3">
              Ready to study smarter?
            </h3>
            <p className="font-sans text-[14px] sm:text-[15px] text-white/70 mb-6 max-w-[400px] mx-auto">
              Transform any study material into flashcards, practice tests, and reviewers with AI.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 h-[46px] px-6 rounded-full bg-white text-foreground font-sans text-[14px] hover:bg-background transition-colors"
            >
              Start Learning Free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}
