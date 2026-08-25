"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Search,
    Plus,
    Folder as FolderIcon,
    Share2,
    Trash2,
    Pencil,
    X,
    Check,
    Copy,
    Volume2,
    Download,
    Sparkles,
    BrainCircuit,
    Zap,
    Layers,
    BookOpen,
    Target,
    ChevronDown,
    ChevronUp,
    MoreVertical,
    FolderInput,
} from "lucide-react";
import {
    PageHeader,
    Card,
    Button,
    IconButton,
    Input,
    Textarea,
    Badge,
    Chip,
    CountBadge,
    SegmentedProgress,
    ProgressBar,
    ProgressRing,
    Tabs,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    Field,
    TypeIcon,
    EmptyState,
    Toast,
} from "@/components/ui";
import ShareModal from "@/components/ShareModal";
import { createClient } from "@/config/supabase/client";
import { exportToPDF, exportToDOCX } from "@/utils/exportReviewer";
import { buildReviewerTermInsert } from "@/utils/reviewerTerms";
import type { Folder as FolderModel } from "@/lib/schemas/materials";
import {
    createFolder as createFolderRow,
    deleteMaterial as deleteMaterialRow,
    setMaterialFolder,
    type SupabaseLike,
} from "@/lib/folders/api";
import { runOptimistic } from "@/lib/folders/optimistic";
import { formatTimeAgo } from "@/lib/materials/queries";
import { MAX_FOLDER_LENGTH, validateFolderName } from "@/utils/materialFolder";

export type LearnStage = "new" | "learning" | "review" | "mastered";

export interface Term {
    id: string;
    front: string;
    back: string;
    stage: LearnStage;
}

export interface ReviewerTerm {
    id: string;
    term: string;
    definition: string;
}

export interface ReviewerCategory {
    id: string;
    name: string;
    color: string;
    terms: ReviewerTerm[];
}

export interface MaterialData {
    id: string;
    title: string;
    updated_at: string;
    folderId: string | null;
    folderName: string | null;
}

type FlashcardProps = {
    materialType: "flashcard";
    material: MaterialData;
    initialTerms: Term[];
    folders: FolderModel[];
    initialCategories?: never;
};

type ReviewerProps = {
    materialType: "reviewer";
    material: MaterialData;
    initialCategories: ReviewerCategory[];
    folders: FolderModel[];
    initialTerms?: never;
};

type Props = FlashcardProps | ReviewerProps;

type TabKey = "terms" | "stats" | "settings";
type StatusFilterKey = "all" | "mastered" | "learning" | "new";
type SortKey = "original" | "alphabetical" | "status";

export default function MaterialDetailClient(props: Props) {
    const { materialType, material, folders } = props;
    const router = useRouter();

    // Content State
    const [title, setTitle] = useState(material.title);
    const [terms, setTerms] = useState<Term[]>(props.materialType === "flashcard" ? props.initialTerms : []);
    const [categories, setCategories] = useState<ReviewerCategory[]>(
        props.materialType === "reviewer" ? props.initialCategories : []
    );
    const [expandedCategories, setExpandedCategories] = useState<string[]>(
        props.materialType === "reviewer" ? props.initialCategories.map((c) => c.id) : []
    );

    // Folder State
    const [folderId, setFolderId] = useState<string | null>(material.folderId);
    const [folderList, setFolderList] = useState<FolderModel[]>(folders);
    const [isMoveFolderOpen, setIsMoveFolderOpen] = useState(false);
    const [isNewFolderDialogOpen, setIsNewFolderDialogOpen] = useState(false);
    const [newFolderDraft, setNewFolderDraft] = useState("");
    const [folderError, setFolderError] = useState<string | null>(null);
    const [folderBusy, setFolderBusy] = useState(false);

    // Navigation & Tabs
    const [activeTab, setActiveTab] = useState<TabKey>("terms");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilterKey>("all");
    const [sortOption, setSortOption] = useState<SortKey>("original");

    // Editing State (Flashcards)
    const [isAddingNewTerm, setIsAddingNewTerm] = useState(false);
    const [newTermData, setNewTermData] = useState({ front: "", back: "" });
    const [editingTermId, setEditingTermId] = useState<string | null>(null);
    const [editTermData, setEditTermData] = useState({ front: "", back: "" });

    // Editing State (Reviewer Categories & Terms)
    const [addingToCategoryId, setAddingToCategoryId] = useState<string | null>(null);
    const [newReviewerTerm, setNewReviewerTerm] = useState({ term: "", definition: "" });
    const [editingReviewerTermId, setEditingReviewerTermId] = useState<string | null>(null);
    const [editReviewerTermData, setEditReviewerTermData] = useState({ term: "", definition: "" });
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Settings Tab State
    const [titleDraft, setTitleDraft] = useState(material.title);
    const [isSavingTitle, setIsSavingTitle] = useState(false);

    // Dialogs & Modals
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
    const [copiedTermId, setCopiedTermId] = useState<string | null>(null);
    const [playingTermId, setPlayingTermId] = useState<string | null>(null);
    const [exportingDoc, setExportingDoc] = useState<"pdf" | "docx" | null>(null);

    // Sync flashcard status changes on mount / focus
    useEffect(() => {
        if (materialType !== "flashcard") return;
        let mounted = true;
        const refresh = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("flashcards")
                .select("id, front, back, status")
                .eq("set_id", material.id)
                .order("created_at");

            if (data && mounted) {
                setTerms(
                    data.map((card) => ({
                        id: card.id,
                        front: card.front,
                        back: card.back,
                        stage: (card.status || "new") as LearnStage,
                    }))
                );
            }
        };
        void refresh();
        return () => {
            mounted = false;
        };
    }, [material.id, materialType]);

    // Computed Stats
    const totalTerms = materialType === "flashcard" ? terms.length : categories.reduce((sum, c) => sum + c.terms.length, 0);
    const masteredCount = terms.filter((t) => t.stage === "mastered").length;
    const learningCount = terms.filter((t) => t.stage === "learning" || t.stage === "review").length;
    const newCount = terms.filter((t) => t.stage === "new").length;
    const studyCounts = { mastered: masteredCount, learning: learningCount, new: newCount };
    const masteryPercentage = totalTerms > 0 ? Math.round((masteredCount / totalTerms) * 100) : 0;

    // Study Mode Recommendations
    const isBrandNew = totalTerms > 0 && masteredCount === 0 && learningCount === 0;
    const hasDueCards = learningCount > 0 || (newCount > 0 && masteredCount > 0);

    const activeFolder = folderList.find((f) => f.id === folderId);

    // Audio text to speech
    const handleSpeak = (text: string, termId: string) => {
        if (typeof window === "undefined" || !("speechSynthesis" in window)) {
            setToastMessage({ kind: "error", text: "Text-to-speech is not supported in this browser." });
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "en-US";
        utterance.rate = 0.95;
        utterance.onend = () => setPlayingTermId(null);
        utterance.onerror = () => setPlayingTermId(null);
        setPlayingTermId(termId);
        window.speechSynthesis.speak(utterance);
    };

    // Copy to clipboard
    const handleCopy = async (text: string, termId: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedTermId(termId);
            setToastMessage({ kind: "success", text: "Copied to clipboard." });
            setTimeout(() => setCopiedTermId(null), 1800);
        } catch {
            setToastMessage({ kind: "error", text: "Failed to copy." });
        }
    };

    // Flashcard term actions
    const handleAddFlashcard = async () => {
        if (!newTermData.front.trim() || !newTermData.back.trim()) return;
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
            setToastMessage({ kind: "error", text: "Please sign in to add cards." });
            return;
        }

        const { data, error } = await supabase
            .from("flashcards")
            .insert({
                set_id: material.id,
                user_id: user.id,
                front: newTermData.front.trim(),
                back: newTermData.back.trim(),
                status: "new",
            })
            .select()
            .single();

        if (error || !data) {
            setToastMessage({ kind: "error", text: "Could not add card." });
            return;
        }

        setTerms((prev) => [...prev, { id: data.id, front: data.front, back: data.back, stage: "new" }]);
        setNewTermData({ front: "", back: "" });
        setIsAddingNewTerm(false);
        setToastMessage({ kind: "success", text: "Card added." });
    };

    const handleSaveEditFlashcard = async (termId: string) => {
        if (!editTermData.front.trim() || !editTermData.back.trim()) return;
        const supabase = createClient();
        const { error } = await supabase
            .from("flashcards")
            .update({
                front: editTermData.front.trim(),
                back: editTermData.back.trim(),
            })
            .eq("id", termId);

        if (error) {
            setToastMessage({ kind: "error", text: "Could not update card." });
            return;
        }

        setTerms((prev) =>
            prev.map((t) => (t.id === termId ? { ...t, front: editTermData.front.trim(), back: editTermData.back.trim() } : t))
        );
        setEditingTermId(null);
        setEditTermData({ front: "", back: "" });
        setToastMessage({ kind: "success", text: "Card updated." });
    };

    const handleDeleteFlashcard = async (termId: string) => {
        const supabase = createClient();
        const { error } = await supabase.from("flashcards").delete().eq("id", termId);
        if (error) {
            setToastMessage({ kind: "error", text: "Could not delete card." });
            return;
        }
        setTerms((prev) => prev.filter((t) => t.id !== termId));
        setToastMessage({ kind: "success", text: "Card deleted." });
    };

    // Reviewer term & category actions
    const handleAddReviewerTerm = async (categoryId: string) => {
        if (!newReviewerTerm.term.trim() || !newReviewerTerm.definition.trim()) return;
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
            .from("reviewer_terms")
            .insert(buildReviewerTermInsert(user.id, categoryId, newReviewerTerm.term.trim(), newReviewerTerm.definition.trim()))
            .select()
            .single();

        if (error || !data) {
            setToastMessage({ kind: "error", text: "Could not add term." });
            return;
        }

        setCategories((prev) =>
            prev.map((c) =>
                c.id === categoryId
                    ? { ...c, terms: [...c.terms, { id: data.id, term: data.term, definition: data.definition }] }
                    : c
            )
        );
        setNewReviewerTerm({ term: "", definition: "" });
        setAddingToCategoryId(null);
        setToastMessage({ kind: "success", text: "Term added." });
    };

    const handleSaveEditReviewerTerm = async (categoryId: string, termId: string) => {
        if (!editReviewerTermData.term.trim() || !editReviewerTermData.definition.trim()) return;
        const supabase = createClient();
        const { error } = await supabase
            .from("reviewer_terms")
            .update({
                term: editReviewerTermData.term.trim(),
                definition: editReviewerTermData.definition.trim(),
            })
            .eq("id", termId);

        if (error) {
            setToastMessage({ kind: "error", text: "Could not update term." });
            return;
        }

        setCategories((prev) =>
            prev.map((c) =>
                c.id === categoryId
                    ? {
                          ...c,
                          terms: c.terms.map((t) =>
                              t.id === termId
                                  ? { ...t, term: editReviewerTermData.term.trim(), definition: editReviewerTermData.definition.trim() }
                                  : t
                          ),
                      }
                    : c
            )
        );
        setEditingReviewerTermId(null);
        setEditReviewerTermData({ term: "", definition: "" });
        setToastMessage({ kind: "success", text: "Term updated." });
    };

    const handleDeleteReviewerTerm = async (categoryId: string, termId: string) => {
        const supabase = createClient();
        const { error } = await supabase.from("reviewer_terms").delete().eq("id", termId);
        if (error) {
            setToastMessage({ kind: "error", text: "Could not delete term." });
            return;
        }
        setCategories((prev) =>
            prev.map((c) => (c.id === categoryId ? { ...c, terms: c.terms.filter((t) => t.id !== termId) } : c))
        );
        setToastMessage({ kind: "success", text: "Term deleted." });
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) return;
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        const defaultColors = ["#0284c7", "#0d9488", "#7c3aed", "#b45309", "#e11d48"];
        const color = defaultColors[categories.length % defaultColors.length];

        const { data, error } = await supabase
            .from("reviewer_categories")
            .insert({
                reviewer_id: material.id,
                user_id: user.id,
                name: newCategoryName.trim(),
                color,
            })
            .select()
            .single();

        if (error || !data) {
            setToastMessage({ kind: "error", text: "Could not create category." });
            return;
        }

        setCategories((prev) => [...prev, { id: data.id, name: data.name, color: data.color || color, terms: [] }]);
        setExpandedCategories((prev) => [...prev, data.id]);
        setNewCategoryName("");
        setIsAddingCategory(false);
        setToastMessage({ kind: "success", text: `Category "${data.name}" added.` });
    };

    const handleDeleteCategory = async (categoryId: string) => {
        const supabase = createClient();
        const { error } = await supabase.from("reviewer_categories").delete().eq("id", categoryId);
        if (error) {
            setToastMessage({ kind: "error", text: "Could not delete category." });
            return;
        }
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
        setExpandedCategories((prev) => prev.filter((id) => id !== categoryId));
        setToastMessage({ kind: "success", text: "Category deleted." });
    };

    // Save Title in Settings
    const handleSaveTitle = async () => {
        if (!titleDraft.trim() || titleDraft.trim() === title) return;
        setIsSavingTitle(true);
        const supabase = createClient();
        const table = materialType === "flashcard" ? "flashcard_sets" : "reviewers";
        const { error } = await supabase.from(table).update({ title: titleDraft.trim() }).eq("id", material.id);
        setIsSavingTitle(false);
        if (error) {
            setToastMessage({ kind: "error", text: "Could not update title." });
            return;
        }
        setTitle(titleDraft.trim());
        setToastMessage({ kind: "success", text: "Title updated successfully." });
    };

    // Folder Assignment Actions
    const handleMoveToFolder = async (targetFolderId: string | null) => {
        const previous = folderId;
        setFolderBusy(true);
        const ok = await runOptimistic({
            apply: () => setFolderId(targetFolderId),
            rollback: () => setFolderId(previous),
            write: () =>
                setMaterialFolder(createClient() as unknown as SupabaseLike, {
                    materialId: material.id,
                    materialType: materialType === "flashcard" ? "Flashcards" : "Reviewer",
                    folderId: targetFolderId,
                }),
            onError: (err) => setToastMessage({ kind: "error", text: err }),
            fallbackMessage: "Could not move this material.",
        });
        setFolderBusy(false);
        if (ok) {
            setIsMoveFolderOpen(false);
            setToastMessage({ kind: "success", text: "Material moved." });
        }
    };

    const handleCreateFolderAndMove = async () => {
        const check = validateFolderName(newFolderDraft, folderList);
        if (!check.ok) {
            setFolderError(check.message);
            return;
        }
        const supabase = createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        setFolderBusy(true);
        setFolderError(null);
        const { data, error } = await createFolderRow(supabase as unknown as SupabaseLike, {
            userId: user.id,
            name: check.name,
        });
        setFolderBusy(false);
        if (error || !data) {
            setFolderError(error ?? "Could not create folder.");
            return;
        }
        setFolderList((prev) => [...prev, data]);
        setNewFolderDraft("");
        setIsNewFolderDialogOpen(false);
        await handleMoveToFolder(data.id);
    };

    // Delete Entire Set
    const handleDeleteMaterial = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        const { error } = await deleteMaterialRow(createClient() as unknown as SupabaseLike, {
            materialId: material.id,
            materialType: materialType === "flashcard" ? "Flashcards" : "Reviewer",
        });
        setIsDeleting(false);
        if (error) {
            setDeleteError(error);
            return;
        }
        router.push("/materials");
    };

    // Export Reviewer
    const handleExport = async (format: "pdf" | "docx") => {
        setExportingDoc(format);
        try {
            const exportCategories = categories.map((c) => ({
                name: c.name,
                terms: c.terms.map((t) => ({ front: t.term, back: t.definition })),
            }));
            if (format === "pdf") {
                await exportToPDF({ title, terms: [], categories: exportCategories });
            } else {
                await exportToDOCX({ title, terms: [], categories: exportCategories });
            }
            setToastMessage({ kind: "success", text: `Exported ${title} as ${format.toUpperCase()}.` });
        } catch {
            setToastMessage({ kind: "error", text: "Failed to export document." });
        } finally {
            setExportingDoc(null);
        }
    };

    // Filter & Sort Terms
    const filteredTerms = terms
        .filter((t) => {
            const query = searchQuery.toLowerCase().trim();
            const matchesQuery = !query || t.front.toLowerCase().includes(query) || t.back.toLowerCase().includes(query);
            if (!matchesQuery) return false;
            if (statusFilter === "all") return true;
            if (statusFilter === "mastered") return t.stage === "mastered";
            if (statusFilter === "learning") return t.stage === "learning" || t.stage === "review";
            if (statusFilter === "new") return t.stage === "new";
            return true;
        })
        .sort((a, b) => {
            if (sortOption === "alphabetical") {
                return a.front.localeCompare(b.front, undefined, { sensitivity: "base" });
            }
            if (sortOption === "status") {
                const order: Record<LearnStage, number> = { mastered: 0, review: 1, learning: 2, new: 3 };
                return order[a.stage] - order[b.stage];
            }
            return 0; // original order
        });

    const filteredReviewerCategories = categories
        .map((cat) => ({
            ...cat,
            terms: cat.terms.filter(
                (t) =>
                    !searchQuery ||
                    t.term.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
                    t.definition.toLowerCase().includes(searchQuery.toLowerCase().trim())
            ),
        }))
        .filter((cat) => cat.terms.length > 0 || !searchQuery);

    const getStatusDotColor = (stage: LearnStage) => {
        if (stage === "mastered") return "bg-success";
        if (stage === "learning" || stage === "review") return "bg-warn";
        return "bg-disabled";
    };

    const getStatusLabel = (stage: LearnStage) => {
        if (stage === "mastered") return "Mastered";
        if (stage === "learning" || stage === "review") return "Learning";
        return "New";
    };

    return (
        <div className="w-full space-y-6 pb-20">
            {toastMessage && (
                <div className="fixed bottom-6 right-6 z-50">
                    <Toast kind={toastMessage.kind} className="animate-in fade-in slide-in-from-bottom-3 duration-200">
                        {toastMessage.text}
                        <button
                            type="button"
                            onClick={() => setToastMessage(null)}
                            className="ml-2 text-muted hover:text-ink"
                            aria-label="Dismiss message"
                        >
                            <X size={13} />
                        </button>
                    </Toast>
                </div>
            )}

            {/* Breadcrumb Navigation */}
            <PageHeader
                title=""
                className="mb-0"
                breadcrumb={[
                    { label: "Materials", href: "/materials" },
                    {
                        label: activeFolder?.name ?? "Unfiled",
                        href: activeFolder ? `/materials` : `/materials`,
                    },
                    { label: title },
                ]}
            />

            {/* 1. Hero Header Card */}
            <Card
                variant="flat"
                padding="xl"
                className={`relative overflow-hidden ${
                    materialType === "flashcard"
                        ? "border-t-[4px] border-t-[var(--type-cards)]"
                        : "border-t-[4px] border-t-[var(--type-reviewer)]"
                }`}
            >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                    {/* Left: Icon, Badge, Title, Meta */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                        <TypeIcon
                            type={materialType === "flashcard" ? "Flashcards" : "Reviewer"}
                            size="lg"
                            className="shrink-0 mt-1"
                        />
                        <div className="min-w-0 flex-1 space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge solid tone={materialType === "flashcard" ? "cards" : "reviewer"}>
                                    {materialType === "flashcard" ? "Flashcard Set" : "Study Reviewer"}
                                </Badge>
                                <button
                                    type="button"
                                    onClick={() => setIsMoveFolderOpen(true)}
                                    className="inline-flex items-center gap-1 rounded-xs bg-surface-sunken px-2 py-0.5 text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                                    title="Change folder"
                                >
                                    <FolderIcon size={12} />
                                    <span>{activeFolder?.name ?? "Unfiled"}</span>
                                </button>
                                <span className="body-sm text-muted">
                                    Updated {formatTimeAgo(new Date(material.updated_at))}
                                </span>
                            </div>

                            <h1
                                className="text-lg sm:text-2xl lg:text-[26px] leading-snug text-ink tracking-tight font-semibold break-words line-clamp-3 max-w-4xl"
                                title={title}
                            >
                                {title}
                            </h1>
                        </div>
                    </div>

                    {/* Right Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowShareModal(true)}
                            className="gap-1.5"
                        >
                            <Share2 size={14} />
                            <span>Share</span>
                        </Button>

                        {materialType === "reviewer" && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="sm" className="gap-1.5">
                                        <Download size={14} />
                                        <span>Export</span>
                                        <ChevronDown size={13} className="text-muted" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-44">
                                    <DropdownMenuItem
                                        disabled={exportingDoc !== null}
                                        onClick={() => void handleExport("pdf")}
                                    >
                                        <Download size={14} />
                                        Download PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        disabled={exportingDoc !== null}
                                        onClick={() => void handleExport("docx")}
                                    >
                                        <Download size={14} />
                                        Download DOCX
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <IconButton aria-label="More material actions" variant="secondary" size="sm">
                                    <MoreVertical size={15} />
                                </IconButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => setActiveTab("settings")}>
                                    <Pencil size={14} />
                                    Edit details
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setIsMoveFolderOpen(true)}>
                                    <FolderInput size={14} />
                                    Move to folder
                                </DropdownMenuItem>
                                {materialType === "reviewer" && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => void handleExport("pdf")}>
                                            <Download size={14} />
                                            Export PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => void handleExport("docx")}>
                                            <Download size={14} />
                                            Export DOCX
                                        </DropdownMenuItem>
                                    </>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    tone="danger"
                                    onClick={() => {
                                        setDeleteError(null);
                                        setShowDeleteConfirm(true);
                                    }}
                                >
                                    <Trash2 size={14} />
                                    Delete set
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                {/* Prominent Mastery Bar (Flashcards) or Summary (Reviewer) */}
                {materialType === "flashcard" ? (
                    <div className="mt-6 pt-5 border-t border-subtle space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center gap-1.5 font-medium text-success">
                                    <span className="size-2 rounded-full bg-success" />
                                    {masteredCount} mastered
                                </span>
                                <span className="flex items-center gap-1.5 font-medium text-warn">
                                    <span className="size-2 rounded-full bg-warn" />
                                    {learningCount} learning
                                </span>
                                <span className="flex items-center gap-1.5 text-muted">
                                    <span className="size-2 rounded-full bg-disabled" />
                                    {newCount} new
                                </span>
                            </div>
                            <span className="font-semibold text-ink tabular">{masterageText(masteryPercentage)}</span>
                        </div>
                        <SegmentedProgress counts={studyCounts} className="h-2 rounded-full" />
                    </div>
                ) : (
                    <div className="mt-6 pt-4 border-t border-subtle flex items-center justify-between text-xs text-muted">
                        <div className="flex items-center gap-3">
                            <span>{categories.length} categories</span>
                            <span>·</span>
                            <span>{totalTerms} key terms</span>
                        </div>
                        <span>Self-guided study reference</span>
                    </div>
                )}
            </Card>

            {/* 2. Mode Row (Above the fold Study Hub!) */}
            <div>
                <div className="flex items-center justify-between mb-3">
                    <h2 className="subtitle text-ink">Study Modes</h2>
                    {isBrandNew && (
                        <span className="caption text-brand font-medium">New material — start with Flashcards!</span>
                    )}
                    {hasDueCards && (
                        <span className="caption text-warn font-medium">{learningCount || newCount} cards due for recall</span>
                    )}
                </div>

                {materialType === "flashcard" ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {/* 1. Flashcards */}
                        <Link
                            href={`/materials/${material.id}/flashcards`}
                            className={`group block rounded-lg border border-default bg-surface p-4 shadow-[var(--elev-0)] transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-input hover:shadow-[var(--elev-1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[var(--focus)] ${
                                isBrandNew ? "ring-2 ring-brand ring-offset-2" : ""
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="grid size-10 place-items-center rounded-sm bg-cards-subtle text-cards-text group-hover:scale-105 transition-transform">
                                    <Layers size={20} />
                                </div>
                                {isBrandNew && <Badge solid tone="brand">Start here</Badge>}
                            </div>
                            <h3 className="subtitle text-ink group-hover:text-brand transition-colors">Flashcards</h3>
                            <p className="body-sm text-muted mt-0.5">Flip through {terms.length} cards</p>
                        </Link>

                        {/* 2. Learn */}
                        <Link
                            href={`/materials/${material.id}/learn`}
                            className={`group block rounded-lg border border-default bg-surface p-4 shadow-[var(--elev-0)] transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-input hover:shadow-[var(--elev-1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[var(--focus)] ${
                                hasDueCards ? "ring-2 ring-brand ring-offset-2" : ""
                            }`}
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="grid size-10 place-items-center rounded-sm bg-brand-subtle text-brand-text group-hover:scale-105 transition-transform">
                                    <BrainCircuit size={20} />
                                </div>
                                {hasDueCards && <Badge tone="warn">{learningCount || newCount} due</Badge>}
                            </div>
                            <h3 className="subtitle text-ink group-hover:text-brand transition-colors">Learn</h3>
                            <p className="body-sm text-muted mt-0.5">Adaptive spaced recall</p>
                        </Link>

                        {/* 3. Practice Quiz */}
                        <Link
                            href={`/materials/${material.id}/practice`}
                            className="group block rounded-lg border border-default bg-surface p-4 shadow-[var(--elev-0)] transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-input hover:shadow-[var(--elev-1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="grid size-10 place-items-center rounded-sm bg-practice-subtle text-practice-text group-hover:scale-105 transition-transform">
                                    <Target size={20} />
                                </div>
                                <span className="caption text-muted">{Math.min(20, terms.length)} Qs</span>
                            </div>
                            <h3 className="subtitle text-ink group-hover:text-brand transition-colors">Practice Quiz</h3>
                            <p className="body-sm text-muted mt-0.5">Test with multiple-choice</p>
                        </Link>

                        {/* 4. Match */}
                        <Link
                            href={`/materials/${material.id}/match`}
                            className="group block rounded-lg border border-default bg-surface p-4 shadow-[var(--elev-0)] transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-input hover:shadow-[var(--elev-1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="grid size-10 place-items-center rounded-sm bg-reviewer-subtle text-reviewer-text group-hover:scale-105 transition-transform">
                                    <Zap size={20} />
                                </div>
                                <span className="caption text-muted">Timed</span>
                            </div>
                            <h3 className="subtitle text-ink group-hover:text-brand transition-colors">Match</h3>
                            <p className="body-sm text-muted mt-0.5">Timed matching challenge</p>
                        </Link>
                    </div>
                ) : (
                    /* Reviewer Study Modes */
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                        {/* 1. Read Guide */}
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("terms");
                                window.scrollTo({ top: 400, behavior: "smooth" });
                            }}
                            className="group text-left block rounded-lg border border-default bg-surface p-4 shadow-[var(--elev-0)] transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-input hover:shadow-[var(--elev-1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[var(--focus)] cursor-pointer"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="grid size-10 place-items-center rounded-sm bg-reviewer-subtle text-reviewer-text group-hover:scale-105 transition-transform">
                                    <BookOpen size={20} />
                                </div>
                                <Badge tone="reviewer">{categories.length} sections</Badge>
                            </div>
                            <h3 className="subtitle text-ink group-hover:text-brand transition-colors">Read Guide</h3>
                            <p className="body-sm text-muted mt-0.5">Review structured notes & terms</p>
                        </button>

                        {/* 2. Learn */}
                        <Link
                            href={`/materials/${material.id}/learn`}
                            className="group block rounded-lg border border-default bg-surface p-4 shadow-[var(--elev-0)] transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-input hover:shadow-[var(--elev-1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="grid size-10 place-items-center rounded-sm bg-brand-subtle text-brand-text group-hover:scale-105 transition-transform">
                                    <BrainCircuit size={20} />
                                </div>
                            </div>
                            <h3 className="subtitle text-ink group-hover:text-brand transition-colors">Learn Mode</h3>
                            <p className="body-sm text-muted mt-0.5">Interactive recall & self-test</p>
                        </Link>

                        {/* 3. Practice Test */}
                        <Link
                            href={`/materials/${material.id}/practice`}
                            className="group block rounded-lg border border-default bg-surface p-4 shadow-[var(--elev-0)] transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-input hover:shadow-[var(--elev-1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-[var(--focus)]"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="grid size-10 place-items-center rounded-sm bg-practice-subtle text-practice-text group-hover:scale-105 transition-transform">
                                    <Target size={20} />
                                </div>
                            </div>
                            <h3 className="subtitle text-ink group-hover:text-brand transition-colors">Practice Test</h3>
                            <p className="body-sm text-muted mt-0.5">Test comprehension of key terms</p>
                        </Link>
                    </div>
                )}
            </div>

            {/* 3. Underline Tabs Navigation */}
            <Tabs
                label="Material views"
                value={activeTab}
                onValueChange={(v) => setActiveTab(v as TabKey)}
                items={[
                    { value: "terms", label: "Terms", count: totalTerms },
                    { value: "stats", label: "Progress & Stats" },
                    { value: "settings", label: "Settings" },
                ]}
            />

            {/* 4. Tab 1: Terms */}
            {activeTab === "terms" && (
                <div className="space-y-4">
                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2 flex-1">
                            <div className="w-full sm:w-64">
                                <Input
                                    size="sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search terms..."
                                    leadingIcon={<Search size={14} />}
                                    trailingSlot={
                                        searchQuery ? (
                                            <button
                                                type="button"
                                                onClick={() => setSearchQuery("")}
                                                className="p-1 hover:text-ink text-muted"
                                            >
                                                <X size={12} />
                                            </button>
                                        ) : null
                                    }
                                />
                            </div>

                            {/* Status Filter Chips (for Flashcards) */}
                            {materialType === "flashcard" && (
                                <div className="flex items-center gap-1">
                                    <Chip selected={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
                                        All
                                    </Chip>
                                    <Chip
                                        selected={statusFilter === "mastered"}
                                        onClick={() => setStatusFilter("mastered")}
                                    >
                                        <span className="size-2 rounded-full bg-success mr-0.5" />
                                        Mastered ({masteredCount})
                                    </Chip>
                                    <Chip
                                        selected={statusFilter === "learning"}
                                        onClick={() => setStatusFilter("learning")}
                                    >
                                        <span className="size-2 rounded-full bg-warn mr-0.5" />
                                        Learning ({learningCount})
                                    </Chip>
                                    <Chip selected={statusFilter === "new"} onClick={() => setStatusFilter("new")}>
                                        <span className="size-2 rounded-full bg-disabled mr-0.5" />
                                        New ({newCount})
                                    </Chip>
                                </div>
                            )}

                            {/* Sort Dropdown */}
                            {materialType === "flashcard" && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="secondary" size="sm" className="gap-1">
                                            <span className="text-muted font-normal">Sort:</span>
                                            <span className="capitalize">{sortOption}</span>
                                            <ChevronDown size={13} className="text-muted" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-40">
                                        <DropdownMenuItem onClick={() => setSortOption("original")}>
                                            <span className="w-4">{sortOption === "original" && <Check size={14} />}</span>
                                            Original order
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortOption("alphabetical")}>
                                            <span className="w-4">
                                                {sortOption === "alphabetical" && <Check size={14} />}
                                            </span>
                                            Alphabetical (A-Z)
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setSortOption("status")}>
                                            <span className="w-4">{sortOption === "status" && <Check size={14} />}</span>
                                            Mastery status
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>

                        {/* Add Term / Category Button */}
                        <div>
                            {materialType === "flashcard" ? (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => {
                                        setIsAddingNewTerm(true);
                                        setNewTermData({ front: "", back: "" });
                                    }}
                                    className="gap-1.5 w-full sm:w-auto"
                                >
                                    <Plus size={15} />
                                    Add card
                                </Button>
                            ) : (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => setIsAddingCategory(true)}
                                    className="gap-1.5 w-full sm:w-auto"
                                >
                                    <Plus size={15} />
                                    Add category
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Inline Add Flashcard Form */}
                    {isAddingNewTerm && materialType === "flashcard" && (
                        <Card variant="flat" padding="md" className="border-brand bg-brand-subtle/20 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="label text-ink">Add new flashcard</h3>
                                <IconButton
                                    aria-label="Cancel adding card"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsAddingNewTerm(false)}
                                >
                                    <X size={15} />
                                </IconButton>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <Field label="Front (Term)">
                                    <Input
                                        autoFocus
                                        value={newTermData.front}
                                        onChange={(e) => setNewTermData((prev) => ({ ...prev, front: e.target.value }))}
                                        placeholder="e.g. Mitochondria"
                                    />
                                </Field>
                                <Field label="Back (Definition)">
                                    <Input
                                        value={newTermData.back}
                                        onChange={(e) => setNewTermData((prev) => ({ ...prev, back: e.target.value }))}
                                        placeholder="e.g. The powerhouse of the cell"
                                    />
                                </Field>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                                <Button variant="secondary" size="sm" onClick={() => setIsAddingNewTerm(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleAddFlashcard}
                                    disabled={!newTermData.front.trim() || !newTermData.back.trim()}
                                >
                                    Save card
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Inline Add Category Form (Reviewer) */}
                    {isAddingCategory && materialType === "reviewer" && (
                        <Card variant="flat" padding="md" className="border-brand bg-brand-subtle/20 space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="label text-ink">Add new category section</h3>
                                <IconButton
                                    aria-label="Cancel"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIsAddingCategory(false)}
                                >
                                    <X size={15} />
                                </IconButton>
                            </div>
                            <Field label="Category name">
                                <Input
                                    autoFocus
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Chapter 4: Cellular Respiration"
                                />
                            </Field>
                            <div className="flex justify-end gap-2 pt-1">
                                <Button variant="secondary" size="sm" onClick={() => setIsAddingCategory(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleAddCategory}
                                    disabled={!newCategoryName.trim()}
                                >
                                    Create section
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Flashcards List */}
                    {materialType === "flashcard" && (
                        <div className="space-y-2.5">
                            {filteredTerms.map((term, index) => {
                                const isEditing = editingTermId === term.id;

                                if (isEditing) {
                                    return (
                                        <Card key={term.id} variant="flat" padding="md" className="border-brand space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <Field label="Front (Term)">
                                                    <Input
                                                        autoFocus
                                                        value={editTermData.front}
                                                        onChange={(e) =>
                                                            setEditTermData((prev) => ({ ...prev, front: e.target.value }))
                                                        }
                                                    />
                                                </Field>
                                                <Field label="Back (Definition)">
                                                    <Input
                                                        value={editTermData.back}
                                                        onChange={(e) =>
                                                            setEditTermData((prev) => ({ ...prev, back: e.target.value }))
                                                        }
                                                    />
                                                </Field>
                                            </div>
                                            <div className="flex justify-end gap-2 pt-1">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingTermId(null);
                                                        setEditTermData({ front: "", back: "" });
                                                    }}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    size="sm"
                                                    onClick={() => void handleSaveEditFlashcard(term.id)}
                                                    disabled={!editTermData.front.trim() || !editTermData.back.trim()}
                                                >
                                                    Save changes
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                }

                                return (
                                    <div
                                        key={term.id}
                                        className="group relative flex flex-col md:flex-row items-stretch md:items-center rounded-md border border-default bg-surface p-3.5 shadow-[var(--elev-0)] hover:border-input hover:shadow-[var(--elev-1)] transition-all"
                                    >
                                        {/* Left 2-Column: Term & Definition */}
                                        <div className="flex items-center gap-3 md:w-5/12 min-w-0 pr-4">
                                            <span
                                                className={`size-2.5 shrink-0 rounded-full ${getStatusDotColor(
                                                    term.stage
                                                )}`}
                                                title={`Status: ${getStatusLabel(term.stage)}`}
                                            />
                                            <span className="caption tabular text-muted shrink-0 w-6">
                                                #{index + 1}
                                            </span>
                                            <p className="subtitle text-ink truncate select-text">{term.front}</p>
                                        </div>

                                        <div className="md:w-6/12 min-w-0 md:border-l md:border-subtle md:pl-4 py-1.5 md:py-0">
                                            <p className="body text-secondary select-text line-clamp-3 md:line-clamp-2">
                                                {term.back}
                                            </p>
                                        </div>

                                        {/* Actions Toolbar */}
                                        <div className="md:w-1/12 flex items-center justify-end gap-1 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-subtle">
                                            <IconButton
                                                aria-label="Listen to pronunciation"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleSpeak(term.front, term.id)}
                                                className={playingTermId === term.id ? "text-brand" : "text-muted hover:text-ink"}
                                            >
                                                <Volume2 size={14} />
                                            </IconButton>

                                            <IconButton
                                                aria-label="Copy term and definition"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCopy(`${term.front}: ${term.back}`, term.id)}
                                                className={copiedTermId === term.id ? "text-success" : "text-muted hover:text-ink"}
                                            >
                                                {copiedTermId === term.id ? <Check size={14} /> : <Copy size={14} />}
                                            </IconButton>

                                            <IconButton
                                                aria-label="Edit card"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingTermId(term.id);
                                                    setEditTermData({ front: term.front, back: term.back });
                                                }}
                                                className="text-muted hover:text-ink"
                                            >
                                                <Pencil size={14} />
                                            </IconButton>

                                            <IconButton
                                                aria-label="Delete card"
                                                variant="danger-ghost"
                                                size="sm"
                                                onClick={() => void handleDeleteFlashcard(term.id)}
                                            >
                                                <Trash2 size={14} />
                                            </IconButton>
                                        </div>
                                    </div>
                                );
                            })}

                            {filteredTerms.length === 0 && terms.length > 0 && (
                                <div className="rounded-lg border border-dashed border-default p-10 text-center">
                                    <p className="body text-muted">No terms match your active filter.</p>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="mt-3"
                                        onClick={() => {
                                            setSearchQuery("");
                                            setStatusFilter("all");
                                        }}
                                    >
                                        Clear filters
                                    </Button>
                                </div>
                            )}

                            {terms.length === 0 && (
                                <EmptyState
                                    variant="empty"
                                    title="No flashcards yet"
                                    description="Add your first term and definition to start studying."
                                    actionLabel="Add first card"
                                    onAction={() => setIsAddingNewTerm(true)}
                                />
                            )}
                        </div>
                    )}

                    {/* Reviewer Categories & Terms */}
                    {materialType === "reviewer" && (
                        <div className="space-y-4">
                            {filteredReviewerCategories.map((category) => {
                                const isExpanded = expandedCategories.includes(category.id);
                                const isAddingTermToThisCat = addingToCategoryId === category.id;

                                return (
                                    <div
                                        key={category.id}
                                        className="rounded-lg border border-default bg-surface shadow-[var(--elev-0)] overflow-hidden"
                                    >
                                        {/* Category Accordion Header with Colored Rail */}
                                        <div
                                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-surface-hover transition-colors border-l-[4px]"
                                            style={{ borderLeftColor: category.color || "var(--type-reviewer)" }}
                                            onClick={() =>
                                                setExpandedCategories((prev) =>
                                                    prev.includes(category.id)
                                                        ? prev.filter((id) => id !== category.id)
                                                        : [...prev, category.id]
                                                )
                                            }
                                        >
                                            <div className="flex items-center gap-3">
                                                <h3 className="subtitle text-ink font-semibold">{category.name}</h3>
                                                <CountBadge count={category.terms.length} tone="neutral" />
                                            </div>

                                            <div
                                                className="flex items-center gap-1.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="xs"
                                                    onClick={() => {
                                                        setAddingToCategoryId(category.id);
                                                        setNewReviewerTerm({ term: "", definition: "" });
                                                        if (!isExpanded) {
                                                            setExpandedCategories((prev) => [...prev, category.id]);
                                                        }
                                                    }}
                                                    className="gap-1 text-muted hover:text-ink"
                                                >
                                                    <Plus size={13} />
                                                    Add term
                                                </Button>

                                                <IconButton
                                                    aria-label={`Delete category ${category.name}`}
                                                    variant="danger-ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        if (confirm(`Delete section "${category.name}" and all its terms?`)) {
                                                            void handleDeleteCategory(category.id);
                                                        }
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </IconButton>

                                                <span className="p-1 text-muted">
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Category Content */}
                                        {isExpanded && (
                                            <div className="border-t border-subtle p-4 space-y-3 bg-surface-sunken/30">
                                                {/* Inline Add Term inside Category */}
                                                {isAddingTermToThisCat && (
                                                    <Card variant="flat" padding="md" className="border-brand space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="label text-ink">Add term to {category.name}</h4>
                                                            <IconButton
                                                                aria-label="Cancel"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setAddingToCategoryId(null)}
                                                            >
                                                                <X size={14} />
                                                            </IconButton>
                                                        </div>
                                                        <Field label="Term">
                                                            <Input
                                                                autoFocus
                                                                value={newReviewerTerm.term}
                                                                onChange={(e) =>
                                                                    setNewReviewerTerm((prev) => ({
                                                                        ...prev,
                                                                        term: e.target.value,
                                                                    }))
                                                                }
                                                                placeholder="Key concept or term"
                                                            />
                                                        </Field>
                                                        <Field label="Definition / Notes">
                                                            <Textarea
                                                                rows={2}
                                                                value={newReviewerTerm.definition}
                                                                onChange={(e) =>
                                                                    setNewReviewerTerm((prev) => ({
                                                                        ...prev,
                                                                        definition: e.target.value,
                                                                    }))
                                                                }
                                                                placeholder="Explanation and key context..."
                                                            />
                                                        </Field>
                                                        <div className="flex justify-end gap-2 pt-1">
                                                            <Button
                                                                variant="secondary"
                                                                size="sm"
                                                                onClick={() => setAddingToCategoryId(null)}
                                                            >
                                                                Cancel
                                                            </Button>
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => void handleAddReviewerTerm(category.id)}
                                                                disabled={
                                                                    !newReviewerTerm.term.trim() ||
                                                                    !newReviewerTerm.definition.trim()
                                                                }
                                                            >
                                                                Add term
                                                            </Button>
                                                        </div>
                                                    </Card>
                                                )}

                                                {/* Terms Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {category.terms.map((term) => {
                                                        const isEditingThis = editingReviewerTermId === term.id;

                                                        if (isEditingThis) {
                                                            return (
                                                                <Card
                                                                    key={term.id}
                                                                    variant="flat"
                                                                    padding="md"
                                                                    className="border-brand space-y-2 col-span-full"
                                                                >
                                                                    <Field label="Term">
                                                                        <Input
                                                                            autoFocus
                                                                            value={editReviewerTermData.term}
                                                                            onChange={(e) =>
                                                                                setEditReviewerTermData((prev) => ({
                                                                                    ...prev,
                                                                                    term: e.target.value,
                                                                                }))
                                                                            }
                                                                        />
                                                                    </Field>
                                                                    <Field label="Definition">
                                                                        <Textarea
                                                                            rows={2}
                                                                            value={editReviewerTermData.definition}
                                                                            onChange={(e) =>
                                                                                setEditReviewerTermData((prev) => ({
                                                                                    ...prev,
                                                                                    definition: e.target.value,
                                                                                }))
                                                                            }
                                                                        />
                                                                    </Field>
                                                                    <div className="flex justify-end gap-2 pt-1">
                                                                        <Button
                                                                            variant="secondary"
                                                                            size="sm"
                                                                            onClick={() => {
                                                                                setEditingReviewerTermId(null);
                                                                                setEditReviewerTermData({ term: "", definition: "" });
                                                                            }}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            variant="primary"
                                                                            size="sm"
                                                                            onClick={() =>
                                                                                void handleSaveEditReviewerTerm(
                                                                                    category.id,
                                                                                    term.id
                                                                                )
                                                                            }
                                                                            disabled={
                                                                                !editReviewerTermData.term.trim() ||
                                                                                !editReviewerTermData.definition.trim()
                                                                            }
                                                                        >
                                                                            Save changes
                                                                        </Button>
                                                                    </div>
                                                                </Card>
                                                            );
                                                        }

                                                        return (
                                                            <div
                                                                key={term.id}
                                                                className="group relative rounded-md border border-default bg-surface p-4 shadow-[var(--elev-0)] hover:border-input hover:shadow-[var(--elev-1)] transition-all flex flex-col justify-between"
                                                            >
                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h4 className="subtitle text-ink font-semibold">
                                                                            {term.term}
                                                                        </h4>
                                                                        <div className="flex items-center gap-1 opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                                            <IconButton
                                                                                aria-label="Copy"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    handleCopy(
                                                                                        `${term.term}: ${term.definition}`,
                                                                                        term.id
                                                                                    )
                                                                                }
                                                                                className={
                                                                                    copiedTermId === term.id
                                                                                        ? "text-success"
                                                                                        : "text-muted hover:text-ink"
                                                                                }
                                                                            >
                                                                                {copiedTermId === term.id ? (
                                                                                    <Check size={13} />
                                                                                ) : (
                                                                                    <Copy size={13} />
                                                                                )}
                                                                            </IconButton>
                                                                            <IconButton
                                                                                aria-label="Edit"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setEditingReviewerTermId(term.id);
                                                                                    setEditReviewerTermData({
                                                                                        term: term.term,
                                                                                        definition: term.definition,
                                                                                    });
                                                                                }}
                                                                                className="text-muted hover:text-ink"
                                                                            >
                                                                                <Pencil size={13} />
                                                                            </IconButton>
                                                                            <IconButton
                                                                                aria-label="Delete"
                                                                                variant="danger-ghost"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    void handleDeleteReviewerTerm(
                                                                                        category.id,
                                                                                        term.id
                                                                                    )
                                                                                }
                                                                            >
                                                                                <Trash2 size={13} />
                                                                            </IconButton>
                                                                        </div>
                                                                    </div>
                                                                    <p className="body-sm text-secondary leading-relaxed">
                                                                        {term.definition}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {category.terms.length === 0 && (
                                                    <p className="body-sm text-muted text-center py-4">
                                                        No terms in this section yet.
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {categories.length === 0 && (
                                <EmptyState
                                    variant="empty"
                                    title="No sections yet"
                                    description="Create your first section to organize reviewer terms and concepts."
                                    actionLabel="Add category section"
                                    onAction={() => setIsAddingCategory(true)}
                                />
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* 5. Tab 2: Progress / Stats */}
            {activeTab === "stats" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Mastery Ring Card */}
                    <Card variant="flat" padding="lg" className="flex flex-col items-center justify-center text-center">
                        <h3 className="subtitle text-ink mb-4">Overall Mastery</h3>
                        <ProgressRing
                            value={masteryPercentage}
                            size="lg"
                            tone={masteryPercentage >= 80 ? "success" : masteryPercentage >= 40 ? "brand" : "warn"}
                            label="Overall Mastery Percentage"
                        >
                            <span className="title font-bold text-ink">{masteryPercentage}%</span>
                        </ProgressRing>
                        <p className="body-sm text-muted mt-4">
                            {masteredCount} of {totalTerms} items mastered
                        </p>
                    </Card>

                    {/* Stage Distribution Breakdown */}
                    <Card variant="flat" padding="lg" className="lg:col-span-2 space-y-4">
                        <h3 className="subtitle text-ink">Learning Stage Breakdown</h3>
                        <div className="space-y-3.5">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-success flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-success" />
                                        Mastered (Long-term retention)
                                    </span>
                                    <span className="tabular font-semibold text-ink">
                                        {masteredCount} ({totalTerms > 0 ? Math.round((masteredCount / totalTerms) * 100) : 0}%)
                                    </span>
                                </div>
                                <ProgressBar value={masteredCount} max={totalTerms || 1} tone="success" label="Mastered cards" />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-warn flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-warn" />
                                        Learning & Review (In progress)
                                    </span>
                                    <span className="tabular font-semibold text-ink">
                                        {learningCount} ({totalTerms > 0 ? Math.round((learningCount / totalTerms) * 100) : 0}%)
                                    </span>
                                </div>
                                <ProgressBar value={learningCount} max={totalTerms || 1} tone="warn" label="Learning cards" />
                            </div>

                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="font-medium text-muted flex items-center gap-1.5">
                                        <span className="size-2 rounded-full bg-disabled" />
                                        New (Unstudied)
                                    </span>
                                    <span className="tabular font-semibold text-ink">
                                        {newCount} ({totalTerms > 0 ? Math.round((newCount / totalTerms) * 100) : 0}%)
                                    </span>
                                </div>
                                <ProgressBar value={newCount} max={totalTerms || 1} tone="neutral" label="New cards" />
                            </div>
                        </div>

                        {/* Study Insight Recommendation */}
                        <div className="rounded-md border border-brand/20 bg-brand-subtle/30 p-3.5 mt-4 flex items-start gap-3">
                            <Sparkles size={18} className="text-brand shrink-0 mt-0.5" />
                            <div className="body-sm text-secondary">
                                {masteryPercentage === 100 ? (
                                    <p>
                                        <strong className="text-ink">Flawless retention!</strong> You have mastered all items in
                                        this set. Run a quick Practice Test to maintain active recall.
                                    </p>
                                ) : learningCount > 0 ? (
                                    <p>
                                        You have <strong className="text-ink">{learningCount} terms in progress</strong>.
                                        Practicing them now in <strong>Learn Mode</strong> reinforces retrieval strength.
                                    </p>
                                ) : (
                                    <p>
                                        Ready to study? Start flipping through cards in <strong>Flashcard Mode</strong> or test
                                        yourself in <strong>Practice Quiz</strong>.
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* 6. Tab 3: Settings */}
            {activeTab === "settings" && (
                <div className="space-y-6 max-w-2xl">
                    {/* Rename Set Title */}
                    <Card variant="flat" padding="lg" className="space-y-4">
                        <h3 className="subtitle text-ink">Material Details</h3>
                        <Field label="Title">
                            <Input
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                placeholder="Enter material title..."
                            />
                        </Field>
                        <div className="flex justify-end">
                            <Button
                                variant="primary"
                                size="sm"
                                onClick={handleSaveTitle}
                                loading={isSavingTitle}
                                disabled={!titleDraft.trim() || titleDraft.trim() === title}
                            >
                                Save title
                            </Button>
                        </div>
                    </Card>

                    {/* Folder Management */}
                    <Card variant="flat" padding="lg" className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="subtitle text-ink">Folder location</h3>
                                <p className="body-sm text-muted">
                                    Current: <strong className="text-ink">{activeFolder?.name ?? "Unfiled"}</strong>
                                </p>
                            </div>
                            <Button variant="secondary" size="sm" onClick={() => setIsMoveFolderOpen(true)}>
                                Change folder
                            </Button>
                        </div>
                    </Card>

                    {/* Export Actions (Reviewer) */}
                    {materialType === "reviewer" && (
                        <Card variant="flat" padding="lg" className="space-y-3">
                            <h3 className="subtitle text-ink">Export Documents</h3>
                            <p className="body-sm text-muted">
                                Download a clean, formatted document for offline reading or printing.
                            </p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={exportingDoc !== null}
                                    onClick={() => void handleExport("pdf")}
                                    className="gap-1.5"
                                >
                                    <Download size={14} />
                                    Download PDF
                                </Button>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={exportingDoc !== null}
                                    onClick={() => void handleExport("docx")}
                                    className="gap-1.5"
                                >
                                    <Download size={14} />
                                    Download DOCX
                                </Button>
                            </div>
                        </Card>
                    )}

                    {/* Danger Zone */}
                    <Card variant="flat" padding="lg" className="border-danger/30 bg-danger-subtle/20 space-y-3">
                        <h3 className="subtitle text-danger-text">Danger Zone</h3>
                        <p className="body-sm text-muted">
                            Permanently delete &quot;{title}&quot; and all associated cards, terms, and study progress.
                        </p>
                        <Button
                            variant="danger"
                            size="sm"
                            onClick={() => {
                                setDeleteError(null);
                                setShowDeleteConfirm(true);
                            }}
                        >
                            Delete material
                        </Button>
                    </Card>
                </div>
            )}

            {/* Folder Move Dialog */}
            <Dialog open={isMoveFolderOpen} onOpenChange={setIsMoveFolderOpen}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Move material to folder</DialogTitle>
                        <DialogDescription>Select a folder for &quot;{title}&quot;.</DialogDescription>
                    </DialogHeader>
                    <div className="p-5 space-y-1 max-h-64 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => void handleMoveToFolder(null)}
                            className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left body-sm text-ink hover:bg-surface-hover cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <FolderIcon size={15} className="text-muted" />
                                Unfiled
                            </span>
                            {folderId === null && <Check size={14} className="text-brand" />}
                        </button>
                        {folderList.map((f) => (
                            <button
                                key={f.id}
                                type="button"
                                onClick={() => void handleMoveToFolder(f.id)}
                                className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left body-sm text-ink hover:bg-surface-hover cursor-pointer"
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <FolderIcon size={15} className="text-muted" />
                                    <span className="truncate">{f.name}</span>
                                </span>
                                {folderId === f.id && <Check size={14} className="text-brand" />}
                            </button>
                        ))}
                    </div>
                    <DialogFooter className="justify-between">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                setFolderError(null);
                                setNewFolderDraft("");
                                setIsNewFolderDialogOpen(true);
                            }}
                        >
                            <Plus size={14} />
                            New folder
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setIsMoveFolderOpen(false)}>
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Create New Folder Dialog */}
            <Dialog open={isNewFolderDialogOpen} onOpenChange={setIsNewFolderDialogOpen}>
                <DialogContent size="sm">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void handleCreateFolderAndMove();
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>Create folder and move here</DialogTitle>
                            <DialogDescription>Enter a name for the new folder.</DialogDescription>
                        </DialogHeader>
                        <div className="p-5">
                            <Field label="Folder name" error={folderError ?? undefined}>
                                <Input
                                    autoFocus
                                    maxLength={MAX_FOLDER_LENGTH}
                                    value={newFolderDraft}
                                    onChange={(e) => setNewFolderDraft(e.target.value)}
                                    placeholder="e.g. Finals Prep"
                                />
                            </Field>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsNewFolderDialogOpen(false)}
                                disabled={folderBusy}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                loading={folderBusy}
                                disabled={!newFolderDraft.trim()}
                            >
                                Create & Move
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={showDeleteConfirm}
                onOpenChange={(open) => !open && !isDeleting && setShowDeleteConfirm(false)}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Delete {materialType === "flashcard" ? "Flashcard Set" : "Reviewer"}?</DialogTitle>
                        <DialogDescription>
                            <strong className="text-ink">{title}</strong> and all associated{" "}
                            {materialType === "flashcard" ? "cards and progress" : "terms"} will be permanently removed.
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteError && (
                        <div className="px-5 pt-2">
                            <p role="alert" className="body-sm text-danger-text rounded-xs bg-danger-subtle p-2">
                                {deleteError}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={isDeleting}
                            onClick={() => setShowDeleteConfirm(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            loading={isDeleting}
                            onClick={() => void handleDeleteMaterial()}
                        >
                            Delete material
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share Modal */}
            {showShareModal && (
                <ShareModal
                    isOpen={showShareModal}
                    onClose={() => setShowShareModal(false)}
                    materialId={material.id}
                    materialType={materialType === "flashcard" ? "flashcard_set" : "reviewer"}
                    materialTitle={title}
                />
            )}
        </div>
    );
}

function masterageText(percent: number): string {
    if (percent === 100) return "100% Mastered";
    if (percent > 0) return `${percent}% Mastered`;
    return "0% Mastered";
}
