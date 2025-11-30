"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Copy, Check, ChevronDown, ChevronUp, Loader2, 
  BookOpen, User, Calendar, ExternalLink, Download
} from "lucide-react"
import Link from "next/link"
import type { SharedMaterialData } from "@/lib/schemas/sharing"
import { createClient } from "@/config/supabase/client"
import { exportToPDF, exportToDOCX } from "@/utils/exportReviewer"

interface Props {
  data: SharedMaterialData
  shareCode: string
}

function FlashcardPreview({ data }: { data: Extract<SharedMaterialData, { type: 'flashcard_set' }> }) {
  return (
    <div className="space-y-3">
      {data.items.map((card, index) => (
        <div 
          key={card.id} 
          className="p-4 bg-white rounded-xl border border-[#171d2b]/10 hover:border-[#171d2b]/20 transition-colors"
        >
          <div className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#171d2b]/5 flex items-center justify-center text-xs font-medium text-[#171d2b]/50">
              {index + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-[#171d2b] mb-1">{card.front}</p>
              <p className="text-[#171d2b]/60 text-sm">{card.back}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ReviewerPreview({ data }: { data: Extract<SharedMaterialData, { type: 'reviewer' }> }) {
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    data.categories.map(c => c.id)
  )

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const totalTerms = data.categories.reduce((acc, cat) => acc + cat.terms.length, 0)

  return (
    <div className="space-y-4">
      <p className="text-[#171d2b]/60 text-sm">
        {totalTerms} terms across {data.categories.length} categories
      </p>
      
      {data.categories.map(category => (
        <div 
          key={category.id} 
          className="bg-white rounded-xl border border-[#171d2b]/10 overflow-hidden"
        >
          <button
            onClick={() => toggleCategory(category.id)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
            style={{ borderLeft: `4px solid ${category.color}` }}
          >
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-[#171d2b]">{category.name}</h3>
              <span className="px-2 py-0.5 rounded-full bg-[#171d2b]/5 text-xs text-[#171d2b]/60">
                {category.terms.length} terms
              </span>
            </div>
            {expandedCategories.includes(category.id) 
              ? <ChevronUp size={18} className="text-[#171d2b]/40" />
              : <ChevronDown size={18} className="text-[#171d2b]/40" />
            }
          </button>
          
          <AnimatePresence>
            {expandedCategories.includes(category.id) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-[#171d2b]/5"
              >
                <div className="p-4 grid gap-3 grid-cols-1 lg:grid-cols-2">
                  {category.terms.map(term => (
                    <div 
                      key={term.id} 
                      className="p-4 rounded-xl bg-[#f8f9fa] border border-[#171d2b]/5"
                    >
                      <h4 className="font-bold text-[#171d2b] mb-1">{term.term}</h4>
                      <p className="text-[#171d2b]/70 text-sm">{term.definition}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  )
}

export default function SharePreviewClient({ data, shareCode }: Props) {
  const router = useRouter()
  const [, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [adding, setAdding] = useState(false)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/share/${shareCode}`
    : `/share/${shareCode}`

  const handleCopyLink = async () => {
    setCopying(true)
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setCopying(false)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportPDF = () => {
    if (data.type !== 'reviewer') return
    const exportCategories = data.categories.map(c => ({
      name: c.name,
      terms: c.terms.map(t => ({ front: t.term, back: t.definition }))
    }))
    exportToPDF({ title: data.material.title, terms: [], categories: exportCategories })
    setShowDownloadMenu(false)
  }

  const handleExportDOCX = () => {
    if (data.type !== 'reviewer') return
    const exportCategories = data.categories.map(c => ({
      name: c.name,
      terms: c.terms.map(t => ({ front: t.term, back: t.definition }))
    }))
    exportToDOCX({ title: data.material.title, terms: [], categories: exportCategories })
    setShowDownloadMenu(false)
  }

  const handleAddToCollection = async () => {
    setAdding(true)
    
    try {
      const res = await fetch('/api/share/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareCode }),
      })

      if (res.status === 401) {
        // Not logged in - trigger Google OAuth with return to this page
        const supabase = createClient()
        await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(`/share/${shareCode}`)}`,
          },
        })
        return
      }

      const result = await res.json()
      
      if (result.success && result.redirectUrl) {
        router.push(result.redirectUrl)
      } else {
        alert(result.error || 'Failed to add to collection')
      }
    } catch {
      alert('Something went wrong')
    } finally {
      setAdding(false)
    }
  }

  const title = data.material.title
  const itemCount = data.type === 'flashcard_set' 
    ? data.items.length 
    : data.categories.reduce((acc, cat) => acc + cat.terms.length, 0)
  const itemLabel = data.type === 'flashcard_set' ? 'cards' : 'terms'
  const typeLabel = data.type === 'flashcard_set' ? 'Flashcard Set' : 'Reviewer'

  return (
    <div className="min-h-screen bg-[#f0f0ea]">
      {/* Header */}
      <header className="bg-white border-b border-[#171d2b]/10 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-1">
            <div className="w-[28px] h-[28px] flex items-center justify-center">
              <div className="rotate-[292deg]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt="DeepTerm Logo" className="w-[22px] h-[22px]" src="/assets/logo.svg" />
              </div>
            </div>
            <span className="font-sora text-xl text-[#171d2b]">deepterm</span>
          </Link>
          <div className="flex items-center gap-2">
            {data.type === 'reviewer' && (
              <div className="relative">
                <button
                  onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#171d2b]/10 hover:bg-[#171d2b]/5 transition-colors text-sm"
                  title="Download"
                >
                  <Download size={16} />
                  <span className="hidden sm:inline">Download</span>
                </button>
                {showDownloadMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                    <div className="absolute right-0 top-full mt-1 z-50">
                      <div className="bg-white rounded-lg border border-[#171d2b]/10 shadow-lg py-1 min-w-[140px]">
                        <button
                          onClick={handleExportPDF}
                          className="w-full px-4 py-2 text-left text-sm text-[#171d2b] hover:bg-[#171d2b]/5 transition-colors"
                        >
                          Download PDF
                        </button>
                        <button
                          onClick={handleExportDOCX}
                          className="w-full px-4 py-2 text-left text-sm text-[#171d2b] hover:bg-[#171d2b]/5 transition-colors"
                        >
                          Download DOCX
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#171d2b]/10 hover:bg-[#171d2b]/5 transition-colors text-sm"
            >
              {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Material Info Card */}
        <div className="bg-white rounded-2xl border border-[#171d2b]/10 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-[#171d2b] text-white text-xs font-medium mb-3">
                {typeLabel}
              </span>
              <h1 className="text-2xl sm:text-3xl font-sora font-bold text-[#171d2b] mb-2">
                {title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-[#171d2b]/60">
                <span className="flex items-center gap-1.5">
                  <BookOpen size={14} />
                  {itemCount} {itemLabel}
                </span>
                <span className="flex items-center gap-1.5">
                  <User size={14} />
                  {data.owner.name}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {new Date(data.share.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleAddToCollection}
              disabled={adding}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#171d2b] text-white rounded-xl font-medium hover:bg-[#2a3347] transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {adding ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ExternalLink size={18} />
              )}
              {adding ? 'Adding...' : 'Add to My Collection'}
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="mb-6">
          <h2 className="font-sora font-semibold text-[#171d2b] mb-4">
            Preview
          </h2>
          
          {data.type === 'flashcard_set' ? (
            <FlashcardPreview data={data} />
          ) : (
            <ReviewerPreview data={data} />
          )}
        </div>

        {/* Bottom CTA */}
        <div className="bg-white rounded-2xl border border-[#171d2b]/10 p-6 text-center">
          <h3 className="font-sora font-semibold text-[#171d2b] mb-2">
            Want to study this material?
          </h3>
          <p className="text-[#171d2b]/60 text-sm mb-4">
            Add it to your collection to start learning with flashcards, practice mode, and more.
          </p>
          <button
            onClick={handleAddToCollection}
            disabled={adding}
            className="px-8 py-3 bg-[#171d2b] text-white rounded-xl font-medium hover:bg-[#2a3347] transition-colors disabled:opacity-50"
          >
            {adding ? 'Adding...' : 'Add to My Collection'}
          </button>
        </div>
      </main>
    </div>
  )
}
