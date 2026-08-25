"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Search,
    Plus,
    Folder as FolderIcon,
    LayoutList,
    LayoutGrid,
    ArrowUpDown,
    MoreVertical,
    ChevronDown,
    ChevronRight,
    Share2,
    Trash2,
    Pencil,
    X,
    Check,
    FolderOpen,
    Download,
    FolderInput,
    Sparkles,
} from "lucide-react";
import { useMaterialsStore } from "@/lib/stores";
import type { Folder as FolderModel, MaterialItem } from "@/lib/schemas/materials";
import {
    PageHeader,
    Button,
    ButtonLink,
    IconButton,
    Input,
    Chip,
    Badge,
    CountBadge,
    SegmentedControl,
    SegmentedProgress,
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuLabel,
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
import { matchesMaterialFilter, selectMaterialSourceItems } from "@/utils/materialFilter";
import {
    groupMaterialsByFolder,
    matchesFolderFilter,
    UNFILED_FOLDER_ID,
    validateFolderName,
    MAX_FOLDER_LENGTH,
} from "@/utils/materialFolder";
import {
    createFolder as createFolderRow,
    deleteFolder as deleteFolderRow,
    deleteMaterial as deleteMaterialRow,
    renameFolder as renameFolderRow,
    setMaterialFolder,
    type SupabaseLike,
} from "@/lib/folders/api";
import { runOptimistic } from "@/lib/folders/optimistic";
import { exportToPDF, exportToDOCX } from "@/utils/exportReviewer";

interface MaterialsClientProps {
    initialItems: MaterialItem[];
    initialFolders: FolderModel[];
    userId: string | null;
    loadError: string | null;
}

type SortOption = "recent" | "created" | "name" | "cards" | "mastered";

function db(): SupabaseLike {
    return createClient() as unknown as SupabaseLike;
}

function getItemUnitLabel(type: MaterialItem["type"], count: number): string {
    if (type === "Reviewer") return count === 1 ? "term" : "terms";
    return count === 1 ? "card" : "cards";
}

function getItemCounts(item: MaterialItem) {
    if (item.studyCounts) {
        return item.studyCounts;
    }
    // Default estimate if individual study progress is uninitialized
    return {
        mastered: 0,
        learning: 0,
        new: item.itemsCount || 0,
    };
}

export default function MaterialsClient({
    initialItems,
    initialFolders,
    userId,
    loadError,
}: MaterialsClientProps) {
    const router = useRouter();

    // Local UI State
    const [viewMode, setViewMode] = useState<"list" | "grid">("list");
    const [sortBy, setSortBy] = useState<SortOption>("recent");
    const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});
    const [toastMessage, setToastMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

    // Modals & Dialogs State
    const [shareItem, setShareItem] = useState<MaterialItem | null>(null);
    const [moveItemTarget, setMoveItemTarget] = useState<MaterialItem | null>(null);
    const [pendingDeleteItem, setPendingDeleteItem] = useState<MaterialItem | null>(null);
    const [pendingDeleteFolder, setPendingDeleteFolder] = useState<FolderModel | null>(null);
    const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
    const [newFolderDraft, setNewFolderDraft] = useState("");
    const [editingFolder, setEditingFolder] = useState<FolderModel | null>(null);
    const [renameFolderDraft, setRenameFolderDraft] = useState("");
    const [folderFormError, setFolderFormError] = useState<string | null>(null);

    // Busy flags
    const [confirmBusy, setConfirmBusy] = useState(false);
    const [confirmError, setConfirmError] = useState<string | null>(null);
    const [folderBusy, setFolderBusy] = useState(false);
    const [exportingItemId, setExportingItemId] = useState<string | null>(null);

    const {
        items,
        folders,
        seeded,
        searchQuery,
        activeFilter,
        activeFolderId,
        setSearchQuery,
        setActiveFilter,
        setActiveFolderId,
        setItems,
        setFolders,
        removeItem,
        setItemFolder,
        addFolder,
        renameFolder,
        removeFolder,
        snapshot,
        restore,
    } = useMaterialsStore();

    // Sync initial server data into Zustand store
    useEffect(() => {
        setItems(initialItems);
        setFolders(initialFolders);
    }, [initialItems, initialFolders, setItems, setFolders]);

    const sourceItems = selectMaterialSourceItems(seeded, items, initialItems);
    const sourceFolders = seeded ? folders : initialFolders;
    const showFolderUi = sourceFolders.length > 0;

    const isSearching = searchQuery.trim().length > 0;
    const isFiltering = isSearching || activeFilter !== "All" || activeFolderId !== null;

    // Filter
    const filteredItems = sourceItems.filter((item: MaterialItem) => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase().trim());
        const matchesFilter = matchesMaterialFilter(item.type, activeFilter);
        const matchesFolder = matchesFolderFilter(item.folderId, activeFolderId);
        return matchesSearch && matchesFilter && matchesFolder;
    });

    // Sort
    const sortedItems = [...filteredItems].sort((a, b) => {
        switch (sortBy) {
            case "created":
                return new Date(a.sortDate || 0).getTime() - new Date(b.sortDate || 0).getTime();
            case "name":
                return a.title.localeCompare(b.title, undefined, { sensitivity: "base" });
            case "cards":
                return (b.itemsCount || 0) - (a.itemsCount || 0);
            case "mastered": {
                const aM = a.studyCounts?.mastered ?? 0;
                const bM = b.studyCounts?.mastered ?? 0;
                return bM - aM;
            }
            case "recent":
            default:
                return new Date(b.sortDate || 0).getTime() - new Date(a.sortDate || 0).getTime();
        }
    });

    // Grouping
    const groupedItems = showFolderUi && activeFolderId === null && !isSearching
        ? groupMaterialsByFolder(sortedItems, sourceFolders, { includeEmptyFolders: !isFiltering })
        : [{ key: "all", folder: null as FolderModel | null, items: sortedItems }];

    // Library Summary Stats
    const totalItems = sourceItems.length;
    const totalCards = sourceItems.reduce((acc, item) => acc + (item.itemsCount || 0), 0);
    const totalMastered = sourceItems.reduce((acc, item) => acc + (item.studyCounts?.mastered || 0), 0);

    const statsSubtitle = totalItems === 0
        ? "Your study library"
        : `${totalItems} ${totalItems === 1 ? "item" : "items"} · ${totalCards.toLocaleString()} cards & terms${
              totalMastered > 0 ? ` · ${totalMastered.toLocaleString()} mastered` : ""
          }`;

    const clearFilters = () => {
        setSearchQuery("");
        setActiveFilter("All");
        setActiveFolderId(null);
    };

    const toggleFolderCollapse = (key: string) => {
        setCollapsedFolders((prev) => ({
            ...prev,
            [key]: !prev[key],
        }));
    };

    // Actions
    const handleMoveToFolder = async (item: MaterialItem, targetFolderId: string | null) => {
        const before = snapshot();
        const ok = await runOptimistic({
            apply: () => setItemFolder(item.id, targetFolderId),
            rollback: () => restore(before),
            write: () =>
                setMaterialFolder(db(), {
                    materialId: item.id,
                    materialType: item.type,
                    folderId: targetFolderId,
                }),
            onError: (err) => setToastMessage({ kind: "error", text: err }),
            fallbackMessage: "Could not move the material.",
        });
        if (ok) {
            setToastMessage({ kind: "success", text: "Material moved successfully." });
        }
        setMoveItemTarget(null);
        return ok;
    };

    const handleCreateFolder = async () => {
        const check = validateFolderName(newFolderDraft, sourceFolders);
        if (!check.ok) {
            setFolderFormError(check.message);
            return;
        }
        if (!userId) {
            setToastMessage({ kind: "error", text: "Your session expired. Sign in again." });
            return;
        }
        setFolderBusy(true);
        setFolderFormError(null);
        const { data, error } = await createFolderRow(db(), { userId, name: check.name });
        setFolderBusy(false);
        if (error || !data) {
            setFolderFormError(error ?? "Could not create the folder.");
            return;
        }
        addFolder(data);
        setNewFolderDraft("");
        setIsCreateFolderOpen(false);
        setToastMessage({ kind: "success", text: `Folder "${data.name}" created.` });
    };

    const handleRenameFolder = async () => {
        if (!editingFolder) return;
        const check = validateFolderName(renameFolderDraft, sourceFolders, editingFolder.id);
        if (!check.ok) {
            setFolderFormError(check.message);
            return;
        }
        if (check.name === editingFolder.name) {
            setEditingFolder(null);
            return;
        }
        const before = snapshot();
        setFolderBusy(true);
        setFolderFormError(null);
        const ok = await runOptimistic({
            apply: () => renameFolder(editingFolder.id, check.name),
            rollback: () => restore(before),
            write: () => renameFolderRow(db(), { id: editingFolder.id, name: check.name }),
            onError: (err) => setFolderFormError(err),
            fallbackMessage: "Could not rename the folder.",
        });
        setFolderBusy(false);
        if (ok) {
            setEditingFolder(null);
            setRenameFolderDraft("");
            setToastMessage({ kind: "success", text: `Folder renamed to "${check.name}".` });
        }
    };

    const confirmDeleteFolder = async () => {
        if (!pendingDeleteFolder) return;
        setConfirmBusy(true);
        setConfirmError(null);
        const { error } = await deleteFolderRow(db(), { id: pendingDeleteFolder.id });
        setConfirmBusy(false);
        if (error) {
            setConfirmError(error);
            return;
        }
        removeFolder(pendingDeleteFolder.id);
        setPendingDeleteFolder(null);
        setToastMessage({ kind: "success", text: "Folder deleted. Materials moved to Unfiled." });
    };

    const confirmDeleteItem = async () => {
        if (!pendingDeleteItem) return;
        setConfirmBusy(true);
        setConfirmError(null);
        const { error } = await deleteMaterialRow(db(), {
            materialId: pendingDeleteItem.id,
            materialType: pendingDeleteItem.type,
        });
        setConfirmBusy(false);
        if (error) {
            setConfirmError(error);
            return;
        }
        removeItem(pendingDeleteItem.id);
        setPendingDeleteItem(null);
        setToastMessage({ kind: "success", text: "Material deleted." });
    };

    const handleExportReviewer = async (item: MaterialItem, format: "pdf" | "docx") => {
        setExportingItemId(item.id);
        try {
            const supabase = createClient();
            const { data } = await supabase
                .from("reviewer_categories")
                .select("id, name, reviewer_terms(id, term, definition)")
                .eq("reviewer_id", item.id)
                .order("created_at");

            const categories = (data || []).map((cat: { name: string; reviewer_terms?: Array<{ term: string; definition: string }> }) => ({
                name: cat.name,
                terms: (cat.reviewer_terms || []).map((t) => ({ front: t.term, back: t.definition })),
            }));

            if (format === "pdf") {
                await exportToPDF({ title: item.title, terms: [], categories });
            } else {
                await exportToDOCX({ title: item.title, terms: [], categories });
            }
            setToastMessage({ kind: "success", text: `Exported ${item.title} as ${format.toUpperCase()}.` });
        } catch {
            setToastMessage({ kind: "error", text: "Failed to export reviewer document." });
        } finally {
            setExportingItemId(null);
        }
    };

    const activeFolderObj = sourceFolders.find((f) => f.id === activeFolderId);
    const folderFilterLabel =
        activeFolderId === null
            ? "All folders"
            : activeFolderId === UNFILED_FOLDER_ID
            ? "Unfiled"
            : activeFolderObj?.name ?? "Folder";

    const sortLabels: Record<SortOption, string> = {
        recent: "Recently edited",
        created: "Recently created",
        name: "Name (A–Z)",
        cards: "Most cards",
        mastered: "Least mastered",
    };

    const getRailColorClass = (type: MaterialItem["type"]) => {
        if (type === "Flashcards") return "border-l-[3px] border-l-[var(--type-cards)]";
        if (type === "Reviewer") return "border-l-[3px] border-l-[var(--type-reviewer)]";
        return "border-l-[3px] border-l-[var(--type-practice)]";
    };

    return (
        <div className="w-full">
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

            {loadError ? (
                <EmptyState
                    variant="error"
                    title="Could not load your library"
                    description={loadError}
                    onRetry={() => router.refresh()}
                />
            ) : (
                <>
                    {/* Header with Title, Stats, and Create Button */}
                    <PageHeader
                        title="Materials"
                        description={statsSubtitle}
                        actions={
                            <ButtonLink href="/materials/create" variant="primary" size="md">
                                <Plus size={16} />
                                Create material
                            </ButtonLink>
                        }
                        toolbar={
                            <div className="flex flex-col gap-3">
                                {/* Search & Filters Bar */}
                                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                                    {/* Search Input */}
                                    <div className="flex-1 min-w-[240px]">
                                        <Input
                                            size="sm"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search materials by title..."
                                            leadingIcon={<Search size={15} />}
                                            trailingSlot={
                                                searchQuery ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setSearchQuery("")}
                                                        className="p-1 hover:text-ink text-muted transition-colors rounded-xs"
                                                        aria-label="Clear search"
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                ) : null
                                            }
                                        />
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Type Filter Chips */}
                                        <div className="flex items-center gap-1">
                                            <Chip
                                                selected={activeFilter === "All"}
                                                onClick={() => setActiveFilter("All")}
                                            >
                                                All
                                            </Chip>
                                            <Chip
                                                selected={activeFilter === "Flashcards" || activeFilter === "Cards"}
                                                onClick={() =>
                                                    setActiveFilter(
                                                        activeFilter === "Flashcards" || activeFilter === "Cards"
                                                            ? "All"
                                                            : "Flashcards"
                                                    )
                                                }
                                            >
                                                Flashcards
                                            </Chip>
                                            <Chip
                                                selected={activeFilter === "Reviewer"}
                                                onClick={() =>
                                                    setActiveFilter(activeFilter === "Reviewer" ? "All" : "Reviewer")
                                                }
                                            >
                                                Reviewers
                                            </Chip>
                                        </div>

                                        {/* Folder Selector Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="sm" className="gap-1.5">
                                                    <FolderIcon size={14} className="text-muted" />
                                                    <span className="max-w-[130px] truncate">{folderFilterLabel}</span>
                                                    <ChevronDown size={13} className="text-muted" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-56">
                                                <DropdownMenuLabel>Filter by folder</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setActiveFolderId(null)}>
                                                    <span className="w-4">
                                                        {activeFolderId === null && <Check size={14} />}
                                                    </span>
                                                    All folders
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setActiveFolderId(UNFILED_FOLDER_ID)}>
                                                    <span className="w-4">
                                                        {activeFolderId === UNFILED_FOLDER_ID && <Check size={14} />}
                                                    </span>
                                                    Unfiled materials
                                                </DropdownMenuItem>
                                                {sourceFolders.length > 0 && <DropdownMenuSeparator />}
                                                {sourceFolders.map((folder) => (
                                                    <DropdownMenuItem
                                                        key={folder.id}
                                                        onClick={() => setActiveFolderId(folder.id)}
                                                    >
                                                        <span className="w-4">
                                                            {activeFolderId === folder.id && <Check size={14} />}
                                                        </span>
                                                        <span className="truncate">{folder.name}</span>
                                                    </DropdownMenuItem>
                                                ))}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => {
                                                        setFolderFormError(null);
                                                        setNewFolderDraft("");
                                                        setIsCreateFolderOpen(true);
                                                    }}
                                                >
                                                    <Plus size={14} className="text-brand" />
                                                    <span className="text-brand-text font-medium">New folder</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* Sort Dropdown */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="secondary" size="sm" className="gap-1.5">
                                                    <ArrowUpDown size={14} className="text-muted" />
                                                    <span className="hidden sm:inline text-muted font-normal">Sort:</span>
                                                    <span>{sortLabels[sortBy]}</span>
                                                    <ChevronDown size={13} className="text-muted" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuLabel>Sort materials</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setSortBy("recent")}>
                                                    <span className="w-4">{sortBy === "recent" && <Check size={14} />}</span>
                                                    Recently edited
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setSortBy("created")}>
                                                    <span className="w-4">{sortBy === "created" && <Check size={14} />}</span>
                                                    Recently created
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setSortBy("name")}>
                                                    <span className="w-4">{sortBy === "name" && <Check size={14} />}</span>
                                                    Name (A–Z)
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setSortBy("cards")}>
                                                    <span className="w-4">{sortBy === "cards" && <Check size={14} />}</span>
                                                    Most cards
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setSortBy("mastered")}>
                                                    <span className="w-4">{sortBy === "mastered" && <Check size={14} />}</span>
                                                    Least mastered
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* View Toggle (List vs Grid) */}
                                        <SegmentedControl
                                            label="View mode"
                                            value={viewMode}
                                            onValueChange={(val) => setViewMode(val as "list" | "grid")}
                                            items={[
                                                { value: "list", label: "List", icon: <LayoutList size={14} /> },
                                                { value: "grid", label: "Grid", icon: <LayoutGrid size={14} /> },
                                            ]}
                                        />
                                    </div>
                                </div>
                            </div>
                        }
                    />

                    {/* Main Content Area */}
                    {sortedItems.length > 0 ? (
                        <div className="flex flex-col gap-8 pb-16">
                            {groupedItems.map((group) => {
                                const isCollapsed = Boolean(collapsedFolders[group.key]);
                                const isUnfiled = group.key === UNFILED_FOLDER_ID;
                                const isAll = group.key === "all";

                                return (
                                    <section key={group.key} className="space-y-3">
                                        {/* Collapsible Folder Header */}
                                        {!isAll && (
                                            <div className="flex items-center justify-between border-b border-subtle pb-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFolderCollapse(group.key)}
                                                    className="group flex items-center gap-2 text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[var(--focus)] rounded-xs"
                                                    aria-expanded={!isCollapsed}
                                                >
                                                    <span className="text-muted group-hover:text-ink transition-colors">
                                                        {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                                    </span>
                                                    <FolderIcon size={16} className="text-muted group-hover:text-ink" />
                                                    <h2 className="subtitle text-ink">
                                                        {isUnfiled ? "Unfiled" : group.folder?.name}
                                                    </h2>
                                                    <CountBadge count={group.items.length} tone="neutral" />
                                                </button>

                                                {/* Folder Options Menu (for custom folders) */}
                                                {!isUnfiled && group.folder && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <IconButton
                                                                aria-label={`Folder options for ${group.folder.name}`}
                                                                variant="ghost"
                                                                size="sm"
                                                            >
                                                                <MoreVertical size={14} />
                                                            </IconButton>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem
                                                                onClick={() => {
                                                                    setFolderFormError(null);
                                                                    setRenameFolderDraft(group.folder?.name ?? "");
                                                                    setEditingFolder(group.folder);
                                                                }}
                                                            >
                                                                <Pencil size={14} />
                                                                Rename folder
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                tone="danger"
                                                                onClick={() => {
                                                                    setConfirmError(null);
                                                                    setPendingDeleteFolder(group.folder);
                                                                }}
                                                            >
                                                                <Trash2 size={14} />
                                                                Delete folder
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}
                                            </div>
                                        )}

                                        {/* Folder Content (Collapsible) */}
                                        {!isCollapsed && (
                                            <>
                                                {group.items.length === 0 ? (
                                                    <div className="rounded-lg border border-dashed border-default p-6 text-center">
                                                        <p className="body-sm text-muted">
                                                            This folder is empty. File materials here from their options menu.
                                                        </p>
                                                    </div>
                                                ) : viewMode === "list" ? (
                                                    /* List View (Anki-inspired work queue) */
                                                    <div className="flex flex-col gap-2">
                                                        {group.items.map((item) => {
                                                            const counts = getItemCounts(item);
                                                            const unit = getItemUnitLabel(item.type, item.itemsCount);
                                                            const total = counts.mastered + counts.learning + counts.new || item.itemsCount || 1;
                                                            const masteryPercent = Math.round((counts.mastered / total) * 100);

                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={() => router.push(`/materials/${item.id}`)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                            e.preventDefault();
                                                                            router.push(`/materials/${item.id}`);
                                                                        }
                                                                    }}
                                                                    className={`group relative flex min-h-[64px] cursor-pointer items-center justify-between gap-4 rounded-md border border-default bg-surface px-4 py-3 shadow-[var(--elev-0)] transition-[border-color,box-shadow,background-color] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-input hover:shadow-[var(--elev-1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] ${getRailColorClass(
                                                                        item.type
                                                                    )}`}
                                                                >
                                                                    {/* Left: Icon, Title, and Meta */}
                                                                    <div className="flex min-w-0 flex-1 items-center gap-3">
                                                                        <TypeIcon
                                                                            type={item.type === "Reviewer" ? "Reviewer" : "Flashcards"}
                                                                            size="sm"
                                                                            className="shrink-0"
                                                                        />
                                                                        <div className="min-w-0 flex-1 overflow-hidden">
                                                                            <div className="flex items-center gap-2">
                                                                                <h3
                                                                                    className="subtitle truncate text-ink group-hover:text-brand transition-colors block"
                                                                                    title={item.title}
                                                                                >
                                                                                    {item.title}
                                                                                </h3>
                                                                                {item.folderName && (isAll || isSearching || activeFolderId !== null) && (
                                                                                    <Badge tone="neutral" className="hidden sm:inline-flex shrink-0">
                                                                                        <FolderIcon size={11} className="mr-0.5" />
                                                                                        {item.folderName}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                            <div className="body-sm flex items-center gap-2 text-muted truncate">
                                                                                <span className="truncate">
                                                                                    {item.type === "Flashcards" ? "Cards" : "Reviewer"} ·{" "}
                                                                                    {item.itemsCount} {unit}
                                                                                </span>
                                                                                <span className="shrink-0">·</span>
                                                                                <span className="shrink-0">{item.lastAccessed}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Center/Right: Segmented Progress & Actions */}
                                                                    <div className="flex shrink-0 items-center gap-4">
                                                                        {/* Progress Bar & Mastery Ratio */}
                                                                        <div className="hidden sm:flex flex-col items-end gap-1 w-32 md:w-44">
                                                                            <div className="flex items-center justify-between w-full caption tabular text-muted">
                                                                                <span>{counts.mastered}/{total} mastered</span>
                                                                                <span className="font-semibold text-ink">{masteryPercent}%</span>
                                                                            </div>
                                                                            <SegmentedProgress counts={counts} className="h-1.5" />
                                                                        </div>

                                                                        {/* Quick Action & Options Menu */}
                                                                        <div
                                                                            className="flex items-center gap-1.5"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onKeyDown={(e) => e.stopPropagation()}
                                                                        >
                                                                            <Button
                                                                                variant="secondary"
                                                                                size="sm"
                                                                                onClick={() => router.push(`/materials/${item.id}`)}
                                                                                className="hidden md:inline-flex"
                                                                            >
                                                                                Study
                                                                                <ChevronRight size={14} className="text-muted" />
                                                                            </Button>

                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <IconButton
                                                                                        aria-label={`Options for ${item.title}`}
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                    >
                                                                                        <MoreVertical size={15} />
                                                                                    </IconButton>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end" className="w-48">
                                                                                    <DropdownMenuItem onClick={() => router.push(`/materials/${item.id}`)}>
                                                                                        <Sparkles size={14} />
                                                                                        Study now
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => setMoveItemTarget(item)}>
                                                                                        <FolderInput size={14} />
                                                                                        Move to folder
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => setShareItem(item)}>
                                                                                        <Share2 size={14} />
                                                                                        Share material
                                                                                    </DropdownMenuItem>
                                                                                    {item.type === "Reviewer" && (
                                                                                        <>
                                                                                            <DropdownMenuSeparator />
                                                                                            <DropdownMenuItem
                                                                                                disabled={exportingItemId === item.id}
                                                                                                onClick={() => handleExportReviewer(item, "pdf")}
                                                                                            >
                                                                                                <Download size={14} />
                                                                                                Export PDF
                                                                                            </DropdownMenuItem>
                                                                                            <DropdownMenuItem
                                                                                                disabled={exportingItemId === item.id}
                                                                                                onClick={() => handleExportReviewer(item, "docx")}
                                                                                            >
                                                                                                <Download size={14} />
                                                                                                Export DOCX
                                                                                            </DropdownMenuItem>
                                                                                        </>
                                                                                    )}
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem
                                                                                        tone="danger"
                                                                                        onClick={() => {
                                                                                            setConfirmError(null);
                                                                                            setPendingDeleteItem(item);
                                                                                        }}
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                        Delete material
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    /* Grid View (Card Grid) */
                                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                                        {group.items.map((item) => {
                                                            const counts = getItemCounts(item);
                                                            const unit = getItemUnitLabel(item.type, item.itemsCount);
                                                            const total = counts.mastered + counts.learning + counts.new || item.itemsCount || 1;
                                                            const masteryPercent = Math.round((counts.mastered / total) * 100);

                                                            return (
                                                                <div
                                                                    key={item.id}
                                                                    role="button"
                                                                    tabIndex={0}
                                                                    onClick={() => router.push(`/materials/${item.id}`)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === "Enter" || e.key === " ") {
                                                                            e.preventDefault();
                                                                            router.push(`/materials/${item.id}`);
                                                                        }
                                                                    }}
                                                                    className={`group relative flex h-[200px] flex-col justify-between rounded-lg border border-default bg-surface p-4 shadow-[var(--elev-0)] transition-[border-color,box-shadow,transform] duration-[var(--dur-fast)] ease-[var(--ease-out)] hover:border-input hover:shadow-[var(--elev-1)] hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus)] cursor-pointer ${getRailColorClass(
                                                                        item.type
                                                                    )}`}
                                                                >
                                                                    {/* Top row: Type icon + Dropdown Menu */}
                                                                    <div className="flex items-start justify-between">
                                                                        <TypeIcon
                                                                            type={item.type === "Reviewer" ? "Reviewer" : "Flashcards"}
                                                                            size="md"
                                                                        />

                                                                        <div
                                                                            onClick={(e) => e.stopPropagation()}
                                                                            onKeyDown={(e) => e.stopPropagation()}
                                                                        >
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <IconButton
                                                                                        aria-label={`Options for ${item.title}`}
                                                                                        variant="ghost"
                                                                                        size="sm"
                                                                                    >
                                                                                        <MoreVertical size={15} />
                                                                                    </IconButton>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end" className="w-48">
                                                                                    <DropdownMenuItem onClick={() => router.push(`/materials/${item.id}`)}>
                                                                                        <Sparkles size={14} />
                                                                                        Study now
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => setMoveItemTarget(item)}>
                                                                                        <FolderInput size={14} />
                                                                                        Move to folder
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem onClick={() => setShareItem(item)}>
                                                                                        <Share2 size={14} />
                                                                                        Share material
                                                                                    </DropdownMenuItem>
                                                                                    {item.type === "Reviewer" && (
                                                                                        <>
                                                                                            <DropdownMenuSeparator />
                                                                                            <DropdownMenuItem
                                                                                                disabled={exportingItemId === item.id}
                                                                                                onClick={() => handleExportReviewer(item, "pdf")}
                                                                                            >
                                                                                                <Download size={14} />
                                                                                                Export PDF
                                                                                            </DropdownMenuItem>
                                                                                            <DropdownMenuItem
                                                                                                disabled={exportingItemId === item.id}
                                                                                                onClick={() => handleExportReviewer(item, "docx")}
                                                                                            >
                                                                                                <Download size={14} />
                                                                                                Export DOCX
                                                                                            </DropdownMenuItem>
                                                                                        </>
                                                                                    )}
                                                                                    <DropdownMenuSeparator />
                                                                                    <DropdownMenuItem
                                                                                        tone="danger"
                                                                                        onClick={() => {
                                                                                            setConfirmError(null);
                                                                                            setPendingDeleteItem(item);
                                                                                        }}
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                        Delete material
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                    </div>

                                                                    {/* Middle: Title & Meta */}
                                                                    <div>
                                                                        <h3
                                                                            className="subtitle line-clamp-2 text-ink group-hover:text-brand transition-colors mb-1.5 break-words"
                                                                            title={item.title}
                                                                        >
                                                                            {item.title}
                                                                        </h3>
                                                                        <div className="flex flex-wrap items-center gap-2">
                                                                            {item.folderName && (
                                                                                <Badge tone="neutral">
                                                                                    <FolderIcon size={11} className="mr-0.5" />
                                                                                    {item.folderName}
                                                                                </Badge>
                                                                            )}
                                                                            <span className="body-sm text-muted">
                                                                                {item.itemsCount} {unit} · {item.lastAccessed}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    {/* Bottom: Segmented Progress & Mastery */}
                                                                    <div className="space-y-1.5 pt-2 border-t border-subtle">
                                                                        <div className="flex items-center justify-between caption tabular text-muted">
                                                                            <span>{counts.mastered}/{total} mastered</span>
                                                                            <span className="font-medium text-ink">{masteryPercent}%</span>
                                                                        </div>
                                                                        <SegmentedProgress counts={counts} className="h-1.5" />
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </section>
                                );
                            })}
                        </div>
                    ) : sourceItems.length > 0 ? (
                        /* Filter/Search returned 0 matches */
                        <EmptyState
                            variant="no-results"
                            title="No matching materials"
                            description="Try adjusting your search query, type filter, or folder selection."
                            query={searchQuery || activeFilter}
                            onClearFilters={clearFilters}
                        />
                    ) : (
                        /* Library is empty */
                        <EmptyState
                            variant="empty"
                            icon={<FolderOpen size={28} className="text-brand" />}
                            title="No materials yet"
                            description="Upload a PDF or paste your study notes to generate your first deck or reviewer."
                            actionLabel="Create material"
                            onAction={() => router.push("/materials/create")}
                            secondaryActionLabel="Explore templates"
                            onSecondaryAction={() => router.push("/materials/create")}
                        />
                    )}
                </>
            )}

            {/* Create Folder Dialog */}
            <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
                <DialogContent size="sm">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void handleCreateFolder();
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>Create new folder</DialogTitle>
                            <DialogDescription>
                                Folders help group your related decks and reviewers together.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="p-5">
                            <Field label="Folder name" error={folderFormError ?? undefined}>
                                <Input
                                    autoFocus
                                    maxLength={MAX_FOLDER_LENGTH}
                                    value={newFolderDraft}
                                    onChange={(e) => setNewFolderDraft(e.target.value)}
                                    placeholder="e.g. Organic Chemistry, Midterms 2026"
                                />
                            </Field>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setIsCreateFolderOpen(false)}
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
                                Create folder
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Rename Folder Dialog */}
            <Dialog open={editingFolder !== null} onOpenChange={(open) => !open && setEditingFolder(null)}>
                <DialogContent size="sm">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void handleRenameFolder();
                        }}
                    >
                        <DialogHeader>
                            <DialogTitle>Rename folder</DialogTitle>
                            <DialogDescription>Enter a new name for &quot;{editingFolder?.name}&quot;.</DialogDescription>
                        </DialogHeader>
                        <div className="p-5">
                            <Field label="Folder name" error={folderFormError ?? undefined}>
                                <Input
                                    autoFocus
                                    maxLength={MAX_FOLDER_LENGTH}
                                    value={renameFolderDraft}
                                    onChange={(e) => setRenameFolderDraft(e.target.value)}
                                    placeholder="New folder name"
                                />
                            </Field>
                        </div>
                        <DialogFooter>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => setEditingFolder(null)}
                                disabled={folderBusy}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                size="sm"
                                loading={folderBusy}
                                disabled={!renameFolderDraft.trim()}
                            >
                                Save changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Move Material to Folder Dialog */}
            <Dialog open={moveItemTarget !== null} onOpenChange={(open) => !open && setMoveItemTarget(null)}>
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Move material</DialogTitle>
                        <DialogDescription>
                            Choose a folder for &quot;{moveItemTarget?.title}&quot;.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-5 space-y-1 max-h-64 overflow-y-auto">
                        <button
                            type="button"
                            onClick={() => moveItemTarget && void handleMoveToFolder(moveItemTarget, null)}
                            className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left body-sm text-ink hover:bg-surface-hover cursor-pointer"
                        >
                            <span className="flex items-center gap-2">
                                <FolderOpen size={15} className="text-muted" />
                                Unfiled
                            </span>
                            {moveItemTarget?.folderId === null && <Check size={14} className="text-brand" />}
                        </button>
                        {sourceFolders.map((folder) => (
                            <button
                                key={folder.id}
                                type="button"
                                onClick={() => moveItemTarget && void handleMoveToFolder(moveItemTarget, folder.id)}
                                className="flex w-full items-center justify-between rounded-sm px-3 py-2 text-left body-sm text-ink hover:bg-surface-hover cursor-pointer"
                            >
                                <span className="flex items-center gap-2 truncate">
                                    <FolderIcon size={15} className="text-muted" />
                                    <span className="truncate">{folder.name}</span>
                                </span>
                                {moveItemTarget?.folderId === folder.id && <Check size={14} className="text-brand" />}
                            </button>
                        ))}
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" size="sm" onClick={() => setMoveItemTarget(null)}>
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Material Confirmation Dialog */}
            <Dialog
                open={pendingDeleteItem !== null}
                onOpenChange={(open) => !open && !confirmBusy && setPendingDeleteItem(null)}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Delete this material?</DialogTitle>
                        <DialogDescription>
                            <span className="font-semibold text-ink">{pendingDeleteItem?.title}</span> and all of its{" "}
                            {pendingDeleteItem ? getItemUnitLabel(pendingDeleteItem.type, pendingDeleteItem.itemsCount) : "content"}{" "}
                            will be permanently deleted. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {confirmError && (
                        <div className="px-5 pt-2">
                            <p role="alert" className="body-sm text-danger-text rounded-xs bg-danger-subtle p-2">
                                {confirmError}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={confirmBusy}
                            onClick={() => {
                                setPendingDeleteItem(null);
                                setConfirmError(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            loading={confirmBusy}
                            onClick={() => void confirmDeleteItem()}
                        >
                            Delete material
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Folder Confirmation Dialog */}
            <Dialog
                open={pendingDeleteFolder !== null}
                onOpenChange={(open) => !open && !confirmBusy && setPendingDeleteFolder(null)}
            >
                <DialogContent size="sm">
                    <DialogHeader>
                        <DialogTitle>Delete this folder?</DialogTitle>
                        <DialogDescription>
                            Folder <span className="font-semibold text-ink">{pendingDeleteFolder?.name}</span> will be removed.
                            Materials inside this folder are <strong className="text-ink">not deleted</strong> — they will stay
                            in your library under Unfiled.
                        </DialogDescription>
                    </DialogHeader>
                    {confirmError && (
                        <div className="px-5 pt-2">
                            <p role="alert" className="body-sm text-danger-text rounded-xs bg-danger-subtle p-2">
                                {confirmError}
                            </p>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="secondary"
                            size="sm"
                            disabled={confirmBusy}
                            onClick={() => {
                                setPendingDeleteFolder(null);
                                setConfirmError(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="danger"
                            size="sm"
                            loading={confirmBusy}
                            onClick={() => void confirmDeleteFolder()}
                        >
                            Delete folder
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Share Modal */}
            {shareItem && (
                <ShareModal
                    isOpen={Boolean(shareItem)}
                    onClose={() => setShareItem(null)}
                    materialId={shareItem.id}
                    materialType={shareItem.type === "Flashcards" ? "flashcard_set" : "reviewer"}
                    materialTitle={shareItem.title}
                />
            )}
        </div>
    );
}
