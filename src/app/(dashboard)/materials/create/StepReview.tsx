'use client';

import * as React from 'react';
import {
  Plus,
  Trash2,
  Copy,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Badge,
  Input,
  Textarea,
} from '@/components/ui';
import type {
  MaterialTargetType,
  FlashcardDraftItem,
  ReviewerCategoryDraft,
} from './types';

interface StepReviewProps {
  targetType: MaterialTargetType;
  cards: FlashcardDraftItem[];
  onAddCard: () => void;
  onUpdateCard: (id: string, field: 'term' | 'definition', value: string) => void;
  onRemoveCard: (id: string) => void;
  onDuplicateCard: (id: string) => void;
  reviewerCategories: ReviewerCategoryDraft[];
  onAddReviewerCategory: () => void;
  onUpdateReviewerCategoryName: (id: string, name: string) => void;
  onRemoveReviewerCategory: (id: string) => void;
  onAddReviewerTerm: (categoryId: string) => void;
  onUpdateReviewerTerm: (
    categoryId: string,
    termId: string,
    field: 'term' | 'definition',
    value: string
  ) => void;
  onRemoveReviewerTerm: (categoryId: string, termId: string) => void;
  onRegenerate: () => void;
  onOpenBulkImport?: () => void;
  generatedFrom?: string | null;
  error?: string | null;
}

export function StepReview({
  targetType,
  cards,
  onAddCard,
  onUpdateCard,
  onRemoveCard,
  onDuplicateCard,
  reviewerCategories,
  onAddReviewerCategory,
  onUpdateReviewerCategoryName,
  onRemoveReviewerCategory,
  onAddReviewerTerm,
  onUpdateReviewerTerm,
  onRemoveReviewerTerm,
  onRegenerate,
  onOpenBulkImport,
  generatedFrom,
  error,
}: StepReviewProps) {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([]);

  // Expand all categories by default on mount
  React.useEffect(() => {
    if (reviewerCategories.length > 0 && expandedCategories.length === 0) {
      setExpandedCategories(reviewerCategories.map((c) => c.id));
    }
  }, [reviewerCategories, expandedCategories.length]);

  const toggleCategory = (id: string) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  // Filtered Cards
  const filteredCards = cards.filter((card) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return card.term.toLowerCase().includes(q) || card.definition.toLowerCase().includes(q);
  });

  // Filtered Reviewer Categories & Terms
  const filteredCategories = reviewerCategories
    .map((cat) => ({
      ...cat,
      terms: cat.terms.filter((term) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return term.term.toLowerCase().includes(q) || term.definition.toLowerCase().includes(q);
      }),
    }))
    .filter((cat) => cat.terms.length > 0 || !searchQuery.trim());

  const totalTermsCount =
    targetType === 'material'
      ? cards.filter((c) => c.term.trim() && c.definition.trim()).length
      : reviewerCategories.reduce((acc, cat) => acc + cat.terms.length, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Review Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-default bg-surface p-4">
        <div className="flex items-center gap-2.5">
          <Badge tone="success" className="h-6 px-2.5">
            &check; {totalTermsCount} {targetType === 'material' ? 'cards' : 'terms'} ready
          </Badge>
          {generatedFrom && (
            <span className="caption text-muted truncate max-w-[200px] sm:max-w-xs">
              from {generatedFrom}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {onOpenBulkImport && targetType === 'material' && (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={onOpenBulkImport}
            >
              <FileText size={14} aria-hidden="true" />
              Bulk Add
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRegenerate}
            className="text-secondary"
          >
            <RefreshCw size={14} aria-hidden="true" />
            Regenerate
          </Button>
        </div>
      </div>

      {/* 2. Search / Filter Toolbar */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          size={16}
          aria-hidden="true"
        />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={
            targetType === 'material' ? 'Filter cards by term or definition...' : 'Filter study guide sections & terms...'
          }
          className="pl-9 bg-surface"
        />
      </div>

      {/* 3. Flashcards Editor Mode */}
      {targetType === 'material' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="label text-ink uppercase tracking-wider">
              Flashcard List ({cards.length})
            </h3>
            <span className="caption text-muted">Edit, duplicate, or reorder</span>
          </div>

          <div className="flex flex-col gap-3">
            {filteredCards.map((card, index) => {
              const hasShortDef = card.definition.trim().length > 0 && card.definition.trim().length < 4;
              return (
                <Card
                  key={card.id}
                  variant="sunken"
                  padding="md"
                  className="group relative transition-all hover:border-input focus-within:border-brand"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="label tabular text-muted bg-surface px-2 py-0.5 rounded-xs border border-subtle">
                        #{index + 1}
                      </span>
                      {card.provenance && (
                        <Badge tone="neutral" className="text-[10px]">
                          {card.provenance}
                        </Badge>
                      )}
                      {hasShortDef && (
                        <span className="caption inline-flex items-center gap-1 text-warn-text">
                          <AlertCircle size={12} /> Very short definition
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <IconButton
                        aria-label="Duplicate card"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDuplicateCard(card.id)}
                        title="Duplicate card"
                      >
                        <Copy size={14} aria-hidden="true" />
                      </IconButton>
                      <IconButton
                        aria-label="Delete card"
                        variant="danger-ghost"
                        size="sm"
                        disabled={cards.length <= 1}
                        onClick={() => onRemoveCard(card.id)}
                        title="Delete card"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </IconButton>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="caption uppercase tracking-wider text-muted font-medium">
                        Term / Front
                      </label>
                      <Input
                        value={card.term}
                        onChange={(e) => onUpdateCard(card.id, 'term', e.target.value)}
                        placeholder="Enter term or concept"
                        className="bg-surface font-medium"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="caption uppercase tracking-wider text-muted font-medium">
                        Definition / Back
                      </label>
                      <Textarea
                        value={card.definition}
                        onChange={(e) => onUpdateCard(card.id, 'definition', e.target.value)}
                        placeholder="Enter clear, concise explanation"
                        rows={2}
                        showCount={false}
                        className="min-h-10 py-2 bg-surface"
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Add Card Button */}
          <button
            type="button"
            onClick={onAddCard}
            className="flex items-center justify-center gap-2 w-full py-4 rounded-lg border-2 border-dashed border-default bg-surface/50 text-secondary hover:border-brand hover:bg-surface hover:text-brand transition-all cursor-pointer"
          >
            <Plus size={16} aria-hidden="true" />
            <span className="label font-medium">Add Flashcard</span>
          </button>
        </div>
      )}

      {/* 4. Reviewer Editor Mode */}
      {targetType === 'reviewer' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="label text-ink uppercase tracking-wider">
              Study Guide Sections ({reviewerCategories.length})
            </h3>
            <span className="caption text-muted">Organize terms into categories</span>
          </div>

          <div className="flex flex-col gap-4">
            {filteredCategories.map((category) => {
              const isExpanded = expandedCategories.includes(category.id);
              return (
                <Card
                  key={category.id}
                  variant="flat"
                  className="border-default bg-surface overflow-hidden"
                >
                  {/* Category Header */}
                  <div
                    onClick={() => toggleCategory(category.id)}
                    className="flex items-center justify-between p-4 bg-surface hover:bg-surface-hover transition-colors cursor-pointer border-l-4 border-l-reviewer"
                  >
                    <div className="flex items-center gap-3 flex-1 mr-4">
                      <input
                        type="text"
                        value={category.name}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) =>
                          onUpdateReviewerCategoryName(category.id, e.target.value)
                        }
                        placeholder="Section Name"
                        className="body-strong text-ink bg-transparent border-b border-transparent hover:border-border focus:border-brand focus:outline-none px-1 py-0.5 rounded-xs"
                      />
                      <Badge tone="reviewer">{category.terms.length} terms</Badge>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <IconButton
                        aria-label="Delete section"
                        variant="danger-ghost"
                        size="sm"
                        disabled={reviewerCategories.length <= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveReviewerCategory(category.id);
                        }}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                      </IconButton>
                      <span className="text-muted">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </span>
                    </div>
                  </div>

                  {/* Terms in Category */}
                  {isExpanded && (
                    <div className="p-4 border-t border-subtle bg-surface-sunken/40 flex flex-col gap-3">
                      {category.terms.map((term, tIndex) => (
                        <div
                          key={term.id}
                          className="p-3.5 rounded-md border border-default bg-surface flex flex-col gap-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="caption tabular text-muted">
                              Term #{tIndex + 1}
                            </span>
                            <IconButton
                              aria-label="Delete term"
                              variant="danger-ghost"
                              size="sm"
                              disabled={category.terms.length <= 1}
                              onClick={() => onRemoveReviewerTerm(category.id, term.id)}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </IconButton>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            <Input
                              value={term.term}
                              onChange={(e) =>
                                onUpdateReviewerTerm(
                                  category.id,
                                  term.id,
                                  'term',
                                  e.target.value
                                )
                              }
                              placeholder="Key Term"
                              className="bg-surface font-medium"
                            />
                            <Textarea
                              value={term.definition}
                              onChange={(e) =>
                                onUpdateReviewerTerm(
                                  category.id,
                                  term.id,
                                  'definition',
                                  e.target.value
                                )
                              }
                              placeholder="Detailed definition or summary"
                              rows={2}
                              showCount={false}
                              className="min-h-10 py-1.5 bg-surface text-sm"
                            />
                          </div>

                          {term.examples && term.examples.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <span className="overline text-muted">Examples:</span>
                              {term.examples.map((ex, i) => (
                                <span
                                  key={i}
                                  className="caption rounded bg-surface-sunken px-2 py-0.5 text-secondary border border-subtle"
                                >
                                  {ex}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => onAddReviewerTerm(category.id)}
                        className="self-start mt-1"
                      >
                        <Plus size={14} aria-hidden="true" />
                        Add term to this section
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onAddReviewerCategory}
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-lg border-2 border-dashed border-default bg-surface/50 text-secondary hover:border-brand hover:bg-surface hover:text-brand transition-all cursor-pointer"
          >
            <Plus size={16} aria-hidden="true" />
            <span className="label font-medium">Add New Section</span>
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-danger bg-danger-subtle p-3 text-danger-text body-sm" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

export default StepReview;
