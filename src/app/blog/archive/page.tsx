import { Metadata } from 'next'
import Link from 'next/link'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getPublishedPosts, getCategoriesWithCounts } from '@/lib/blog'
import { createMetadata } from '@/lib/seo'

export const metadata: Metadata = createMetadata({
    title: 'Blog Archive - All Study Tips & Learning Articles',
    description:
        'Browse our complete archive of research-backed study tips, learning science articles, AI tool reviews, and productivity guides. All articles in one place.',
    path: '/blog/archive',
})

export const revalidate = 3600

export default async function BlogArchivePage() {
    const [posts, categories] = await Promise.all([
        getPublishedPosts(500, 0), // Fetch all posts
        getCategoriesWithCounts(),
    ])

    // Group posts by category
    const postsByCategory = new Map<string, typeof posts>()
    const uncategorized: typeof posts = []

    for (const post of posts) {
        if (post.category_name) {
            const existing = postsByCategory.get(post.category_name) || []
            existing.push(post)
            postsByCategory.set(post.category_name, existing)
        } else {
            uncategorized.push(post)
        }
    }

    // Sort categories alphabetically
    const sortedCategories = Array.from(postsByCategory.entries()).sort(
        ([a], [b]) => a.localeCompare(b)
    )

    return (
        <div className="bg-[#f0f0ea] min-h-screen">
            <Header />

            <main className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20">
                {/* Hero */}
                <div className="mb-8 sm:mb-12">
                    <nav className="flex items-center gap-2 text-[13px] font-sans text-[#171d2b]/50 mb-4">
                        <Link
                            href="/blog"
                            className="hover:text-[#171d2b] transition-colors"
                        >
                            Blog
                        </Link>
                        <span>/</span>
                        <span className="text-[#171d2b]/70">Archive</span>
                    </nav>

                    <h1 className="font-serif text-[36px] sm:text-[48px] text-[#171d2b] leading-tight mb-3">
                        All Articles
                    </h1>
                    <p className="font-sans text-[15px] text-[#171d2b]/60 max-w-[600px]">
                        Browse our complete collection of {posts.length} research-backed
                        articles on study methods, learning science, productivity, and more.
                    </p>
                </div>

                {/* Category Quick Nav */}
                <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-[#171d2b]/10">
                    {categories
                        .filter((c) => c.post_count > 0)
                        .map((cat) => (
                            <a
                                key={cat.slug}
                                href={'#' + cat.slug}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#171d2b]/5 hover:bg-[#171d2b]/10 font-sans text-[13px] text-[#171d2b]/70 transition-colors"
                            >
                                {cat.name}
                                <span className="text-[#171d2b]/40">({cat.post_count})</span>
                            </a>
                        ))}
                </div>

                {/* Posts by Category */}
                {sortedCategories.map(([categoryName, categoryPosts]) => {
                    const cat = categories.find((c) => c.name === categoryName)
                    const slug = cat?.slug || categoryName.toLowerCase().replace(/\s+/g, '-')

                    return (
                        <section key={categoryName} id={slug} className="mb-10">
                            <h2 className="font-serif text-[22px] sm:text-[26px] text-[#171d2b] mb-4 flex items-baseline gap-3">
                                <Link
                                    href={'/blog/category/' + slug}
                                    className="hover:text-[#171d2b]/70 transition-colors"
                                >
                                    {categoryName}
                                </Link>
                                <span className="font-sans text-[14px] text-[#171d2b]/40">
                                    {categoryPosts.length} articles
                                </span>
                            </h2>

                            <ul className="space-y-1.5">
                                {categoryPosts.map((post) => {
                                    const date = post.published_at
                                        ? new Date(post.published_at).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                        })
                                        : null

                                    return (
                                        <li key={post.id}>
                                            <Link
                                                href={'/blog/' + post.slug}
                                                className="group flex items-baseline gap-3 py-1.5 hover:text-[#171d2b]/70 transition-colors"
                                            >
                                                {date && (
                                                    <span className="font-sans text-[12px] text-[#171d2b]/40 w-[50px] shrink-0">
                                                        {date}
                                                    </span>
                                                )}
                                                <span className="font-sans text-[14px] sm:text-[15px] text-[#171d2b] group-hover:text-[#171d2b]/70">
                                                    {post.title}
                                                </span>
                                            </Link>
                                        </li>
                                    )
                                })}
                            </ul>
                        </section>
                    )
                })}

                {/* Uncategorized */}
                {uncategorized.length > 0 && (
                    <section className="mb-10">
                        <h2 className="font-serif text-[22px] text-[#171d2b] mb-4">
                            Other Articles
                        </h2>
                        <ul className="space-y-1.5">
                            {uncategorized.map((post) => (
                                <li key={post.id}>
                                    <Link
                                        href={'/blog/' + post.slug}
                                        className="font-sans text-[14px] text-[#171d2b] hover:text-[#171d2b]/70 transition-colors py-1.5 block"
                                    >
                                        {post.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
            </main>

            <Footer />
        </div>
    )
}
