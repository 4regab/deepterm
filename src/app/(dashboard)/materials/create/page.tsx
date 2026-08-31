'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  StepIndicator,
  PageHeader,
  Button,
  Toast,
} from '@/components/ui';
import CaptchaModal from '@/components/CaptchaModal';
import { useCreateDraft } from './useCreateDraft';
import { StepSource } from './StepSource';
import { StepConfigure } from './StepConfigure';
import { GeneratingState } from './GeneratingState';
import { StepReview } from './StepReview';
import { BulkImportDialog } from './BulkImportDialog';
import { ConfirmSourceChangeDialog } from './ConfirmSourceChangeDialog';

const WIZARD_STEPS = ['Source', 'Configure', 'Review'] as const;

export default function CreateMaterialPage() {
  const router = useRouter();
  const [showBulkModal, setShowBulkModal] = React.useState(false);

  const {
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

    // Generated draft
    cards,
    setCards,
    addCard,
    updateCard,
    removeCard,
    duplicateCard,
    reviewerCategories,
    addReviewerCategory,
    updateReviewerCategoryName,
    removeReviewerCategory,
    addReviewerTerm,
    updateReviewerTerm,
    removeReviewerTerm,
    generatedFrom,

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
    toastMessage,
    setToastMessage,

    // Reset confirmation
    showConfirmReset,
    confirmResetAndProceed,
    cancelReset,
  } = useCreateDraft();

  // Current Step Index for StepIndicator
  const currentStepIndex =
    wizardStep === 'source' ? 0 : wizardStep === 'configure' ? 1 : 2;

  // Breadcrumb
  const breadcrumbs = [
    { label: 'Materials', href: '/materials' },
    { label: 'Create' },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl pb-28">
      {/* 1. Step Indicator (Source -> Configure -> Review) */}
      <div className="mb-6">
        <StepIndicator
          steps={WIZARD_STEPS}
          current={currentStepIndex}
          label="Material creation steps"
        />
      </div>

      {/* 2. Page Header */}
      <PageHeader
        title={
          wizardStep === 'source'
            ? 'Create material'
            : wizardStep === 'configure'
              ? 'Configure material'
              : 'Review & refine'
        }
        description={
          wizardStep === 'source'
            ? 'Start from a document, paste notes, or build by hand'
            : wizardStep === 'configure'
              ? 'Choose what to build and how it should be structured'
              : 'Edit and perfect your study material before saving'
        }
        breadcrumb={breadcrumbs}
      />

      {/* 3. Wizard Content Steps */}
      <div className="mb-8">
        {/* State: Generating active state replaces configure panel */}
        {isGenerating ? (
          <GeneratingState
            targetType={targetType}
            statusIndex={generatingStatusIndex}
            onCancel={handleCancelGeneration}
            materialName={
              sourceMethod === 'file'
                ? selectedFile?.name || fileSummary?.name || undefined
                : undefined
            }
          />
        ) : (
          <>
            {/* Step 1: Source Selection */}
            {wizardStep === 'source' && (
              <StepSource
                sourceMethod={sourceMethod}
                onSelectMethod={setSourceMethod}
                selectedFile={selectedFile}
                fileSummary={fileSummary}
                onFileSelect={handleFileSelect}
                onRemoveFile={removeSelectedFile}
                pastedText={pastedText}
                onPastedTextChange={setPastedText}
                onOpenBulkHelp={() => setShowBulkModal(true)}
                error={error}
              />
            )}

            {/* Step 2: Configure & Generate */}
            {wizardStep === 'configure' && (
              <StepConfigure
                sourceMethod={sourceMethod}
                selectedFile={selectedFile}
                fileSummary={fileSummary}
                pastedText={pastedText}
                onRequestChangeSource={() =>
                  requestSourceChange(() => setWizardStep('source'))
                }
                targetType={targetType}
                onSelectTargetType={setTargetType}
                extractionMode={extractionMode}
                onSelectExtractionMode={setExtractionMode}
                title={title}
                onTitleChange={setTitle}
                folderId={folderId}
                onSelectFolder={setFolderId}
                folders={folders}
                onCreateFolder={handleCreateFolder}
                creatingFolder={creatingFolder}
                remainingGenerations={remainingGenerations}
                sitekey={sitekey}
                captchaVerified={captchaVerified}
                onOpenCaptchaModal={() => setShowCaptchaModal(true)}
                error={error}
              />
            )}

            {/* Step 3: Review & Refine */}
            {wizardStep === 'review' && (
              <StepReview
                targetType={targetType}
                cards={cards}
                onAddCard={addCard}
                onUpdateCard={updateCard}
                onRemoveCard={removeCard}
                onDuplicateCard={duplicateCard}
                reviewerCategories={reviewerCategories}
                onAddReviewerCategory={addReviewerCategory}
                onUpdateReviewerCategoryName={updateReviewerCategoryName}
                onRemoveReviewerCategory={removeReviewerCategory}
                onAddReviewerTerm={addReviewerTerm}
                onUpdateReviewerTerm={updateReviewerTerm}
                onRemoveReviewerTerm={removeReviewerTerm}
                onRegenerate={() =>
                  requestSourceChange(() => setWizardStep('configure'))
                }
                onOpenBulkImport={() => setShowBulkModal(true)}
                generatedFrom={generatedFrom}
                error={error}
              />
            )}
          </>
        )}
      </div>

      {/* 4. Sticky Footer Action Bar (Fixed at bottom on all devices) */}
      {!isGenerating && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-default bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] backdrop-blur-md px-4 py-3 shadow-[var(--elev-2)]">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
            {/* Left Action / Back */}
            {wizardStep === 'source' ? (
              <Button
                variant="ghost"
                size="md"
                onClick={() => router.push('/materials')}
              >
                Cancel
              </Button>
            ) : wizardStep === 'configure' ? (
              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  requestSourceChange(() => setWizardStep('source'))
                }
              >
                &larr; Back
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                onClick={() =>
                  requestSourceChange(() => setWizardStep('configure'))
                }
              >
                &larr; Back
              </Button>
            )}

            {/* Right Action / Continue / Generate / Save */}
            {wizardStep === 'source' ? (
              <Button
                variant="primary"
                size="lg"
                disabled={!canContinueToConfigure()}
                onClick={handleContinueToConfigure}
              >
                Continue &rarr;
              </Button>
            ) : wizardStep === 'configure' ? (
              <Button
                variant="primary"
                size="lg"
                disabled={
                  (sourceMethod === 'file' && !selectedFile) ||
                  (sourceMethod === 'text' && !pastedText.trim()) ||
                  !title.trim()
                }
                onClick={handleGenerate}
              >
                {sourceMethod === 'manual'
                  ? 'Start Building \u2192'
                  : '\u2726 Generate Material \u2192'}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                loading={isSaving}
                disabled={
                  isSaving ||
                  !title.trim() ||
                  (targetType === 'material' &&
                    cards.filter((c) => c.term.trim() && c.definition.trim())
                      .length === 0) ||
                  (targetType === 'reviewer' &&
                    reviewerCategories.reduce(
                      (acc, cat) =>
                        acc +
                        cat.terms.filter(
                          (t) => t.term.trim() && t.definition.trim()
                        ).length,
                      0
                    ) === 0)
                }
                onClick={handleSave}
              >
                Save Material &check;
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Modals & Dialogs */}
      {/* 1. Bulk Import / Help Dialog */}
      <BulkImportDialog
        open={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        onImport={(importedCards) => {
          setCards((prev) => {
            const existing = prev.filter((c) => c.term.trim() || c.definition.trim());
            return existing.length > 0 ? [...existing, ...importedCards] : importedCards;
          });
          setToastMessage({
            kind: 'success',
            text: `Imported ${importedCards.length} flashcards.`,
          });
        }}
      />

      {/* 2. Captcha Modal */}
      <CaptchaModal
        isOpen={showCaptchaModal}
        onClose={() => setShowCaptchaModal(false)}
        onVerify={handleCaptchaVerify}
        onError={handleCaptchaError}
      />

      {/* 3. Confirm Source Change Dialog */}
      <ConfirmSourceChangeDialog
        open={showConfirmReset}
        onConfirm={confirmResetAndProceed}
        onCancel={cancelReset}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50">
          <Toast kind={toastMessage.kind}>
            {toastMessage.text}
          </Toast>
        </div>
      )}
    </div>
  );
}
