'use client'

import { useCallback } from 'react'
import ArticleReader from './ArticleReader'
import ArticleContent, { extractPlainText } from './ArticleContent'

interface BlogPostClientProps {
  content: string
  formattedDate: string | null
  readTimeMinutes: number | null
  views: number
}

export default function BlogPostClient({ 
  content, 
  formattedDate, 
  readTimeMinutes, 
  views 
}: BlogPostClientProps) {
  const plainText = extractPlainText(content)
  
  const handleSentenceChange = useCallback(() => {
    // No-op - highlighting removed
  }, [])
  
  const handleStop = useCallback(() => {
    // No-op - highlighting removed
  }, [])

  return (
    <>
      {/* Article Metadata with Reader Controls */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-[#171d2b]/50 font-sans text-[13px] sm:text-[14px] mb-8 sm:mb-10">
        {formattedDate && <span>{formattedDate}</span>}
        {readTimeMinutes && (
          <>
            <span className="w-1 h-1 rounded-full bg-[#171d2b]/30" />
            <span>{readTimeMinutes} min read</span>
          </>
        )}
        {views > 0 && (
          <>
            <span className="w-1 h-1 rounded-full bg-[#171d2b]/30" />
            <span>{views.toLocaleString()} views</span>
          </>
        )}
        
        {/* Separator before Listen button */}
        <span className="w-1 h-1 rounded-full bg-[#171d2b]/30" />
        
        {/* Reader Controls */}
        <ArticleReader 
          text={plainText}
          onSentenceChange={handleSentenceChange}
          onStop={handleStop}
        />
      </div>
      
      {/* Article Content - no highlighting */}
      <ArticleContent content={content} />
    </>
  )
}
