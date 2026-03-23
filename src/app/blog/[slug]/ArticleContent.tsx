'use client'

import { useMemo } from 'react'
import { marked } from 'marked'

interface ArticleContentProps {
  content: string
}

const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])
const BLOCKED_PROTOCOL_PATTERN = /^(?:javascript|data|vbscript):/i

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sanitizeMarkdownUrl(rawUrl: string, allowContactProtocols: boolean): string | null {
  const trimmed = rawUrl.trim()
  if (!trimmed) {
    return null
  }

  const normalized = trimmed.replace(/[\u0000-\u001F\u007F\s]+/g, '')
  if (!normalized || BLOCKED_PROTOCOL_PATTERN.test(normalized) || normalized.startsWith('//')) {
    return null
  }

  if (
    normalized.startsWith('#') ||
    normalized.startsWith('?') ||
    normalized.startsWith('/') ||
    normalized.startsWith('./') ||
    normalized.startsWith('../')
  ) {
    return trimmed
  }

  try {
    const parsed = new URL(trimmed)
    if (!SAFE_LINK_PROTOCOLS.has(parsed.protocol)) {
      return null
    }
    if (!allowContactProtocols && (parsed.protocol === 'mailto:' || parsed.protocol === 'tel:')) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

function createSafeRenderer() {
  const renderer = new marked.Renderer()

  // Drop raw HTML blocks entirely to avoid markdown HTML injection.
  renderer.html = () => ''

  renderer.link = function ({ href, title, tokens }) {
    const safeHref = sanitizeMarkdownUrl(href ?? '', true)
    const linkText = this.parser.parseInline(tokens)
    if (!safeHref) {
      return linkText
    }

    const safeTitle = title ? ` title="${escapeHtmlAttribute(title)}"` : ''
    const external = safeHref.startsWith('http://') || safeHref.startsWith('https://')
    const rel = external ? ' rel="noopener noreferrer"' : ''
    return `<a href="${escapeHtmlAttribute(safeHref)}"${safeTitle}${rel}>${linkText}</a>`
  }

  renderer.image = function ({ href, title, text, tokens }) {
    const safeSrc = sanitizeMarkdownUrl(href ?? '', false)
    if (!safeSrc) {
      return ''
    }

    const altText = tokens ? this.parser.parseInline(tokens, this.parser.textRenderer) : text
    const safeTitle = title ? ` title="${escapeHtmlAttribute(title)}"` : ''
    return `<img src="${escapeHtmlAttribute(safeSrc)}" alt="${escapeHtmlAttribute(altText)}"${safeTitle}>`
  }

  return renderer
}

function renderSafeMarkdown(markdown: string): string {
  return marked.parse(markdown, {
    async: false,
    gfm: true,
    renderer: createSafeRenderer(),
  }) as string
}

// Extract actual markdown content from JSON or malformed JSON
function extractContent(raw: string): string {
  let text = raw.trim()

  // Remove code block markers if present
  if (text.startsWith('```')) {
    text = text.replace(/^```json?\s*\n?/, '').replace(/\n?```\s*$/, '')
  }

  // Check if this looks like JSON (starts with { and has "content" field)
  if (text.startsWith('{') && text.includes('"content"')) {
    // Try JSON.parse first
    try {
      const parsed = JSON.parse(text)
      if (parsed.content) {
        return parsed.content
      }
    } catch {
      // JSON is malformed - use regex to extract content field
    }

    // Regex extraction for malformed JSON
    // Match "content": " then capture everything until we find the closing pattern
    const contentMatch = text.match(/"content"\s*:\s*"/)
    if (contentMatch && contentMatch.index !== undefined) {
      const valueStart = contentMatch.index + contentMatch[0].length

      // Strategy: Find the end by looking for patterns that indicate end of content field
      // Look for: ", "keywords" or ", "key" or "} at end or just the last " before }

      // First, try to find ", " followed by another JSON key (like "keywords")
      // This pattern: unescaped quote followed by comma and another key
      const endPatterns = [
        /(?<!\\)",\s*"keywords"/,  // ", "keywords"
        /(?<!\\)",\s*"\w+"\s*:/,   // ", "anyKey":
        /(?<!\\)"\s*\}\s*$/,       // "} at end of string
      ]

      let endIndex = -1
      for (const pattern of endPatterns) {
        const match = text.substring(valueStart).match(pattern)
        if (match && match.index !== undefined) {
          const potentialEnd = valueStart + match.index
          if (endIndex === -1 || potentialEnd > endIndex) {
            // Verify this is actually an unescaped quote
            let backslashCount = 0
            for (let j = potentialEnd - 1; j >= valueStart && text[j] === '\\'; j--) {
              backslashCount++
            }
            if (backslashCount % 2 === 0) {
              // Even number of backslashes means the quote is NOT escaped
              endIndex = potentialEnd
              break
            }
          }
        }
      }

      // Fallback: scan from the end looking for the last valid quote
      if (endIndex === -1) {
        // Find the last } in the text
        const lastBrace = text.lastIndexOf('}')
        if (lastBrace > valueStart) {
          // Work backwards from the brace to find the closing quote
          for (let i = lastBrace - 1; i > valueStart; i--) {
            if (text[i] === '"') {
              // Check if this quote is escaped
              let backslashCount = 0
              for (let j = i - 1; j >= valueStart && text[j] === '\\'; j--) {
                backslashCount++
              }
              if (backslashCount % 2 === 0) {
                endIndex = i
                break
              }
            }
          }
        }
      }

      if (endIndex > valueStart) {
        const rawValue = text.substring(valueStart, endIndex)

        // Unescape the JSON string
        const result = rawValue
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\r/g, '\r')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')

        if (result.length > 50) {
          return result
        }
      }
    }
  }

  // Check for ```json block after content (strip trailing JSON)
  const codeBlockIndex = text.indexOf('```json')
  if (codeBlockIndex > 100) {
    return text.substring(0, codeBlockIndex).trim()
  }

  // Also check for ``` followed by json on next line
  const codeBlockAltIndex = text.indexOf('```\njson')
  if (codeBlockAltIndex > 100) {
    return text.substring(0, codeBlockAltIndex).trim()
  }

  // Check if markdown content is followed by raw JSON (content then JSON appended)
  const jsonPattern = /\n\s*\{\s*"title"/
  const jsonMatch = text.match(jsonPattern)
  if (jsonMatch && jsonMatch.index !== undefined && jsonMatch.index > 100) {
    return text.substring(0, jsonMatch.index).trim()
  }

  // Strip trailing " } that might be left from JSON wrapper
  const trailingJsonPattern = /"\s*\}\s*$/
  if (trailingJsonPattern.test(text)) {
    // Check if this looks like end of JSON object after content
    const match = text.match(/"\s*\}\s*$/)
    if (match && match.index && match.index > 100) {
      // Only strip if there's actual content before it
      return text.substring(0, match.index).trim()
    }
  }

  return text
}

// Extract plain text from markdown for TTS
export function extractPlainText(content: string): string {
  const markdown = extractContent(content)

  // Convert to safe HTML first, then strip tags.
  let html = renderSafeMarkdown(markdown)

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
    let html = renderSafeMarkdown(markdown)

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
