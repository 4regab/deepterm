'use client';

import * as React from 'react';
import { Sparkles, X, FileText, Layers, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui';
import type { MaterialTargetType } from './types';

interface GeneratingStateProps {
  targetType: MaterialTargetType;
  statusIndex: number;
  onCancel: () => void;
  materialName?: string;
}

const STATUS_STEPS = [
  'Extracting & parsing text...',
  'Identifying key definitions and concepts...',
  'Structuring cards & formatting output...',
];

export function GeneratingState({
  targetType,
  statusIndex,
  onCancel,
  materialName,
}: GeneratingStateProps) {
  const currentStatus = STATUS_STEPS[statusIndex % STATUS_STEPS.length];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="relative mb-6">
        {/* Outer pulsing ring */}
        <div className="absolute inset-0 animate-ping rounded-full bg-brand/20 duration-1000" />
        
        {/* Glow center */}
        <div className="relative grid size-20 place-items-center rounded-full bg-brand-subtle text-brand shadow-[var(--elev-1)]">
          <Sparkles size={36} className="animate-pulse text-brand" aria-hidden="true" />
        </div>
      </div>

      <h2 className="title-lg text-ink mb-2">Reading your material...</h2>
      
      {materialName ? (
        <p className="body-sm text-muted mb-6 max-w-md truncate">
          Generating {targetType === 'material' ? 'flashcards' : 'reviewer'} from{' '}
          <span className="font-medium text-ink">{materialName}</span>
        </p>
      ) : (
        <p className="body-sm text-muted mb-6">
          Analyzing concepts and creating high-yield study content
        </p>
      )}

      {/* Indeterminate Animated Progress Track */}
      <div className="w-full max-w-md mb-4">
        <div
          role="progressbar"
          aria-label="Generating study material"
          className="relative h-2 w-full overflow-hidden rounded-full bg-surface-sunken"
        >
          <div className="absolute inset-y-0 h-full w-1/3 rounded-full bg-brand animate-[indeterminate_1.5s_infinite_ease-in-out]" />
        </div>
      </div>

      {/* Rotating live status step */}
      <div className="flex items-center gap-2 mb-8 min-h-6">
        {statusIndex === 0 && <FileText size={14} className="text-muted shrink-0" />}
        {statusIndex === 1 && <BookOpen size={14} className="text-muted shrink-0" />}
        {statusIndex === 2 && <Layers size={14} className="text-muted shrink-0" />}
        <p className="caption text-secondary animate-fade-in font-medium">
          {currentStatus}
        </p>
      </div>

      {/* Working Cancel button */}
      <Button
        type="button"
        variant="secondary"
        size="md"
        onClick={onCancel}
        className="gap-1.5"
      >
        <X size={15} aria-hidden="true" />
        Cancel generation
      </Button>
    </div>
  );
}

export default GeneratingState;
