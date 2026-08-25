'use client';

import * as React from 'react';
import {
  File,
  ClipboardPaste,
  PenTool,
  Clock,
  Sparkles,
  ShieldCheck,
  Check,
  Zap,
} from 'lucide-react';
import {
  Card,
  CardRadioGroup,
  Button,
  Badge,
  Field,
  Input,
  SegmentedControl,
  TypeIcon,
} from '@/components/ui';
import { FolderField } from '@/components/materials/FolderField';
import type { Folder } from '@/lib/schemas/materials';
import type {
  SourceMethod,
  MaterialTargetType,
  ExtractionMode,
} from './types';

interface StepConfigureProps {
  sourceMethod: SourceMethod;
  selectedFile: File | null;
  fileSummary: { name: string; size: number; type: string } | null;
  pastedText: string;
  onRequestChangeSource: () => void;
  targetType: MaterialTargetType;
  onSelectTargetType: (type: MaterialTargetType) => void;
  extractionMode: ExtractionMode;
  onSelectExtractionMode: (mode: ExtractionMode) => void;
  title: string;
  onTitleChange: (title: string) => void;
  folderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  folders: Folder[];
  onCreateFolder: (name: string) => Promise<boolean>;
  creatingFolder: boolean;
  remainingGenerations: number | null;
  sitekey?: string;
  captchaVerified: boolean;
  onOpenCaptchaModal: () => void;
  error?: string | null;
}

const REVIEWER_EXTRACTION_ITEMS = [
  { value: 'full' as const, label: 'Full Notes' },
  { value: 'sentence' as const, label: 'Key Points' },
  { value: 'keywords' as const, label: 'Definitions Only' },
];

export function StepConfigure({
  sourceMethod,
  selectedFile,
  fileSummary,
  pastedText,
  onRequestChangeSource,
  targetType,
  onSelectTargetType,
  extractionMode,
  onSelectExtractionMode,
  title,
  onTitleChange,
  folderId,
  onSelectFolder,
  folders,
  onCreateFolder,
  creatingFolder,
  remainingGenerations,
  sitekey,
  captchaVerified,
  onOpenCaptchaModal,
  error,
}: StepConfigureProps) {
  const currentFile = selectedFile || (fileSummary ? { name: fileSummary.name, size: fileSummary.size } : null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Source Summary Bar */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-default bg-surface p-3.5 shadow-[var(--elev-0)]">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <span className="grid size-9 shrink-0 place-items-center rounded-xs bg-surface-sunken text-ink">
            {sourceMethod === 'file' && <File size={18} aria-hidden="true" />}
            {sourceMethod === 'text' && <ClipboardPaste size={18} aria-hidden="true" />}
            {sourceMethod === 'manual' && <PenTool size={18} aria-hidden="true" />}
          </span>

          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="caption text-muted uppercase tracking-wider shrink-0">Source:</span>
              <p
                className="body-strong text-ink truncate block"
                title={sourceMethod === 'file' ? (currentFile?.name || 'Document') : undefined}
              >
                {sourceMethod === 'file' && (currentFile?.name || 'Document')}
                {sourceMethod === 'text' && `Pasted text (${pastedText.length.toLocaleString()} characters)`}
                {sourceMethod === 'manual' && 'Manual entry'}
              </p>
            </div>
            {sourceMethod === 'file' && currentFile && (
              <p className="caption text-muted">{formatFileSize(currentFile.size)}</p>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRequestChangeSource}
          className="shrink-0"
        >
          Change
        </Button>
      </div>

      {/* 2. Type Selector (Flashcards vs Reviewer) */}
      <div className="flex flex-col gap-2">
        <label className="label text-ink">Study Material Type</label>

        <CardRadioGroup
          label="Study Material Type"
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          {/* Flashcards Option */}
          <Card
            variant="selectable"
            padding="md"
            selected={targetType === 'material'}
            onClick={() => onSelectTargetType('material')}
            className="flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TypeIcon type="Flashcards" size="md" />
                <span className="subtitle text-ink">Flashcards</span>
              </div>
              {targetType === 'material' && <Badge tone="cards">Selected</Badge>}
            </div>
            <p className="caption text-secondary">
              Term and definition pairs optimized for active recall, spaced repetition, and quick practice.
            </p>
          </Card>

          {/* Reviewer Option */}
          <Card
            variant="selectable"
            padding="md"
            selected={targetType === 'reviewer'}
            onClick={() => onSelectTargetType('reviewer')}
            className="flex flex-col gap-2.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TypeIcon type="Reviewer" size="md" />
                <span className="subtitle text-ink">Reviewer</span>
              </div>
              {targetType === 'reviewer' && <Badge tone="reviewer">Selected</Badge>}
            </div>
            <p className="caption text-secondary">
              Structured study guide organized into categorized notes, key points, and detailed examples.
            </p>
          </Card>
        </CardRadioGroup>
      </div>

      {/* 3. Detail Level (Only for Reviewer) */}
      {targetType === 'reviewer' && (
        <div className="flex flex-col gap-2 rounded-lg border border-default bg-surface p-4">
          <div className="flex items-center justify-between">
            <label className="label text-ink">Detail Level</label>
            <span className="caption text-muted">Extraction granularity</span>
          </div>
          <SegmentedControl
            label="Extraction Detail Level"
            items={REVIEWER_EXTRACTION_ITEMS}
            value={extractionMode}
            onValueChange={onSelectExtractionMode}
            className="w-full"
          />
          <p className="caption text-muted">
            {extractionMode === 'full' && 'Extracts comprehensive definitions, subcategories, and examples.'}
            {extractionMode === 'sentence' && 'Summarizes key points into concise explanatory sentences.'}
            {extractionMode === 'keywords' && 'Focuses strictly on essential terms and short definitions.'}
          </p>
        </div>
      )}

      {/* 4. Title Input & Folder Selection */}
      <Card variant="flat" padding="lg" className="border-default bg-surface flex flex-col gap-4">
        <Field
          label="Material title"
          description="Give your study material a descriptive name"
        >
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="e.g. Biology Chapter 4: Photosynthesis & Respiration"
            maxLength={120}
          />
        </Field>

        <FolderField
          folders={folders}
          folderId={folderId}
          onSelectFolder={onSelectFolder}
          onCreateFolder={onCreateFolder}
          creatingFolder={creatingFolder}
        />
      </Card>

      {/* 5. Confidence Cue & AI Usage Banner (if AI source) */}
      {sourceMethod !== 'manual' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-lg border border-brand/20 bg-brand-subtle/60 p-4">
          <div className="flex items-center gap-2.5">
            <Sparkles size={18} className="text-brand shrink-0" aria-hidden="true" />
            <div className="flex flex-col">
              <p className="body-strong text-ink">AI Extraction Engine</p>
              <div className="flex items-center gap-2 caption text-muted">
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} /> ~20-40s processing time
                </span>
                <span>&middot;</span>
                <span>Verbatim accuracy check</span>
              </div>
            </div>
          </div>

          {remainingGenerations !== null && (
            <Badge tone="brand" className="shrink-0">
              <Zap size={11} aria-hidden="true" />
              {remainingGenerations} of 10 daily generations left
            </Badge>
          )}
        </div>
      )}

      {/* 6. Turnstile Captcha verification state */}
      {sitekey && sourceMethod !== 'manual' && !captchaVerified && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-default bg-surface p-3.5">
          <div className="flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-muted shrink-0" aria-hidden="true" />
            <div>
              <p className="body-strong text-ink">Human Verification</p>
              <p className="caption text-muted">Quick anti-bot check before generating</p>
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onOpenCaptchaModal}
          >
            Verify
          </Button>
        </div>
      )}

      {sitekey && sourceMethod !== 'manual' && captchaVerified && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-subtle p-3 text-success-text body-sm">
          <Check size={16} aria-hidden="true" />
          <span>Security verification complete</span>
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

export default StepConfigure;
