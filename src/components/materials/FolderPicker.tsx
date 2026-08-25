"use client";

import { useState } from "react";
import { Check, Folder as FolderIcon, Loader2, Plus } from "lucide-react";
import type { Folder } from "@/lib/schemas/materials";
import { MAX_FOLDER_LENGTH, validateFolderName } from "@/utils/materialFolder";
import { useDismiss } from "./useDismiss";

interface FolderPickerProps {
    folders: Folder[];
    currentFolderId: string | null;
    busy: boolean;
    /** Resolve true only when the write actually succeeded. */
    onSelect: (folderId: string | null) => Promise<boolean>;
    onCreateAndSelect: (name: string) => Promise<boolean>;
    align?: "left" | "right";
    className?: string;
}

export default function FolderPicker({
    folders,
    currentFolderId,
    busy,
    onSelect,
    onCreateAndSelect,
    align = "left",
    className = "",
}: FolderPickerProps) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);

    const ref = useDismiss<HTMLDivElement>(open, () => {
        setOpen(false);
        setLocalError(null);
    });

    const current = folders.find((folder) => folder.id === currentFolderId) ?? null;

    const choose = async (folderId: string | null) => {
        setLocalError(null);
        if (folderId === currentFolderId) {
            setOpen(false);
            return;
        }
        if (await onSelect(folderId)) setOpen(false);
    };

    const submitCreate = async () => {
        const check = validateFolderName(draft, folders);
        if (!check.ok) {
            setLocalError(check.message);
            return;
        }
        setLocalError(null);
        if (await onCreateAndSelect(check.name)) {
            setDraft("");
            setOpen(false);
        }
    };

    return (
        <div className={`relative ${className}`} ref={ref} onClick={(event) => event.stopPropagation()}>
            <button
                type="button"
                aria-expanded={open}
                aria-label={current ? `Folder: ${current.name}` : "Not in a folder"}
                onClick={(event) => {
                    event.stopPropagation();
                    setOpen((value) => !value);
                }}
                className="inline-flex max-w-full items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
                {busy ? <Loader2 size={12} className="animate-spin" /> : <FolderIcon size={12} />}
                <span className="truncate">{current ? current.name : "Unfiled"}</span>
            </button>

            {open && (
                <div
                    className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-50 mt-1 w-56 rounded-lg border border-border bg-white py-1 shadow-lg`}
                >
                    <button
                        type="button"
                        onClick={() => void choose(null)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-accent"
                    >
                        <span className="w-3.5">{currentFolderId === null && <Check size={13} />}</span>
                        Unfiled
                    </button>

                    {folders.map((folder) => (
                        <button
                            key={folder.id}
                            type="button"
                            onClick={() => void choose(folder.id)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-foreground hover:bg-accent"
                        >
                            <span className="w-3.5">{currentFolderId === folder.id && <Check size={13} />}</span>
                            <span className="truncate">{folder.name}</span>
                        </button>
                    ))}

                    <div className="mt-1 border-t border-border px-3 pt-2 pb-1">
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
                                placeholder="New folder"
                                onChange={(event) => setDraft(event.target.value)}
                                className="min-w-0 flex-1 rounded-md border border-border px-2 py-1 text-xs outline-none focus:border-primary"
                            />
                            <button
                                type="submit"
                                disabled={busy}
                                aria-label="Create folder and move here"
                                className="rounded-md bg-primary px-2 text-white disabled:opacity-50"
                            >
                                <Plus size={13} />
                            </button>
                        </form>
                        {localError && (
                            <p role="alert" className="mt-1 text-[11px] text-red-700">{localError}</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
