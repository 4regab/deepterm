'use client';

import * as React from 'react';
import { Folder as FolderIcon, Plus } from 'lucide-react';
import { Field, Select, Input, Button } from '@/components/ui';
import type { Folder } from '@/lib/schemas/materials';
import { MAX_FOLDER_LENGTH, validateFolderName } from '@/utils/materialFolder';

export interface FolderFieldProps {
  folders: Folder[];
  folderId: string | null;
  onSelectFolder: (id: string | null) => void;
  onCreateFolder?: (name: string) => Promise<boolean>;
  creatingFolder?: boolean;
  className?: string;
  error?: string | null;
}

export function FolderField({
  folders,
  folderId,
  onSelectFolder,
  onCreateFolder,
  creatingFolder = false,
  className,
  error,
}: FolderFieldProps) {
  const [showNewFolder, setShowNewFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleCreate = async () => {
    if (!onCreateFolder) return;
    const check = validateFolderName(newFolderName, folders);
    if (!check.ok) {
      setLocalError(check.message);
      return;
    }
    setLocalError(null);
    const success = await onCreateFolder(check.name);
    if (success) {
      setNewFolderName('');
      setShowNewFolder(false);
    }
  };

  return (
    <div className={className}>
      <Field
        label="Folder"
        optional
        description="Organize this material into a folder for easier studying"
        error={error || localError || undefined}
      >
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Select
                aria-label="Select folder"
                value={folderId ?? ''}
                onChange={(e) => onSelectFolder(e.target.value === '' ? null : e.target.value)}
              >
                <option value="">Unfiled (No folder)</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </Select>
            </div>
            {onCreateFolder && !showNewFolder && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowNewFolder(true);
                  setLocalError(null);
                }}
                className="shrink-0"
              >
                <Plus aria-hidden="true" size={15} />
                New folder
              </Button>
            )}
          </div>

          {showNewFolder && (
            <div className="flex items-center gap-2 rounded-md border border-subtle bg-surface-sunken p-2">
              <FolderIcon size={16} className="text-muted shrink-0 ml-1" />
              <Input
                size="sm"
                type="text"
                value={newFolderName}
                maxLength={MAX_FOLDER_LENGTH}
                placeholder="Folder name"
                onChange={(e) => {
                  setNewFolderName(e.target.value);
                  if (localError) setLocalError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void handleCreate();
                  } else if (e.key === 'Escape') {
                    setShowNewFolder(false);
                    setNewFolderName('');
                    setLocalError(null);
                  }
                }}
                className="flex-1"
                autoFocus
              />
              <Button
                type="button"
                variant="primary"
                size="sm"
                loading={creatingFolder}
                disabled={creatingFolder || !newFolderName.trim()}
                onClick={() => void handleCreate()}
              >
                Create
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNewFolder(false);
                  setNewFolderName('');
                  setLocalError(null);
                }}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>
      </Field>
    </div>
  );
}

export default FolderField;
