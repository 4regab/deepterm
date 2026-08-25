'use client';

import * as React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  Button,
} from '@/components/ui';

interface ConfirmSourceChangeDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSourceChangeDialog({
  open,
  onConfirm,
  onCancel,
}: ConfirmSourceChangeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent size="sm">
        <DialogHeader>
          <div className="flex items-center gap-2 text-warn-text">
            <AlertTriangle size={18} aria-hidden="true" />
            <DialogTitle>Change source material?</DialogTitle>
          </div>
          <DialogDescription>
            You have generated content or unsaved changes in your current draft.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="body-sm text-secondary">
            Changing the source or going back will reset your current generated draft. Are you sure you want to continue?
          </p>
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" size="md" onClick={onCancel}>
            Keep draft
          </Button>
          <Button variant="danger" size="md" onClick={onConfirm}>
            Reset and change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmSourceChangeDialog;
