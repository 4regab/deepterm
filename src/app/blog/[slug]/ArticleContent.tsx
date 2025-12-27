'use client'

import { useMemo } from 'react'
import { marked } from 'marked'

interface ArticleContentProps {
  content: string
}

// Extract actual markdown content from malformed JSON
function extractContent(raw: string): string {
  let text = raw.trim()
  
  // Remove code block markers
  if (text.startsWith('```')) {
    text = text.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }
  
  // Try JSON.parse first
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text)
      if (parsed.content) {
        return parsed.content
      }
    } catch {
      // JSON is malformed, extract content field using regex
      const contentMatch = text.match(/"content"\s*:\s*"/)
      if (contentMatch && contentMatch.index !== undefined) {
        const valueStart = contentMatch.index + contentMatch[0].length
        
        let endIndex = text.length - 1
        for (let i = text.length - 1; i > valueStart; i--) {
          if (text[i] === '"' && text[i - 1] !== '\\') {
            endIndex = i
            break
          }
        }
        
        const rawValue = text.substring(valueStart, endIndex)
        const result = rawValue
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
        
        if (result.length > 100) {
          return result
        }
      }
    }
  }
  
  return text
}

// Extract plain text from markdown for TTS
export function extractPlainText(content: string): string {
  const markdown = extractContent(content)
  
  // Convert to HTML first, then strip tags
  let html = marked.parse(markdown, { async: false }) as string
  
  // Remove citation brackets
  html = html.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, '')
  html = html.replace(/\s*\[[\d,\s]+\]/g, '')
  
  // Strip HTML tags and decode entities
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
  
  return text
}

export default function ArticleContent({ content }: ArticleContentProps) {
  const htmlContent = useMemo(() => {
    const markdown = extractContent(content)
    let html = marked.parse(markdown, { async: false }) as string
    
    // Remove citation brackets
    html = html.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, '')
    html = html.replace(/\s*\[[\d,\s]+\]/g, '')
    
    return html
  }, [content])

  return (
    <article 
      className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#171d2b] prose-h2:text-[26px] prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-[22px] prose-h3:mt-8 prose-h3:mb-3 prose-p:text-[#171d2b]/80 prose-p:leading-relaxed prose-a:text-[#171d2b] prose-a:underline prose-strong:text-[#171d2b] prose-ul:my-4 prose-li:text-[#171d2b]/80 prose-blockquote:border-l-[#171d2b]/20 prose-blockquote:text-[#171d2b]/70 prose-code:bg-[#171d2b]/5 prose-code:px-1 prose-code:rounded prose-pre:bg-[#171d2b] prose-pre:text-white"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
}
