"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    MoreVertical,
    Clock,
    Trash2,
    FolderOpen,
    Share2,
    Filter,
    ChevronDown
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMaterialsStore } from "@/lib/stores";
import type { MaterialItem, MaterialFilter } from "@/lib/schemas/materials";
import { EmptyState as EmptyStateBlock } from "@/components/ui";

interface MaterialsClientProps {
    initialItems: MaterialItem[];
}

const FILTERS: MaterialFilter[] = ["All", "Cards", "Reviewer"];

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

export default function MaterialsClient({ initialItems }: MaterialsClientProps) {
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [shareItem, setShareItem] = useState<MaterialItem | null>(null);
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const {
        items,
        searchQuery,
        activeFilter,
        setSearchQuery,
        setActiveFilter,
        setItems,
        removeItem
    } = useMaterialsStore();

    // Initialize store with server data (one-time, synchronously during render)
    if (!initialized && initialItems.length > 0) {
        setItems(initialItems);
        setInitialized(true);
    }

    // Use initialItems for first render to avoid hydration mismatch
    const sourceItems = items.length > 0 ? items : initialItems;

    // Apply filters locally
    const filteredItems = sourceItems.filter((item: MaterialItem) => {
        const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = activeFilter === 'All' ||
            (activeFilter === 'Cards' && item.type === 'Flashcards') ||
            item.type === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const handleCreateClick = () => router.push("/materials/create");

    const handleDelete = async (item: MaterialItem) => {
        const supabase = createClient();
        const table = item.type === "Flashcards" ? "flashcard_sets" : "reviewers";
        await supabase.from(table).delete().eq("id", item.id);
        removeItem(item.id);
    };

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
                    </div>
                </div>
            </div>

            {filteredItems.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    <AnimatePresence mode="sync">
                        {filteredItems.map((item: MaterialItem) => (
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
                                <div className="flex items-center text-muted-foreground text-xs">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>{item.lastAccessed}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
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
