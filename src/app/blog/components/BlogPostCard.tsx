import Link from 'next/link'
import Image from 'next/image'
import type { BlogPostListItem } from '@/lib/blog'

interface BlogPostCardProps {
  post: BlogPostListItem
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-white rounded-2xl border border-[#171d2b]/10 overflow-hidden hover:border-[#171d2b]/20 hover:shadow-lg transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] bg-[#171d2b]/5 overflow-hidden">
        {post.og_image_url ? (
          <Image
            src={post.og_image_url}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-xl bg-[#171d2b]/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-[#171d2b]/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {/* Category Badge */}
        {post.category_name && (
          <span className="inline-block px-3 py-1 rounded-full bg-[#171d2b]/5 text-[#171d2b]/70 font-sans text-[11px] sm:text-[12px] uppercase tracking-wide mb-3">
            {post.category_name}
          </span>
        )}

        {/* Title */}
        <h2 className="font-serif text-[18px] sm:text-[20px] text-[#171d2b] leading-snug mb-2 group-hover:text-[#171d2b]/80 transition-colors line-clamp-2">
          {post.title}
        </h2>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="font-sans text-[13px] sm:text-[14px] text-[#171d2b]/60 leading-relaxed line-clamp-2 mb-4">
            {post.excerpt}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center gap-3 text-[#171d2b]/50 font-sans text-[12px] sm:text-[13px]">
          {formattedDate && <span>{formattedDate}</span>}
          {formattedDate && post.read_time_minutes && (
            <span className="w-1 h-1 rounded-full bg-[#171d2b]/30" />
          )}
          {post.read_time_minutes && (
            <span>{post.read_time_minutes} min read</span>
          )}
        </div>
      </div>
    </Link>
  )
}
