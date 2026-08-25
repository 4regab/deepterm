'use client';

import * as React from 'react';
import { FileText, Info } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Button,
  Textarea,
} from '@/components/ui';
import { parseTextToCards } from './parseBulkText';
import type { FlashcardDraftItem } from './types';

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (cards: FlashcardDraftItem[]) => void;
}

export function BulkImportDialog({ open, onClose, onImport }: BulkImportDialogProps) {
  const [text, setText] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleImport = () => {
    if (!text.trim()) {
      setError('Please paste or type text first.');
      return;
    }
    const parsed = parseTextToCards(text);
    if (parsed.length === 0) {
      setError(
        'No valid term-definition pairs found. Try formats like "term - definition" or "term : definition".'
      );
      return;
    }
    onImport(parsed);
    setText('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent size="md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText size={18} className="text-brand" aria-hidden="true" />
            <DialogTitle>Bulk Add Cards</DialogTitle>
          </div>
          <DialogDescription>
            Paste term-and-definition pairs from spreadsheets, documents, or Quizlet exports.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <div className="rounded-md border border-subtle bg-surface-sunken p-3 text-xs text-secondary">
            <div className="flex items-center gap-1.5 font-medium text-ink mb-1">
              <Info size={14} className="text-muted" />
              <span>Supported separators:</span>
            </div>
            <p className="body-sm text-muted">
              <code className="rounded bg-surface px-1 py-0.5 border border-default">term - definition</code>,{' '}
              <code className="rounded bg-surface px-1 py-0.5 border border-default">term : definition</code>,{' '}
              <code className="rounded bg-surface px-1 py-0.5 border border-default">term ; definition</code>, or{' '}
              <code className="rounded bg-surface px-1 py-0.5 border border-default">term [tab] definition</code>
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="bulk-import-textarea" className="label text-ink">
              Pasted content
            </label>
            <Textarea
              id="bulk-import-textarea"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (error) setError(null);
              }}
              placeholder={`Mitochondria - Powerhouse of the cell\nRibosome - Site of protein synthesis\nChloroplast - Organelle where photosynthesis occurs`}
              rows={8}
              showCount={false}
              className="font-mono text-xs"
            />
          </div>

          {error && (
            <p className="body-sm text-danger-text" role="alert">
              {error}
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!text.trim()}
            onClick={handleImport}
          >
            Import Cards
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default BulkImportDialog;
