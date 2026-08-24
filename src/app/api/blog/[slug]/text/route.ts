import { NextRequest, NextResponse } from 'next/server'
import { getPostBySlug } from '@/lib/blog'

export const revalidate = 3600

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    const { slug } = await params
    const post = await getPostBySlug(slug)

    if (!post) {
        return new NextResponse('Post not found', { status: 404 })
    }

    const baseUrl = 'https://deepterm.app'

    const meta: string[] = []
    if (post.category_name) meta.push('Category: ' + post.category_name)
    if (post.published_at) {
        meta.push(
            'Published: ' +
            new Date(post.published_at).toISOString().split('T')[0]
        )
    }
    if (post.updated_at) {
        meta.push(
            'Updated: ' +
            new Date(post.updated_at).toISOString().split('T')[0]
        )
    }
    meta.push('Read time: ' + post.read_time_minutes + ' min')
    meta.push('URL: ' + baseUrl + '/blog/' + post.slug)

    const content = stripHtml(post.content)

    const lines = [
        '# ' + post.title,
        '',
        meta.join(' | '),
        '',
        post.meta_description || post.excerpt || '',
        '',
        '---',
        '',
        content,
        '',
        '---',
        '',
        'Source: ' + baseUrl + '/blog/' + post.slug,
        'More articles: ' + baseUrl + '/blog',
        'LLM index: ' + baseUrl + '/llms.txt',
    ]

    return new NextResponse(lines.join('\n'), {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
    })
}

function stripHtml(html: string): string {
    return html
        .replace(/<h([1-6])[^>]*>(.*?)<\/h[1-6]>/gi, (_match, level, text) => {
            return '\n' + '#'.repeat(Number(level)) + ' ' + text.trim() + '\n'
        })
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/li>/gi, '\n')
        .replace(/<li[^>]*>/gi, '- ')
        .replace(/<\/tr>/gi, '\n')
        .replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
        .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
        .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
}
