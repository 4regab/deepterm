"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    MoreVertical,
    Clock,
    Trash2,
    FolderOpen,
    Folder,
    Share2,
    Filter,
    ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMaterialsStore } from "@/lib/stores";
import type { MaterialItem, MaterialFilter } from "@/lib/schemas/materials";
import { EmptyState as EmptyStateBlock } from "@/components/ui";
import { matchesMaterialFilter, selectMaterialSourceItems } from "@/utils/materialFilter";
import {
    groupMaterialsByFolder,
    hasAnyFolder,
    listFolders,
    matchesFolderFilter,
    sanitizeFolder,
    UNCATEGORIZED_FOLDER,
} from "@/utils/materialFolder";
import { isMissingColumnError } from "@/utils/optionalColumn";

interface MaterialsClientProps {
    initialItems: MaterialItem[];
}

const FILTERS: MaterialFilter[] = ["All", "Cards", "Reviewer"];
const ALL_FOLDERS_VALUE = "__all__";

function getItemLabel(type: MaterialItem["type"], count: number): string {
    if (type === "Reviewer") return `${count} terms`;
    return `${count} cards`;
}

function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
    return (
        <EmptyStateBlock
            icon={<FolderOpen size={28} />}
            title="No materials yet"
            description="Upload a PDF or paste notes to make your first deck or reviewer."
            actionLabel="Create material"
            onAction={onCreateClick}
        />
    );
}

import { useState } from "react";
import ShareModal from "@/components/ShareModal";
import { createClient } from "@/config/supabase/client";

function FolderFilterSelect({
    folders,
    activeFolder,
    onChange,
}: {
    folders: string[];
    activeFolder: string | null;
    onChange: (folder: string | null) => void;
}) {
    return (
        <select
            aria-label="Filter by folder"
            value={activeFolder === null ? ALL_FOLDERS_VALUE : activeFolder}
            onChange={(event) => {
                const value = event.target.value;
                onChange(value === ALL_FOLDERS_VALUE ? null : value);
            }}
            className="px-3 py-3 rounded-xl border border-border bg-white text-muted-foreground text-sm outline-none focus:border-primary"
        >
            <option value={ALL_FOLDERS_VALUE}>All folders</option>
            {folders.map((folder) => (
                <option key={folder} value={folder}>{folder}</option>
            ))}
            <option value={UNCATEGORIZED_FOLDER}>Uncategorized</option>
        </select>
    );
}

export default function MaterialsClient({ initialItems }: MaterialsClientProps) {
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [shareItem, setShareItem] = useState<MaterialItem | null>(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
    const [folderDraft, setFolderDraft] = useState("");
    const {
        items,
        searchQuery,
        activeFilter,
        activeFolder,
        setSearchQuery,
        setActiveFilter,
        setActiveFolder,
        setItems,
        removeItem,
        updateItemFolder,
    } = useMaterialsStore();

    if (!initialized) {
        setItems(initialItems);
        setInitialized(true);
    }

    const sourceItems = selectMaterialSourceItems(initialized, items, initialItems);
    const folders = listFolders(sourceItems);
    const showFolderUi = hasAnyFolder(sourceItems);

    const filteredItems = sourceItems.filter((item: MaterialItem) => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = matchesMaterialFilter(item.type, activeFilter);
        const matchesFolder = matchesFolderFilter(item.folder, activeFolder);
        return matchesSearch && matchesFilter && matchesFolder;
    });

    const groupedItems = showFolderUi
        ? groupMaterialsByFolder(filteredItems)
        : [{ key: "all", folder: null as string | null, items: filteredItems }];

    const handleCreateClick = () => router.push("/materials/create");

    const handleDelete = async (item: MaterialItem) => {
        const supabase = createClient();
        const table = item.type === "Flashcards" ? "flashcard_sets" : "reviewers";
        const { error } = await supabase.from(table).delete().eq("id", item.id);
        if (!error) {
            removeItem(item.id);
        }
    };

    const handleSaveFolder = async (item: MaterialItem) => {
        const folder = sanitizeFolder(folderDraft);
        const supabase = createClient();
        const table = item.type === "Flashcards" ? "flashcard_sets" : "reviewers";
        const { error } = await supabase.from(table).update({ folder } as never).eq("id", item.id);
        if (error && !isMissingColumnError(error, "folder")) {
            setEditingFolderId(null);
            return;
        }
        updateItemFolder(item.id, folder);
        setEditingFolderId(null);
    };

    const renderCard = (item: MaterialItem) => (
        <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            whileHover={{ y: -4 }}
            onClick={() => router.push(`/materials/${item.id}`)}
            className="bg-white rounded-xl p-4 border border-border hover:border-border hover:shadow-lg transition-all cursor-pointer group"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${item.type === "Reviewer"
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground"
                    }`}>
                    {item.type === "Flashcards" ? "Cards" : item.type} · {getItemLabel(item.type, item.itemsCount)}
                </span>
                <div className="relative">
                    <button
                        className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(openMenuId === item.id ? null : item.id);
                        }}
                        aria-label="More options"
                    >
                        <MoreVertical size={14} />
                    </button>
                    {openMenuId === item.id && (
                        <div
                            className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-border py-1 z-50 min-w-[120px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setFolderDraft(item.folder ?? "");
                                    setEditingFolderId(item.id);
                                }}
                            >
                                <Folder size={14} />
                                Folder
                            </button>
                            <button
                                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    setShareItem(item);
                                }}
                            >
                                <Share2 size={14} />
                                Share
                            </button>
                            <button
                                className="w-full px-3 py-2 text-left text-sm text-foreground hover:bg-accent flex items-center gap-2"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                    handleDelete(item);
                                }}
                            >
                                <Trash2 size={14} />
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="mb-2">
                <h3 className="font-sans font-medium text-sm text-foreground line-clamp-2">{item.title}</h3>
            </div>
            {editingFolderId === item.id ? (
                <form
                    className="mb-2"
                    onClick={(event) => event.stopPropagation()}
                    onSubmit={(event) => {
                        event.preventDefault();
                        void handleSaveFolder(item);
                    }}
                >
                    <input
                        autoFocus
                        type="text"
                        value={folderDraft}
                        maxLength={40}
                        placeholder="Folder name"
                        onChange={(event) => setFolderDraft(event.target.value)}
                        onBlur={() => void handleSaveFolder(item)}
                        className="w-full px-2 py-1.5 rounded-md border border-border text-xs outline-none focus:border-primary"
                    />
                </form>
            ) : item.folder ? (
                <div className="flex items-center gap-1 text-muted-foreground text-xs mb-2">
                    <Folder size={12} />
                    <span className="truncate">{item.folder}</span>
                </div>
            ) : null}
            <div className="flex items-center text-muted-foreground text-xs">
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{item.lastAccessed}</span>
                </div>
            </div>
        </motion.div>
    );

    return (
        <>
            <div className="flex flex-col gap-4 mb-8">
                {/* Mobile: Search + Filter dropdown */}
                <div className="flex gap-2 md:hidden">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-3 rounded-xl border border-border focus:border-primary outline-none bg-white transition-all focus:shadow-sm text-sm"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className="flex items-center gap-1 px-3 py-3 rounded-xl border border-border bg-white text-muted-foreground text-sm"
                        >
                            <Filter size={16} />
                            <ChevronDown size={14} />
                        </button>
                        {showFilterMenu && (
                            <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-border py-1 z-50 min-w-[120px]">
                                {FILTERS.map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => {
                                            setActiveFilter(filter);
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 ${activeFilter === filter
                                            ? "bg-muted text-foreground font-medium"
                                            : "text-muted-foreground hover:bg-accent"
                                            }`}
                                    >
                                        {filter === "All" ? "All Items" : filter}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {showFolderUi && (
                        <FolderFilterSelect
                            folders={folders}
                            activeFolder={activeFolder}
                            onChange={setActiveFolder}
                        />
                    )}
                </div>
                {/* Desktop: Search + Filter buttons in same row */}
                <div className="hidden md:flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
                        <input
                            type="text"
                            placeholder="Search by title..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-xl border border-border focus:border-primary outline-none bg-white transition-all focus:shadow-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        {FILTERS.map((filter) => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeFilter === filter
                                    ? "bg-primary text-white shadow-md"
                                    : "bg-white text-muted-foreground hover:bg-accent hover:text-foreground border border-border"
                                    }`}
                            >
                                {filter === "All" ? "All Items" : filter}
                            </button>
                        ))}
                        {showFolderUi && (
                            <FolderFilterSelect
                                folders={folders}
                                activeFolder={activeFolder}
                                onChange={setActiveFolder}
                            />
                        )}
                    </div>
                </div>
            </div>

            {filteredItems.length > 0 ? (
                <div className="flex flex-col gap-8">
                    {groupedItems.map((group) => (
                        <section key={group.key || "uncategorized"}>
                            {showFolderUi && (
                                <h2 className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3">
                                    <Folder size={14} />
                                    {group.folder ?? "Uncategorized"}
                                </h2>
                            )}
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <AnimatePresence mode="sync">
                                    {group.items.map((item: MaterialItem) => renderCard(item))}
                                </AnimatePresence>
                            </div>
                        </section>
                    ))}
                </div>
            ) : (
                <EmptyState onCreateClick={handleCreateClick} />
            )}

            {shareItem && (
                <ShareModal
                    isOpen={!!shareItem}
                    onClose={() => setShareItem(null)}
                    materialId={shareItem.id}
                    materialType={shareItem.type === "Flashcards" ? "flashcard_set" : "reviewer"}
                    materialTitle={shareItem.title}
                />
            )}
        </>
    );
}
