'use client';

import * as React from 'react';
import {
  UploadCloud,
  File,
  X,
  PlusCircle,
  ClipboardPaste,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import {
  Card,
  Button,
  IconButton,
  Badge,
  Textarea,
} from '@/components/ui';
import {
  ACCEPTED_FILE_TYPES_ATTR,
} from './useCreateDraft';
import type { SourceMethod } from './types';

interface StepSourceProps {
  sourceMethod: SourceMethod;
  onSelectMethod: (method: SourceMethod) => void;
  selectedFile: File | null;
  fileSummary: { name: string; size: number; type: string } | null;
  onFileSelect: (file: File) => boolean;
  onRemoveFile: () => void;
  pastedText: string;
  onPastedTextChange: (text: string) => void;
  onOpenBulkHelp?: () => void;
  error?: string | null;
}

export function StepSource({
  sourceMethod,
  onSelectMethod,
  selectedFile,
  fileSummary,
  onFileSelect,
  onRemoveFile,
  pastedText,
  onPastedTextChange,
  onOpenBulkHelp,
  error,
}: StepSourceProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file) {
        onFileSelect(file);
      }
    }
  };

  // Clipboard paste listener for file attachments
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      const file = e.clipboardData.files[0];
      if (file) {
        const handled = onFileSelect(file);
        if (handled) {
          e.preventDefault();
        }
      }
    }
  };

  const currentFile = selectedFile || (fileSummary ? { name: fileSummary.name, size: fileSummary.size } : null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(0)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileExtension = (name: string) => {
    return name.split('.').pop()?.toUpperCase() || 'DOC';
  };

  return (
    <div className="flex flex-col gap-6" onPaste={handlePaste}>
      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES_ATTR}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onFileSelect(file);
          }
          // Reset input so re-selecting same file triggers onChange
          e.target.value = '';
        }}
      />

      {/* Primary Area: Dropzone / File Summary */}
      <section aria-labelledby="source-dropzone-heading">
        <h2 id="source-dropzone-heading" className="sr-only">
          Upload document
        </h2>

        {!currentFile ? (
          <div
            role="button"
            tabIndex={0}
            onClick={() => {
              onSelectMethod('file');
              fileInputRef.current?.click();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectMethod('file');
                fileInputRef.current?.click();
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`group relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-brand bg-brand-subtle'
                : 'border-default bg-surface hover:border-input hover:bg-surface-hover'
            }`}
          >
            <div className="grid size-12 place-items-center rounded-full bg-surface-sunken text-muted transition-transform group-hover:scale-105 group-hover:text-brand">
              <UploadCloud size={24} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-1">
              <p className="subtitle text-ink">
                Drag and drop your document here, or <span className="text-brand underline underline-offset-4">browse</span>
              </p>
              <p className="caption text-muted">
                PDF, DOCX, PNG, JPG, or WebP &middot; Up to 4MB &middot; Or paste file from clipboard
              </p>
            </div>
          </div>
        ) : (
          <Card variant="flat" padding="md" className="border-brand/40 bg-surface">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid size-10 shrink-0 place-items-center rounded-sm bg-brand-subtle text-brand">
                  <File size={20} aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="body-strong text-ink truncate">{currentFile.name}</p>
                    <Badge tone="brand" className="shrink-0">
                      {getFileExtension(currentFile.name)}
                    </Badge>
                  </div>
                  <p className="caption text-muted">{formatFileSize(currentFile.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change
                </Button>
                <IconButton
                  aria-label="Remove document"
                  variant="ghost"
                  size="md"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFile();
                  }}
                >
                  <X size={16} aria-hidden="true" />
                </IconButton>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* Or divider */}
      <div className="relative flex items-center justify-center my-1">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-subtle" />
        </div>
        <span className="relative bg-canvas px-3 caption text-muted">or choose another method</span>
      </div>

      {/* Secondary options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="radiogroup" aria-label="Alternative creation methods">
        {/* Paste Text Option */}
        <Card
          variant="selectable"
          padding="md"
          selected={sourceMethod === 'text' && !currentFile}
          onClick={() => {
            onRemoveFile();
            onSelectMethod('text');
          }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xs bg-surface-sunken text-ink">
                <ClipboardPaste size={16} aria-hidden="true" />
              </span>
              <span className="subtitle text-ink">Paste text</span>
            </div>
            {sourceMethod === 'text' && !currentFile && (
              <Badge tone="brand">Active</Badge>
            )}
          </div>
          <p className="caption text-muted">
            Paste existing notes, vocabulary lists, syllabus outlines, or raw text.
          </p>
        </Card>

        {/* Build Manually Option */}
        <Card
          variant="selectable"
          padding="md"
          selected={sourceMethod === 'manual' && !currentFile}
          onClick={() => {
            onRemoveFile();
            onSelectMethod('manual');
          }}
          className="flex flex-col gap-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-xs bg-surface-sunken text-ink">
                <PlusCircle size={16} aria-hidden="true" />
              </span>
              <span className="subtitle text-ink">Build manually</span>
            </div>
            {sourceMethod === 'manual' && !currentFile && (
              <Badge tone="brand">Active</Badge>
            )}
          </div>
          <p className="caption text-muted">
            Write flashcards or terms by hand using our streamlined editor.
          </p>
        </Card>
      </div>

      {/* Expanding Textarea if Paste Text is active */}
      {sourceMethod === 'text' && !currentFile && (
        <Card variant="flat" padding="md" className="border-default bg-surface">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label htmlFor="pasted-notes-input" className="label text-ink">
                Your notes or study text
              </label>
              {onOpenBulkHelp && (
                <button
                  type="button"
                  onClick={onOpenBulkHelp}
                  className="caption inline-flex items-center gap-1 text-brand hover:underline"
                >
                  <HelpCircle size={13} aria-hidden="true" />
                  Format guidelines
                </button>
              )}
            </div>

            <Textarea
              id="pasted-notes-input"
              value={pastedText}
              onChange={(e) => onPastedTextChange(e.target.value)}
              placeholder="Paste article, lecture transcript, term list, or study notes here..."
              maxLength={100000}
              rows={8}
              showCount
              className="resize-y"
            />
          </div>
        </Card>
      )}

      {/* Manual info card */}
      {sourceMethod === 'manual' && !currentFile && (
        <div className="rounded-md border border-subtle bg-surface-sunken p-4">
          <div className="flex items-start gap-3">
            <FileSpreadsheet size={18} className="text-muted shrink-0 mt-0.5" aria-hidden="true" />
            <div className="flex flex-col gap-1">
              <p className="body-strong text-ink">Manual Creation Mode</p>
              <p className="body-sm text-secondary">
                You will configure the title and type in Step 2, then build and refine your cards or study guide terms in Step 3.
              </p>
            </div>
          </div>
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

export default StepSource;
