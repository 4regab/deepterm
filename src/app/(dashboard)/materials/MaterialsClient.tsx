"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Search,
    MoreVertical,
    Clock,
    Trash2,
    Edit,
    FolderOpen,
    Plus
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useMaterialsStore } from "@/lib/stores";
import type { MaterialItem, MaterialFilter } from "@/lib/schemas/materials";

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
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-[#171d2b]/5 rounded-full flex items-center justify-center mb-6">
                <FolderOpen size={40} className="text-[#171d2b]/20" />
            </div>
            <h3 className="text-xl font-sora font-semibold text-[#171d2b] mb-2">No materials yet</h3>
            <p className="text-[#171d2b]/50 max-w-sm mb-6">Create your first study material to get started.</p>
            <button
                onClick={onCreateClick}
                className="px-6 py-3 bg-[#171d2b] text-white rounded-xl font-medium hover:bg-[#2a3347] transition-colors flex items-center gap-2"
            >
                <Plus size={18} />
                Create New Material
            </button>
        </div>
    );
}

import { useState } from "react";

export default function MaterialsClient({ initialItems }: MaterialsClientProps) {
    const router = useRouter();
    const [initialized, setInitialized] = useState(false);
    const {
        items,
        searchQuery,
        activeFilter,
        setSearchQuery,
        setActiveFilter,
        setItems
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

    return (
        <>
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#171d2b]/40" size={20} />
                    <input
                        type="text"
                        placeholder="Search by title..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#171d2b]/10 focus:border-[#171d2b] outline-none bg-white transition-all focus:shadow-sm"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                    {FILTERS.map((filter) => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-3 rounded-xl font-medium transition-all whitespace-nowrap ${activeFilter === filter
                                ? "bg-[#171d2b] text-white shadow-md"
                                : "bg-white text-[#171d2b]/60 hover:bg-[#171d2b]/5 hover:text-[#171d2b] border border-[#171d2b]/10"
                                }`}
                        >
                            {filter === "All" ? "All Items" : filter}
                        </button>
                    ))}
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
                                className="bg-white rounded-xl p-4 border border-[#171d2b]/5 hover:border-[#171d2b]/20 hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${item.type === "Reviewer"
                                        ? "bg-[#171d2b] text-white"
                                        : "bg-[#171d2b]/10 text-[#171d2b]"
                                        }`}>
                                        {item.type === "Flashcards" ? "Cards" : item.type} · {getItemLabel(item.type, item.itemsCount)}
                                    </span>
                                    <button
                                        className="p-1 rounded-full hover:bg-[#171d2b]/5 text-[#171d2b]/30 hover:text-[#171d2b] transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                        aria-label="More options"
                                    >
                                        <MoreVertical size={14} />
                                    </button>
                                </div>
                                <div className="mb-2">
                                    <h3 className="font-sora font-semibold text-sm text-[#171d2b] line-clamp-2">{item.title}</h3>
                                </div>
                                <div className="flex items-center justify-between text-[#171d2b]/40 text-xs">
                                    <div className="flex items-center gap-1">
                                        <Clock size={12} />
                                        <span>{item.lastAccessed}</span>
                                    </div>
                                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            className="hover:text-blue-600 transition-colors"
                                            title="Edit"
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label="Edit"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            className="hover:text-red-500 transition-colors"
                                            title="Delete"
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            ) : (
                <EmptyState onCreateClick={handleCreateClick} />
            )}
        </>
    );
}
