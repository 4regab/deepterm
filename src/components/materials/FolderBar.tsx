"use client";

import { useState } from "react";
import { Check, Folder as FolderIcon, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Folder } from "@/lib/schemas/materials";
import {
    MAX_FOLDER_LENGTH,
    UNFILED_FOLDER_ID,
    validateFolderName,
} from "@/utils/materialFolder";
import { useDismiss } from "./useDismiss";

const ALL_FOLDERS_VALUE = "__all__";

interface FolderBarProps {
    folders: Folder[];
    activeFolderId: string | null;
    busy: boolean;
    onChangeFilter: (folderId: string | null) => void;
    onCreate: (name: string) => Promise<boolean>;
    onRename: (id: string, name: string) => Promise<boolean>;
    onRequestDelete: (folder: Folder) => void;
}

export default function FolderBar({
    folders,
    activeFolderId,
    busy,
    onChangeFilter,
    onCreate,
    onRename,
    onRequestDelete,
}: FolderBarProps) {
    const [panelOpen, setPanelOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameDraft, setRenameDraft] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);

    const panelRef = useDismiss<HTMLDivElement>(panelOpen, () => {
        setPanelOpen(false);
        setRenamingId(null);
        setLocalError(null);
    });

    const submitCreate = async () => {
        const check = validateFolderName(draft, folders);
        if (!check.ok) {
            setLocalError(check.message);
            return;
        }
        setLocalError(null);
        if (await onCreate(check.name)) setDraft("");
    };

    const submitRename = async (folder: Folder) => {
        const check = validateFolderName(renameDraft, folders, folder.id);
        if (!check.ok) {
            setLocalError(check.message);
            return;
        }
        setLocalError(null);
        if (check.name === folder.name) {
            setRenamingId(null);
            return;
        }
        if (await onRename(folder.id, check.name)) setRenamingId(null);
    };

    return (
        <div className="flex gap-2" ref={panelRef}>
            <select
                aria-label="Filter by folder"
                value={activeFolderId === null ? ALL_FOLDERS_VALUE : activeFolderId}
                onChange={(event) => {
                    const value = event.target.value;
                    onChangeFilter(value === ALL_FOLDERS_VALUE ? null : value);
                }}
                className="px-3 py-3 rounded-xl border border-border bg-white text-muted-foreground text-sm outline-none focus:border-primary"
            >
                <option value={ALL_FOLDERS_VALUE}>All folders</option>
                {folders.map((folder) => (
                    <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
                <option value={UNFILED_FOLDER_ID}>Unfiled</option>
            </select>

            <div className="relative">
                <button
                    type="button"
                    onClick={() => setPanelOpen((open) => !open)}
                    aria-expanded={panelOpen}
                    className="flex items-center gap-1 px-3 py-3 rounded-xl border border-border bg-white text-muted-foreground text-sm hover:text-foreground"
                >
                    <FolderIcon size={16} />
                    <span className="hidden md:inline">Folders</span>
                </button>

                {panelOpen && (
                    <div className="absolute right-0 top-full mt-1 w-72 rounded-lg border border-border bg-white py-2 shadow-lg z-50">
                        <div className="px-3 pb-2">
                            <form
                                className="flex gap-1"
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    void submitCreate();
                                }}
                            >
                                <input
                                    type="text"
                                    value={draft}
                                    maxLength={MAX_FOLDER_LENGTH}
                                    placeholder="New folder name"
                                    onChange={(event) => setDraft(event.target.value)}
                                    className="flex-1 rounded-md border border-border px-2 py-1.5 text-xs outline-none focus:border-primary"
                                />
                                <button
                                    type="submit"
                                    disabled={busy}
                                    aria-label="Create folder"
                                    className="rounded-md bg-primary px-2 text-white disabled:opacity-50"
                                >
                                    {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                </button>
                            </form>
                        </div>

                        {localError && (
                            <p role="alert" className="mx-3 mb-2 rounded bg-red-50 px-2 py-1 text-[11px] text-red-700">
                                {localError}
                            </p>
                        )}

                        {folders.length === 0 ? (
                            <p className="px-3 py-2 text-xs text-muted-foreground">
                                No folders yet. Create one above, then file materials into it.
                            </p>
                        ) : (
                            <ul className="max-h-64 overflow-y-auto">
                                {folders.map((folder) => (
                                    <li key={folder.id} className="px-3 py-1.5">
                                        {renamingId === folder.id ? (
                                            <form
                                                className="flex gap-1"
                                                onSubmit={(event) => {
                                                    event.preventDefault();
                                                    void submitRename(folder);
                                                }}
                                            >
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={renameDraft}
                                                    maxLength={MAX_FOLDER_LENGTH}
                                                    onChange={(event) => setRenameDraft(event.target.value)}
                                                    className="flex-1 rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-primary"
                                                />
                                                <button type="submit" disabled={busy} aria-label="Save folder name" className="rounded-md bg-primary px-2 text-white disabled:opacity-50">
                                                    <Check size={13} />
                                                </button>
                                                <button type="button" onClick={() => { setRenamingId(null); setLocalError(null); }} aria-label="Cancel rename" className="rounded-md bg-muted px-2 text-foreground">
                                                    <X size={13} />
                                                </button>
                                            </form>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <FolderIcon size={13} className="shrink-0 text-muted-foreground" />
                                                <span className="flex-1 truncate text-xs text-foreground">{folder.name}</span>
                                                <button
                                                    type="button"
                                                    aria-label={`Rename ${folder.name}`}
                                                    onClick={() => {
                                                        setRenamingId(folder.id);
                                                        setRenameDraft(folder.name);
                                                        setLocalError(null);
                                                    }}
                                                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label={`Delete ${folder.name}`}
                                                    onClick={() => {
                                                        setPanelOpen(false);
                                                        onRequestDelete(folder);
                                                    }}
                                                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-red-600"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
