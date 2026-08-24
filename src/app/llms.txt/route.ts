import { NextResponse } from 'next/server'
import { getPublishedPosts, getCategoriesWithCounts } from '@/lib/blog'
import { siteConfig } from '@/lib/seo'

export const revalidate = 3600 // Revalidate every hour

export async function GET() {
    const [posts, categories] = await Promise.all([
        getPublishedPosts(200, 0),
        getCategoriesWithCounts(),
    ])

    const baseUrl = siteConfig.url

    const categoryLines = categories
        .filter((c) => c.post_count > 0)
        .map((c) => '- [' + c.name + ' (' + c.post_count + ' articles)](' + baseUrl + '/blog/category/' + c.slug + ')')

    const postLines = posts.map((p) => {
        const desc = p.meta_description || p.excerpt || ''
        const truncated = desc.length > 120 ? desc.substring(0, 117) + '...' : desc
        return '- [' + p.title + '](' + baseUrl + '/blog/' + p.slug + '): ' + truncated
    })

    const lines = [
        '# DeepTerm',
        '',
        '> DeepTerm is a free, AI-powered study platform that transforms any material into flashcards, reviewers, and practice tests. It helps students study smarter with active recall, spaced repetition, and Pomodoro timers.',
        '',
        "DeepTerm's blog covers evidence-based study methods, learning science, productivity techniques, student life advice, tool reviews, and exam preparation strategies. All content is research-backed and written for college students and lifelong learners.",
        '',
        '## Blog Categories',
        '',
        '- [Blog Archive](' + baseUrl + '/blog/archive): Complete listing of all articles',
        ...categoryLines,
        '',
        '## Blog Posts',
        '',
        ...postLines,
        '',
        '## Features',
        '',
        '- [DeepTerm Blog](' + baseUrl + '/blog): Research-backed study methods and learning science insights',
        '- [Blog Archive](' + baseUrl + '/blog/archive): Browse all published study articles',
        '- [Help Center](' + baseUrl + '/help): Product guides and FAQs',
        '- [Changelog](' + baseUrl + '/changelog): Latest product updates and improvements',
        '',
        '## About',
        '',
        '- [About DeepTerm](' + baseUrl + '/about): Learn more about our mission',
        '- [Help Center](' + baseUrl + '/help): Guides and FAQs',
        '- [Changelog](' + baseUrl + '/changelog): Latest updates and features',
        '- [Privacy Policy](' + baseUrl + '/privacy-policy): How we handle your data',
        '- [Terms of Service](' + baseUrl + '/terms): Terms and conditions',
        '',
        '## Optional',
        '',
        '- [GitHub Repository](https://github.com/4regab/deepterm): Open-source codebase',
        '- [Donate](https://ko-fi.com/4regab): Support development on Ko-fi',
        '',
    ]

    return new NextResponse(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    })
}
