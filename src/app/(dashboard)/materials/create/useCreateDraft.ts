'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/config/supabase/client';
import { fetchFolders, createFolder, type SupabaseLike } from '@/lib/folders/api';
import type { Folder } from '@/lib/schemas/materials';
import { buildReviewerInsertPayloads } from '@/utils/reviewerBatch';
import { generateItemId } from './parseBulkText';
import type {
  WizardStep,
  SourceMethod,
  MaterialTargetType,
  ExtractionMode,
  FlashcardDraftItem,
  ReviewerCategoryDraft,
  StoredDraft,
} from './types';

const DRAFT_STORAGE_KEY = 'deepterm_create_draft_v1';
export const ACCEPTED_FILE_EXTENSIONS = ['pdf', 'docx', 'png', 'jpg', 'jpeg', 'webp'];
export const ACCEPTED_FILE_TYPES_ATTR = '.pdf,.docx,.png,.jpg,.jpeg,.webp';
export const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

interface ApiCategory {
  name: string;
  color?: string;
  terms?: Array<{
    term: string;
    definition: string;
    examples?: string[];
    keywords?: string[];
    subcategoryTitle?: string;
    subcategories?: string[];
  }>;
}

export function useCreateDraft() {
  const router = useRouter();
  const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Wizard Navigation
  const [wizardStep, setWizardStep] = useState<WizardStep>('source');
  const [sourceMethod, setSourceMethod] = useState<SourceMethod>('file');

  // Source Inputs
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileSummary, setFileSummary] = useState<{ name: string; size: number; type: string } | null>(null);
  const [pastedText, setPastedText] = useState<string>('');

  // Configuration
  const [targetType, setTargetType] = useState<MaterialTargetType>('material');
  const [extractionMode, setExtractionMode] = useState<ExtractionMode>('full');
  const [title, setTitle] = useState<string>('');
  const [folderId, setFolderId] = useState<string | null>(null);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [creatingFolder, setCreatingFolder] = useState<boolean>(false);

  // Review & Generated Draft Content
  const [cards, setCards] = useState<FlashcardDraftItem[]>([
    { id: generateItemId(), term: '', definition: '' },
  ]);
  const [reviewerCategories, setReviewerCategories] = useState<ReviewerCategoryDraft[]>([]);
  const [generatedFrom, setGeneratedFrom] = useState<string | null>(null);

  // AI & Processing States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatingStatusIndex, setGeneratingStatusIndex] = useState<number>(0);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [remainingGenerations, setRemainingGenerations] = useState<number | null>(null);

  // Captcha State
  const [showCaptchaModal, setShowCaptchaModal] = useState<boolean>(false);
  const [captchaVerified, setCaptchaVerified] = useState<boolean>(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);

  // Confirmation Modal for Source Change
  const [showConfirmReset, setShowConfirmReset] = useState<boolean>(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  // Abort Controller for Client Timeout & Manual Cancel
  const abortControllerRef = useRef<AbortController | null>(null);

  // Load Folders & AI Usage on Mount
  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const { data, error: loadError } = await fetchFolders(createClient() as unknown as SupabaseLike);
        if (mounted && !loadError && data) {
          setFolders(data);
        }
      } catch {
        // Ignore folder fetch errors on initial mount
      }
    })();

    void fetch('/api/ai-usage', { credentials: 'same-origin' })
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as { remaining?: number };
        if (mounted && typeof data.remaining === 'number') {
          setRemainingGenerations(data.remaining);
        }
      })
      .catch(() => undefined);

    // Restore draft from sessionStorage if available
    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredDraft;
        if (parsed) {
          if (parsed.wizardStep) setWizardStep(parsed.wizardStep);
          if (parsed.sourceMethod) setSourceMethod(parsed.sourceMethod);
          if (parsed.pastedText) setPastedText(parsed.pastedText);
          if (parsed.fileName && parsed.fileSize) {
            setFileSummary({ name: parsed.fileName, size: parsed.fileSize, type: 'file' });
          }
          if (parsed.targetType) setTargetType(parsed.targetType);
          if (parsed.extractionMode) setExtractionMode(parsed.extractionMode);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.folderId) setFolderId(parsed.folderId);
          if (parsed.cards && parsed.cards.length > 0) setCards(parsed.cards);
          if (parsed.reviewerCategories && parsed.reviewerCategories.length > 0) {
            setReviewerCategories(parsed.reviewerCategories);
          }
          if (parsed.generatedFrom) setGeneratedFrom(parsed.generatedFrom);
        }
      }
    } catch {
      // sessionStorage unavailable or parse error
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Persist draft to sessionStorage on changes
  useEffect(() => {
    try {
      const draft: StoredDraft = {
        wizardStep,
        sourceMethod,
        pastedText,
        fileName: fileSummary?.name ?? null,
        fileSize: fileSummary?.size ?? null,
        targetType,
        extractionMode,
        title,
        folderId,
        cards,
        reviewerCategories,
        generatedFrom,
      };
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore sessionStorage quota / disabled errors
    }
  }, [
    wizardStep,
    sourceMethod,
    pastedText,
    fileSummary,
    targetType,
    extractionMode,
    title,
    folderId,
    cards,
    reviewerCategories,
    generatedFrom,
  ]);

  // Rotate status message while generating
  useEffect(() => {
    if (!isGenerating) return;
    const interval = setInterval(() => {
      setGeneratingStatusIndex((prev) => (prev + 1) % 3);
    }, 3500);
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Helper to clear draft from sessionStorage
  const clearPersistedDraft = () => {
    try {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  // Check if draft has substantive content generated or written
  const hasGeneratedContent =
    cards.some((c) => c.term.trim() || c.definition.trim()) ||
    reviewerCategories.length > 0;

  // File validation and selection
  const handleFileSelect = (file: File) => {
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size exceeds 20MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
      return false;
    }

    const ext = file.name.toLowerCase().split('.').pop();
    if (!ext || !ACCEPTED_FILE_EXTENSIONS.includes(ext)) {
      setError('Unsupported file type. Please upload a PDF, DOCX, PNG, JPG, or WebP document.');
      return false;
    }

    setSelectedFile(file);
    setFileSummary({
      name: file.name,
      size: file.size,
      type: file.type || ext,
    });
    setSourceMethod('file');

    // Auto-fill title if empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(cleanName);
    }

    return true;
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFileSummary(null);
  };

  // Captcha handlers
  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setCaptchaVerified(true);
    setShowCaptchaModal(false);
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setCaptchaVerified(false);
    setError('Captcha verification failed. Please try again.');
  };

  const resetCaptcha = () => {
    setCaptchaToken(null);
    setCaptchaVerified(false);
  };

  // Step 1 -> Step 2 validation
  const canContinueToConfigure = () => {
    if (sourceMethod === 'file') return Boolean(selectedFile || fileSummary);
    if (sourceMethod === 'text') return Boolean(pastedText.trim().length > 0);
    if (sourceMethod === 'manual') return true;
    return false;
  };

  const handleContinueToConfigure = () => {
    setError(null);
    if (!canContinueToConfigure()) {
      if (sourceMethod === 'file') setError('Please upload or drop a document to continue.');
      else if (sourceMethod === 'text') setError('Please paste some text or notes to continue.');
      return;
    }

    // Auto-fill title from text if needed
    if (!title.trim() && sourceMethod === 'text' && pastedText.trim()) {
      const firstLine = pastedText.trim().split('\n')[0]?.slice(0, 40) ?? '';
      if (firstLine) setTitle(firstLine);
    }

    setWizardStep('configure');
  };

  // Request changing source with confirmation if generated content exists
  const requestSourceChange = (action: () => void) => {
    if (hasGeneratedContent && wizardStep !== 'source') {
      pendingActionRef.current = action;
      setShowConfirmReset(true);
    } else {
      action();
    }
  };

  const confirmResetAndProceed = () => {
    setShowConfirmReset(false);
    setCards([{ id: generateItemId(), term: '', definition: '' }]);
    setReviewerCategories([]);
    setGeneratedFrom(null);
    if (pendingActionRef.current) {
      pendingActionRef.current();
      pendingActionRef.current = null;
    }
  };

  const cancelReset = () => {
    setShowConfirmReset(false);
    pendingActionRef.current = null;
  };

  // Create folder inline
  const handleCreateFolder = async (name: string): Promise<boolean> => {
    setCreatingFolder(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Your session expired. Please sign in again.');
        return false;
      }
      const { data, error: createError } = await createFolder(supabase as unknown as SupabaseLike, {
        userId: user.id,
        name,
      });
      if (createError || !data) {
        setError(createError ?? 'Could not create the folder.');
        return false;
      }
      setFolders((current) => [...current, data]);
      setFolderId(data.id);
      return true;
    } catch {
      setError('Failed to create folder.');
      return false;
    } finally {
      setCreatingFolder(false);
    }
  };

  // Cancel in-flight generation
  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsGenerating(false);
    setError(null);
    setWizardStep('configure');
  };

  // Generate with AI
  const handleGenerate = async () => {
    setError(null);

    // If manual creation, skip generation directly to Review/Build step
    if (sourceMethod === 'manual') {
      if (targetType === 'material' && cards.length === 0) {
        setCards([{ id: generateItemId(), term: '', definition: '' }]);
      } else if (targetType === 'reviewer' && reviewerCategories.length === 0) {
        setReviewerCategories([
          {
            id: generateItemId(),
            name: 'Main Concepts',
            color: '#E0F2FE',
            terms: [{ id: generateItemId(), term: '', definition: '' }],
          },
        ]);
      }
      setWizardStep('review');
      return;
    }

    // Require captcha if sitekey configured and not yet verified
    if (sitekey && !captchaVerified) {
      setShowCaptchaModal(true);
      return;
    }

    if (sourceMethod === 'file' && !selectedFile && !fileSummary) {
      setError('Please select a file to generate from.');
      return;
    }

    if (sourceMethod === 'text' && !pastedText.trim()) {
      setError('Please paste text to generate from.');
      return;
    }

    setIsGenerating(true);
    setGeneratingStatusIndex(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 90000); // 90 second timeout

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to generate study materials.');
      }

      const formData = new FormData();
      if (sourceMethod === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      } else if (sourceMethod === 'text') {
        formData.append('textContent', pastedText);
      }

      if (captchaToken) {
        formData.append('cf-turnstile-response', captchaToken);
      }

      if (targetType === 'material') {
        // Generate Flashcards
        const response = await fetch('/api/generate-cards', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          credentials: 'same-origin',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to generate cards');
        }

        const data = await response.json();
        const rawCards = (data.cards || []) as Array<{ term: string; definition: string }>;
        const newCards: FlashcardDraftItem[] = rawCards.map((c) => ({
          id: generateItemId(),
          term: c.term || '',
          definition: c.definition || '',
        }));

        if (newCards.length === 0) {
          throw new Error('No flashcards could be extracted from this material. Try adding more detailed text.');
        }

        setCards(newCards);
        setGeneratedFrom(
          sourceMethod === 'file' ? selectedFile?.name || fileSummary?.name || 'Document' : 'Pasted text'
        );
        setWizardStep('review');
      } else {
        // Generate Reviewer
        formData.append('extractionMode', extractionMode);

        const response = await fetch('/api/generate-reviewer', {
          method: 'POST',
          body: formData,
          signal: controller.signal,
          credentials: 'same-origin',
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to generate reviewer');
        }

        const data = await response.json();
        if (data.title && !title.trim()) {
          setTitle(data.title);
        }

        const categories: ReviewerCategoryDraft[] = (data.categories || []).map(
          (cat: ApiCategory, i: number) => ({
            id: `cat-${generateItemId()}-${i}`,
            name: cat.name || `Section ${i + 1}`,
            color: cat.color || '#E0F2FE',
            terms: (cat.terms || []).map((t, j) => ({
              id: `term-${generateItemId()}-${i}-${j}`,
              term: String(t.term || ''),
              definition: String(t.definition || ''),
              examples: (t.examples || []).map((ex) => (typeof ex === 'string' ? ex : String(ex))),
              keywords: (t.keywords || []).map((kw) => (typeof kw === 'string' ? kw : String(kw))),
              subcategoryTitle: t.subcategoryTitle ? String(t.subcategoryTitle) : undefined,
              subcategories: (t.subcategories || []).map((sub) => (typeof sub === 'string' ? sub : String(sub))),
            })),
          })
        );

        if (categories.length === 0) {
          throw new Error('No study guide sections could be extracted. Try adding more structured notes.');
        }

        setReviewerCategories(categories);
        setGeneratedFrom(
          sourceMethod === 'file' ? selectedFile?.name || fileSummary?.name || 'Document' : 'Pasted text'
        );
        setWizardStep('review');
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Generation timed out or was cancelled. Please try with smaller content.');
      } else {
        setError(err instanceof Error ? err.message : 'Generation failed. Please try again.');
      }
      setWizardStep('configure');
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
      abortControllerRef.current = null;
      resetCaptcha();
    }
  };

  // Card list management
  const addCard = () => {
    setCards((prev) => [...prev, { id: generateItemId(), term: '', definition: '' }]);
  };

  const updateCard = (id: string, field: 'term' | 'definition', value: string) => {
    setCards((prev) => prev.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeCard = (id: string) => {
    setCards((prev) => (prev.length > 1 ? prev.filter((c) => c.id !== id) : prev));
  };

  const duplicateCard = (id: string) => {
    setCards((prev) => {
      const index = prev.findIndex((c) => c.id === id);
      if (index === -1) return prev;
      const target = prev[index]!;
      const clone: FlashcardDraftItem = {
        id: generateItemId(),
        term: target.term,
        definition: target.definition,
        provenance: target.provenance,
      };
      const copy = [...prev];
      copy.splice(index + 1, 0, clone);
      return copy;
    });
  };

  // Reviewer category / term management
  const addReviewerCategory = () => {
    setReviewerCategories((prev) => [
      ...prev,
      {
        id: generateItemId(),
        name: `Section ${prev.length + 1}`,
        color: '#E0F2FE',
        terms: [{ id: generateItemId(), term: '', definition: '' }],
      },
    ]);
  };

  const updateReviewerCategoryName = (categoryId: string, name: string) => {
    setReviewerCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...cat, name } : cat))
    );
  };

  const removeReviewerCategory = (categoryId: string) => {
    setReviewerCategories((prev) =>
      prev.length > 1 ? prev.filter((cat) => cat.id !== categoryId) : prev
    );
  };

  const addReviewerTerm = (categoryId: string) => {
    setReviewerCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              terms: [...cat.terms, { id: generateItemId(), term: '', definition: '' }],
            }
          : cat
      )
    );
  };

  const updateReviewerTerm = (
    categoryId: string,
    termId: string,
    field: 'term' | 'definition',
    value: string
  ) => {
    setReviewerCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              terms: cat.terms.map((t) => (t.id === termId ? { ...t, [field]: value } : t)),
            }
          : cat
      )
    );
  };

  const removeReviewerTerm = (categoryId: string, termId: string) => {
    setReviewerCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              terms: cat.terms.length > 1 ? cat.terms.filter((t) => t.id !== termId) : cat.terms,
            }
          : cat
      )
    );
  };

  // Save to Database
  const handleSave = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Please provide a title for your study material.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated. Please sign in again.');

      const sanitizedTitle = cleanTitle.replace(/[<>]/g, '').trim();

      if (targetType === 'material') {
        // Save Flashcards
        const validCards = cards.filter((c) => c.term.trim() && c.definition.trim());
        if (validCards.length === 0) {
          throw new Error('Please include at least one complete card with a term and definition.');
        }

        const { data: flashcardSet, error: setErrorResult } = await supabase
          .from('flashcard_sets')
          .insert({
            user_id: user.id,
            title: sanitizedTitle,
            color: '#E0F2FE',
            folder_id: folderId,
          })
          .select('id')
          .single();

        if (setErrorResult) throw setErrorResult;
        if (!flashcardSet) throw new Error('Failed to create flashcard set.');

        const flashcardsToInsert = validCards.map((c) => ({
          set_id: flashcardSet.id,
          user_id: user.id,
          front: c.term.trim(),
          back: c.definition.trim(),
          status: 'new',
        }));

        const { error: cardsError } = await supabase
          .from('flashcards')
          .insert(flashcardsToInsert);

        if (cardsError) {
          // Rollback created set
          await supabase.from('flashcard_sets').delete().eq('id', flashcardSet.id);
          throw cardsError;
        }

        // Increment stats
        void supabase.rpc('increment_stat', {
          p_stat_name: 'flashcard_sets_created',
          p_amount: 1,
        });

        clearPersistedDraft();
        setToastMessage({ kind: 'success', text: 'Material saved successfully!' });
        router.push(`/materials/${flashcardSet.id}`);
      } else {
        // Save Reviewer
        const validCategories = reviewerCategories
          .map((cat) => ({
            ...cat,
            name: cat.name.trim() || 'Untitled Section',
            terms: cat.terms.filter((t) => t.term.trim() && t.definition.trim()),
          }))
          .filter((cat) => cat.terms.length > 0);

        if (validCategories.length === 0) {
          throw new Error('Please include at least one section with complete terms and definitions.');
        }

        const { data: reviewer, error: reviewerError } = await supabase
          .from('reviewers')
          .insert({
            user_id: user.id,
            title: sanitizedTitle,
            source_content:
              sourceMethod === 'file'
                ? selectedFile?.name || fileSummary?.name || 'Document'
                : sourceMethod === 'text'
                  ? 'Pasted text'
                  : 'Manual entry',
            extraction_mode: extractionMode,
            folder_id: folderId,
          })
          .select('id')
          .single();

        if (reviewerError) throw reviewerError;
        if (!reviewer) throw new Error('Failed to create reviewer.');

        const { categoryRows, termRows } = buildReviewerInsertPayloads({
          reviewerId: reviewer.id,
          userId: user.id,
          categories: validCategories,
        });

        if (categoryRows.length > 0) {
          const { error: catErr } = await supabase
            .from('reviewer_categories')
            .insert(categoryRows);

          if (catErr) {
            await supabase.from('reviewers').delete().eq('id', reviewer.id);
            throw catErr;
          }
        }

        if (termRows.length > 0) {
          const { error: termsErr } = await supabase
            .from('reviewer_terms')
            .insert(termRows);

          if (termsErr) {
            await supabase.from('reviewers').delete().eq('id', reviewer.id);
            throw termsErr;
          }
        }

        // Increment stats
        void supabase.rpc('increment_stat', {
          p_stat_name: 'reviewers_created',
          p_amount: 1,
        });

        clearPersistedDraft();
        setToastMessage({ kind: 'success', text: 'Reviewer saved successfully!' });
        router.push(`/materials/${reviewer.id}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save material.');
      setToastMessage({
        kind: 'error',
        text: err instanceof Error ? err.message : 'Failed to save material.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // Navigation
    wizardStep,
    setWizardStep,
    sourceMethod,
    setSourceMethod,
    canContinueToConfigure,
    handleContinueToConfigure,
    requestSourceChange,

    // Source inputs
    selectedFile,
    fileSummary,
    handleFileSelect,
    removeSelectedFile,
    pastedText,
    setPastedText,

    // Configuration
    targetType,
    setTargetType,
    extractionMode,
    setExtractionMode,
    title,
    setTitle,
    folderId,
    setFolderId,
    folders,
    creatingFolder,
    handleCreateFolder,

    // Generated / Review draft
    cards,
    setCards,
    addCard,
    updateCard,
    removeCard,
    duplicateCard,
    reviewerCategories,
    setReviewerCategories,
    addReviewerCategory,
    updateReviewerCategoryName,
    removeReviewerCategory,
    addReviewerTerm,
    updateReviewerTerm,
    removeReviewerTerm,
    generatedFrom,
    hasGeneratedContent,

    // Generation State
    isGenerating,
    generatingStatusIndex,
    handleGenerate,
    handleCancelGeneration,
    remainingGenerations,

    // Captcha
    sitekey,
    showCaptchaModal,
    setShowCaptchaModal,
    captchaVerified,
    handleCaptchaVerify,
    handleCaptchaError,

    // Saving & Toasts
    isSaving,
    handleSave,
    error,
    setError,
    toastMessage,
    setToastMessage,

    // Reset confirmation
    showConfirmReset,
    confirmResetAndProceed,
    cancelReset,
  };
}
