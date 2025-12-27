'use client'

import { useMemo } from 'react'
import { marked } from 'marked'

interface ArticleContentProps {
  content: string
  highlightedSentenceIndex?: number
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

// Split text into sentences (must match ArticleReader logic)
function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\n+/g, ' ')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
}

export default function ArticleContent({ content, highlightedSentenceIndex = -1 }: ArticleContentProps) {
  const markdown = extractContent(content)
  
  const { htmlContent, plainText, sentences } = useMemo(() => {
    let html = marked.parse(markdown, { async: false }) as string
    
    // Remove citation brackets
    html = html.replace(/\s*\[\d+(?:,\s*\d+)*\]/g, '')
    html = html.replace(/\s*\[[\d,\s]+\]/g, '')
    
    const plain = extractPlainText(content)
    const sents = splitIntoSentences(plain)
    
    return { htmlContent: html, plainText: plain, sentences: sents }
  }, [markdown, content])

  // If no highlighting needed, render normally
  if (highlightedSentenceIndex < 0) {
    return (
      <article 
        className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#171d2b] prose-h2:text-[26px] prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-[22px] prose-h3:mt-8 prose-h3:mb-3 prose-p:text-[#171d2b]/80 prose-p:leading-relaxed prose-a:text-[#171d2b] prose-a:underline prose-strong:text-[#171d2b] prose-ul:my-4 prose-li:text-[#171d2b]/80 prose-blockquote:border-l-[#171d2b]/20 prose-blockquote:text-[#171d2b]/70 prose-code:bg-[#171d2b]/5 prose-code:px-1 prose-code:rounded prose-pre:bg-[#171d2b] prose-pre:text-white"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    )
  }

  // With highlighting: we need to highlight the current sentence in the HTML
  // This is complex because HTML structure doesn't match sentence boundaries
  // Solution: Use a visual overlay approach with scroll-into-view
  
  const currentSentence = sentences[highlightedSentenceIndex] || ''
  
  // Escape special regex characters in the sentence
  const escapedSentence = currentSentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // Try to highlight the sentence in HTML (best effort)
  let highlightedHtml = htmlContent
  if (currentSentence && escapedSentence) {
    // Create a pattern that matches the sentence with possible HTML tags interspersed
    const words = currentSentence.split(/\s+/).filter(w => w.length > 0)
    if (words.length > 0) {
      // Match first few words to find the sentence location
      const firstWords = words.slice(0, Math.min(5, words.length)).join('\\s*(?:<[^>]*>\\s*)*')
      const pattern = new RegExp(`(${firstWords})`, 'i')
      
      // Find and wrap the sentence
      const match = highlightedHtml.match(pattern)
      if (match && match.index !== undefined) {
        // Find the end of this sentence in the HTML
        const startIndex = match.index
        let endIndex = startIndex + currentSentence.length + 100 // approximate
        
        // Look for sentence-ending punctuation
        const afterStart = highlightedHtml.substring(startIndex)
        const sentenceEndMatch = afterStart.match(/[.!?](?:\s|<|$)/)
        if (sentenceEndMatch && sentenceEndMatch.index !== undefined) {
          endIndex = startIndex + sentenceEndMatch.index + 1
        }
        
        // Wrap in highlight span
        const before = highlightedHtml.substring(0, startIndex)
        const highlighted = highlightedHtml.substring(startIndex, endIndex)
        const after = highlightedHtml.substring(endIndex)
        
        highlightedHtml = `${before}<mark class="tts-highlight">${highlighted}</mark>${after}`
      }
    }
  }

  return (
    <>
      <style jsx global>{`
        .tts-highlight {
          background: linear-gradient(120deg, #fef08a 0%, #fde047 100%);
          padding: 2px 0;
          border-radius: 2px;
          scroll-margin-top: 100px;
        }
      `}</style>
      <article 
        className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[#171d2b] prose-h2:text-[26px] prose-h2:mt-10 prose-h2:mb-4 prose-h3:text-[22px] prose-h3:mt-8 prose-h3:mb-3 prose-p:text-[#171d2b]/80 prose-p:leading-relaxed prose-a:text-[#171d2b] prose-a:underline prose-strong:text-[#171d2b] prose-ul:my-4 prose-li:text-[#171d2b]/80 prose-blockquote:border-l-[#171d2b]/20 prose-blockquote:text-[#171d2b]/70 prose-code:bg-[#171d2b]/5 prose-code:px-1 prose-code:rounded prose-pre:bg-[#171d2b] prose-pre:text-white"
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    </>
  )
}
