"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
    ArrowLeft,
    Share2,
    Edit,
    Trash2,
    Plus,
    X,
    Check,
    GripVertical,
    Download,
    Loader2,
    ChevronDown,
    ChevronUp,
    Copy,
    Search
} from "lucide-react";
import { exportToPDF, exportToDOCX } from "@/utils/exportReviewer";
import Link from "next/link";
import {
    FlashcardsIcon,
    LearnIcon,
    PracticeIcon,
    MatchIcon
} from "@/components/StudyIcons";
import StudyingProgress from "@/components/StudyingProgress";
import ShareModal from "@/components/ShareModal";
import { createClient } from "@/config/supabase/client";

type LearnStage = 'new' | 'learning' | 'review' | 'mastered';

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
}

type FlashcardProps = {
    materialType: 'flashcard';
    material: MaterialData;
    initialTerms: Term[];
    initialCategories?: never;
};

type ReviewerProps = {
    materialType: 'reviewer';
    material: MaterialData;
    initialCategories: ReviewerCategory[];
    initialTerms?: never;
};

type Props = FlashcardProps | ReviewerProps;

const StudyToolButton = ({ title, icon: Icon, href }: {
    title: string;
    icon: React.ComponentType<{ className?: string }>;
    href: string;
}) => (
    <Link href={href} className="group">
        <div className="flex items-center gap-3 px-4 py-3 bg-white rounded-xl border border-[#171d2b]/5 hover:border-[#171d2b]/20 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-lg bg-[#171d2b] flex items-center justify-center group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5 text-white" />
            </div>
            <span className="font-sora font-medium text-[#171d2b] text-sm">{title}</span>
        </div>
    </Link>
);

const TermItem = ({ term, onEdit, onDelete, isEditing, onSave, onCancel, editData, setEditData }: {
    term: Term;
    onEdit: () => void;
    onDelete: () => void;
    isEditing: boolean;
    onSave: () => void;
    onCancel: () => void;
    editData: { front: string; back: string };
    setEditData: (data: { front: string; back: string }) => void;
}) => {
    if (isEditing) {
        return (
            <div className="px-4 py-3 bg-[#f0f0ea]/50 border-b border-[#171d2b]/5">
                <div className="flex flex-col md:flex-row gap-3">
                    <input type="text" value={editData.front} onChange={(e) => setEditData({ ...editData, front: e.target.value })} placeholder="Term" className="flex-1 px-3 py-2 rounded-lg border border-[#171d2b]/10 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 text-sm bg-white" />
                    <input type="text" value={editData.back} onChange={(e) => setEditData({ ...editData, back: e.target.value })} placeholder="Definition" className="flex-[2] px-3 py-2 rounded-lg border border-[#171d2b]/10 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 text-sm bg-white" />
                    <div className="flex gap-2">
                        <button onClick={onSave} className="p-2 rounded-lg bg-[#171d2b] text-white hover:bg-[#2a3347] transition-colors"><Check size={16} /></button>
                        <button onClick={onCancel} className="p-2 rounded-lg bg-[#171d2b]/10 text-[#171d2b] hover:bg-[#171d2b]/20 transition-colors"><X size={16} /></button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <Reorder.Item value={term} id={term.id} className="px-4 py-3 hover:bg-[#f0f0ea]/30 transition-colors flex items-center gap-3 border-b border-[#171d2b]/5 group bg-white cursor-grab active:cursor-grabbing">
            <div className="text-[#171d2b]/30 flex-shrink-0 hover:text-[#171d2b]/60 transition-colors"><GripVertical size={16} /></div>
            <div className="flex-1 min-w-0"><p className="text-[#171d2b] font-medium text-sm truncate">{term.front}</p></div>
            <div className="hidden md:block flex-[2] min-w-0 border-l border-[#171d2b]/5 pl-4"><p className="text-[#171d2b]/60 text-sm truncate">{term.back}</p></div>
            <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-[#171d2b]/5 text-[#171d2b]/50 hover:text-[#171d2b]"><Edit size={14} /></button>
                <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-[#171d2b]/50 hover:text-red-500"><Trash2 size={14} /></button>
            </div>
        </Reorder.Item>
    );
};

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

const ReviewerDisplay = ({ categories, expandedCategories, toggleCategory, filterText, setFilterText, onEditTerm, onDeleteTerm, onAddTerm, onDeleteCategory }: {
    categories: ReviewerCategory[];
    expandedCategories: string[];
    toggleCategory: (id: string) => void;
    filterText: string;
    setFilterText: (text: string) => void;
    onEditTerm: (categoryId: string, termId: string, term: string, definition: string) => void;
    onDeleteTerm: (categoryId: string, termId: string) => void;
    onAddTerm: (categoryId: string, term: string, definition: string) => void;
    onDeleteCategory: (categoryId: string) => void;
}) => {
    const [editingTermId, setEditingTermId] = useState<string | null>(null);
    const [editTermData, setEditTermData] = useState({ term: '', definition: '' });
    const [addingToCategoryId, setAddingToCategoryId] = useState<string | null>(null);
    const [newTermData, setNewTermData] = useState({ term: '', definition: '' });

    const filteredCategories = categories.map(cat => ({
        ...cat,
        terms: cat.terms.filter(t =>
            t.term.toLowerCase().includes(filterText.toLowerCase()) ||
            t.definition.toLowerCase().includes(filterText.toLowerCase())
        )
    })).filter(cat => cat.terms.length > 0 || !filterText);

    const handleStartEdit = (term: ReviewerTerm) => {
        setEditingTermId(term.id);
        setEditTermData({ term: term.term, definition: term.definition });
    };

    const handleSaveEdit = (categoryId: string) => {
        if (editingTermId && editTermData.term.trim() && editTermData.definition.trim()) {
            onEditTerm(categoryId, editingTermId, editTermData.term, editTermData.definition);
            setEditingTermId(null);
            setEditTermData({ term: '', definition: '' });
        }
    };

    const handleCancelEdit = () => {
        setEditingTermId(null);
        setEditTermData({ term: '', definition: '' });
    };

    const handleAddTerm = (categoryId: string) => {
        if (newTermData.term.trim() && newTermData.definition.trim()) {
            onAddTerm(categoryId, newTermData.term, newTermData.definition);
            setAddingToCategoryId(null);
            setNewTermData({ term: '', definition: '' });
        }
    };

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#171d2b]/40" size={18} />
                <input
                    type="text"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter terms..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#171d2b]/10 focus:border-[#171d2b] outline-none bg-white transition-all focus:shadow-sm text-sm"
                />
            </div>

            <div className="space-y-4">
                {filteredCategories.map(category => (
                    <motion.div
                        key={category.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl border border-[#171d2b]/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div
                            onClick={() => toggleCategory(category.id)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                            style={{ borderLeft: `4px solid ${category.color}` }}
                        >
                            <div className="flex items-center gap-4">
                                <h3 className="font-sora font-semibold text-[#171d2b]">{category.name}</h3>
                                <span className="px-2 py-0.5 rounded-full bg-[#171d2b]/5 text-xs font-medium text-[#171d2b]/60">
                                    {category.terms.length} terms
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setAddingToCategoryId(addingToCategoryId === category.id ? null : category.id);
                                        setNewTermData({ term: '', definition: '' });
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-[#171d2b]/10 text-[#171d2b]/50 hover:text-[#171d2b] transition-colors"
                                    title="Add term"
                                >
                                    <Plus size={16} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete "${category.name}" and all its terms?`)) {
                                            onDeleteCategory(category.id);
                                        }
                                    }}
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-[#171d2b]/50 hover:text-red-500 transition-colors"
                                    title="Delete category"
                                >
                                    <Trash2 size={16} />
                                </button>
                                {expandedCategories.includes(category.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </div>
                        </div>
                        <AnimatePresence>
                            {expandedCategories.includes(category.id) && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="border-t border-[#171d2b]/5"
                                >
                                    {addingToCategoryId === category.id && (
                                        <div className="p-4 bg-[#171d2b]/5 border-b border-[#171d2b]/10">
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    type="text"
                                                    value={newTermData.term}
                                                    onChange={(e) => setNewTermData({ ...newTermData, term: e.target.value })}
                                                    placeholder="Term"
                                                    className="w-full px-3 py-2 rounded-lg border border-[#171d2b]/10 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 text-sm bg-white"
                                                    autoFocus
                                                />
                                                <textarea
                                                    value={newTermData.definition}
                                                    onChange={(e) => setNewTermData({ ...newTermData, definition: e.target.value })}
                                                    placeholder="Definition"
                                                    rows={2}
                                                    className="w-full px-3 py-2 rounded-lg border border-[#171d2b]/10 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 text-sm bg-white resize-none"
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button
                                                        onClick={() => { setAddingToCategoryId(null); setNewTermData({ term: '', definition: '' }); }}
                                                        className="px-3 py-1.5 rounded-lg bg-[#171d2b]/10 text-[#171d2b] text-sm hover:bg-[#171d2b]/20 transition-colors"
                                                    >
                                                        Cancel
                                                    </button>
                                                    <button
                                                        onClick={() => handleAddTerm(category.id)}
                                                        disabled={!newTermData.term.trim() || !newTermData.definition.trim()}
                                                        className="px-3 py-1.5 rounded-lg bg-[#171d2b] text-white text-sm hover:bg-[#2a3347] transition-colors disabled:opacity-50"
                                                    >
                                                        Add Term
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div className="p-4 grid gap-4 grid-cols-1 lg:grid-cols-2">
                                        {category.terms.map(term => (
                                            <div key={term.id} className="p-4 rounded-xl bg-[#f8f9fa] border border-[#171d2b]/5 hover:border-[#171d2b]/20 transition-colors group relative">
                                                {editingTermId === term.id ? (
                                                    <div className="flex flex-col gap-2">
                                                        <input
                                                            type="text"
                                                            value={editTermData.term}
                                                            onChange={(e) => setEditTermData({ ...editTermData, term: e.target.value })}
                                                            className="w-full px-3 py-2 rounded-lg border border-[#171d2b]/10 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 text-sm bg-white font-bold"
                                                            autoFocus
                                                        />
                                                        <textarea
                                                            value={editTermData.definition}
                                                            onChange={(e) => setEditTermData({ ...editTermData, definition: e.target.value })}
                                                            rows={3}
                                                            className="w-full px-3 py-2 rounded-lg border border-[#171d2b]/10 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 text-sm bg-white resize-none"
                                                        />
                                                        <div className="flex gap-2 justify-end">
                                                            <button onClick={handleCancelEdit} className="p-1.5 rounded-lg bg-[#171d2b]/10 text-[#171d2b] hover:bg-[#171d2b]/20 transition-colors">
                                                                <X size={14} />
                                                            </button>
                                                            <button onClick={() => handleSaveEdit(category.id)} className="p-1.5 rounded-lg bg-[#171d2b] text-white hover:bg-[#2a3347] transition-colors">
                                                                <Check size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-bold text-[#171d2b] pr-16">{term.term}</h4>
                                                            <div className="absolute top-4 right-4 flex gap-1 md:opacity-0 md:group-hover:opacity-100 transition-all">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleStartEdit(term); }}
                                                                    className="p-1.5 hover:bg-[#171d2b]/10 rounded-lg text-[#171d2b]/40 hover:text-[#171d2b] transition-colors"
                                                                    title="Edit"
                                                                >
                                                                    <Edit size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(`${term.term}: ${term.definition}`); }}
                                                                    className="p-1.5 hover:bg-[#171d2b]/10 rounded-lg text-[#171d2b]/40 hover:text-[#171d2b] transition-colors"
                                                                    title="Copy"
                                                                >
                                                                    <Copy size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); onDeleteTerm(category.id, term.id); }}
                                                                    className="p-1.5 hover:bg-red-50 rounded-lg text-[#171d2b]/40 hover:text-red-500 transition-colors"
                                                                    title="Delete"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="text-[#171d2b]/80 text-sm leading-relaxed">{term.definition}</p>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                ))}
            </div>

            {categories.length === 0 && (
                <div className="bg-white rounded-xl border border-[#171d2b]/5 shadow-sm p-10 text-center">
                    <p className="text-[#171d2b]/50 text-sm">No categories yet.</p>
                </div>
            )}

            {filterText && filteredCategories.length === 0 && categories.length > 0 && (
                <div className="bg-white rounded-xl border border-[#171d2b]/5 shadow-sm p-10 text-center">
                    <p className="text-[#171d2b]/50 text-sm">No terms match &quot;{filterText}&quot;</p>
                </div>
            )}
        </div>
    );
};

export default function MaterialDetailClient(props: Props) {
    const { materialType, material } = props;
    const router = useRouter();
    const [terms, setTerms] = useState<Term[]>(props.materialType === 'flashcard' ? props.initialTerms : []);
    const [categories, setCategories] = useState<ReviewerCategory[]>(props.materialType === 'reviewer' ? props.initialCategories : []);
    const [expandedCategories, setExpandedCategories] = useState<string[]>(props.materialType === 'reviewer' ? props.initialCategories.map(c => c.id) : []);
    const [filterText, setFilterText] = useState("");

    // Refresh flashcard statuses on mount to get latest progress after study sessions
    useSyncExternalStore(
        useCallback(() => {
            if (materialType !== 'flashcard') return () => {};
            let mounted = true;
            const refresh = async () => {
                const supabase = createClient();
                const { data } = await supabase
                    .from("flashcards")
                    .select("id, front, back, status")
                    .eq("set_id", material.id)
                    .order("created_at");
                if (data && mounted) {
                    setTerms(data.map(card => ({
                        id: card.id,
                        front: card.front,
                        back: card.back,
                        stage: (card.status || 'new') as LearnStage,
                    })));
                }
            };
            refresh();
            return () => { mounted = false; };
        }, [materialType, material.id]),
        () => null,
        () => null
    );
    
    const toggleCategory = (id: string) => {
        setExpandedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
    };
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editData, setEditData] = useState({ front: '', back: '' });
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newTerm, setNewTerm] = useState({ front: '', back: '' });
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = useCallback((term: Term) => {
        setEditingId(term.id);
        setEditData({ front: term.front, back: term.back });
    }, []);

    const handleSaveEdit = useCallback(async () => {
        if (!editingId || !editData.front.trim() || !editData.back.trim()) return;
        const supabase = createClient();
        await supabase.from("flashcards").update({ front: editData.front, back: editData.back }).eq("id", editingId);
        setTerms(prev => prev.map(t => t.id === editingId ? { ...t, front: editData.front, back: editData.back } : t));
        setEditingId(null);
        setEditData({ front: '', back: '' });
    }, [editingId, editData]);

    const handleCancelEdit = useCallback(() => {
        setEditingId(null);
        setEditData({ front: '', back: '' });
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        const supabase = createClient();
        await supabase.from("flashcards").delete().eq("id", id);
        setTerms(prev => prev.filter(t => t.id !== id));
    }, []);

    const handleAddNew = useCallback(async () => {
        if (!newTerm.front.trim() || !newTerm.back.trim()) return;
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: newCard } = await supabase.from("flashcards").insert({ set_id: material.id, user_id: user.id, front: newTerm.front, back: newTerm.back }).select().single();
        if (newCard) setTerms(prev => [...prev, { id: newCard.id, front: newCard.front, back: newCard.back, stage: 'new' }]);
        setNewTerm({ front: '', back: '' });
        setIsAddingNew(false);
    }, [newTerm, material.id]);

    const handleDeleteSet = useCallback(async () => {
        setIsDeleting(true);
        const supabase = createClient();
        const table = materialType === 'flashcard' ? "flashcard_sets" : "reviewers";
        await supabase.from(table).delete().eq("id", material.id);
        router.push("/materials");
    }, [material.id, router, materialType]);

    const handleEditReviewerTerm = useCallback(async (categoryId: string, termId: string, term: string, definition: string) => {
        const supabase = createClient();
        await supabase.from("reviewer_terms").update({ term, definition }).eq("id", termId);
        setCategories(prev => prev.map(cat => 
            cat.id === categoryId 
                ? { ...cat, terms: cat.terms.map(t => t.id === termId ? { ...t, term, definition } : t) }
                : cat
        ));
    }, []);

    const handleDeleteReviewerTerm = useCallback(async (categoryId: string, termId: string) => {
        const supabase = createClient();
        await supabase.from("reviewer_terms").delete().eq("id", termId);
        setCategories(prev => prev.map(cat => 
            cat.id === categoryId 
                ? { ...cat, terms: cat.terms.filter(t => t.id !== termId) }
                : cat
        ));
    }, []);

    const handleAddReviewerTerm = useCallback(async (categoryId: string, term: string, definition: string) => {
        const supabase = createClient();
        const { data: newTerm } = await supabase
            .from("reviewer_terms")
            .insert({ category_id: categoryId, term, definition })
            .select()
            .single();
        if (newTerm) {
            setCategories(prev => prev.map(cat => 
                cat.id === categoryId 
                    ? { ...cat, terms: [...cat.terms, { id: newTerm.id, term: newTerm.term, definition: newTerm.definition }] }
                    : cat
            ));
        }
    }, []);

    const handleDeleteCategory = useCallback(async (categoryId: string) => {
        const supabase = createClient();
        await supabase.from("reviewer_categories").delete().eq("id", categoryId);
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        setExpandedCategories(prev => prev.filter(id => id !== categoryId));
    }, []);

    return (
        <div className="w-full">
            <ShareModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                materialId={material.id}
                materialType={materialType === 'flashcard' ? "flashcard_set" : "reviewer"}
                materialTitle={material.title}
            />
            <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                    <button onClick={() => router.back()} className="flex items-center gap-2 text-[#171d2b]/50 hover:text-[#171d2b] transition-colors">
                        <ArrowLeft size={16} /><span className="font-sans text-sm">Back to Materials</span>
                    </button>
                    <div className="flex gap-2 md:hidden">
                        {materialType === 'reviewer' && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                    className="p-2 rounded-lg border border-[#171d2b]/10 hover:bg-[#171d2b]/5 text-[#171d2b]/60 transition-colors" 
                                    title="Download"
                                >
                                    <Download size={18} />
                                </button>
                                {showDownloadMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                                        <div className="absolute right-0 top-full mt-1 z-50">
                                            <div className="bg-white rounded-lg border border-[#171d2b]/10 shadow-lg py-1 min-w-[140px]">
                                                <button 
                                                    onClick={() => { 
                                                        const exportCategories = categories.map(c => ({
                                                            name: c.name,
                                                            terms: c.terms.map(t => ({ front: t.term, back: t.definition }))
                                                        }));
                                                        exportToPDF({ title: material.title, terms: [], categories: exportCategories });
                                                        setShowDownloadMenu(false);
                                                    }} 
                                                    className="w-full px-4 py-2 text-left text-sm text-[#171d2b] hover:bg-[#171d2b]/5 transition-colors"
                                                >
                                                    Download PDF
                                                </button>
                                                <button 
                                                    onClick={() => { 
                                                        const exportCategories = categories.map(c => ({
                                                            name: c.name,
                                                            terms: c.terms.map(t => ({ front: t.term, back: t.definition }))
                                                        }));
                                                        exportToDOCX({ title: material.title, terms: [], categories: exportCategories });
                                                        setShowDownloadMenu(false);
                                                    }} 
                                                    className="w-full px-4 py-2 text-left text-sm text-[#171d2b] hover:bg-[#171d2b]/5 transition-colors"
                                                >
                                                    Download DOCX
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        <button onClick={() => setShowShareModal(true)} className="p-2 rounded-lg border border-[#171d2b]/10 hover:bg-[#171d2b]/5 text-[#171d2b]/60 transition-colors" title="Share"><Share2 size={18} /></button>
                        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-lg border border-[#171d2b]/10 hover:bg-red-50 hover:border-red-200 text-red-500 transition-colors" title="Delete"><Trash2 size={18} /></button>
                    </div>
                </div>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-sora font-bold text-[#171d2b] mb-1">{material.title}</h1>
                        <div className="flex flex-wrap items-center gap-2 text-[#171d2b]/50 text-xs">
                            <span>{materialType === 'flashcard' ? terms.length : categories.reduce((sum, c) => sum + c.terms.length, 0)} terms</span><span>•</span><span>Last updated {formatTimeAgo(new Date(material.updated_at))}</span>
                        </div>
                    </div>
                    <div className="hidden md:flex gap-2">
                        {materialType === 'reviewer' && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                    className="p-2 rounded-lg border border-[#171d2b]/10 hover:bg-[#171d2b]/5 text-[#171d2b]/60 transition-colors" 
                                    title="Download"
                                >
                                    <Download size={18} />
                                </button>
                                {showDownloadMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowDownloadMenu(false)} />
                                        <div className="absolute right-0 top-full mt-1 z-50">
                                            <div className="bg-white rounded-lg border border-[#171d2b]/10 shadow-lg py-1 min-w-[140px]">
                                                <button 
                                                    onClick={() => { 
                                                        const exportCategories = categories.map(c => ({
                                                            name: c.name,
                                                            terms: c.terms.map(t => ({ front: t.term, back: t.definition }))
                                                        }));
                                                        exportToPDF({ title: material.title, terms: [], categories: exportCategories });
                                                        setShowDownloadMenu(false);
                                                    }} 
                                                    className="w-full px-4 py-2 text-left text-sm text-[#171d2b] hover:bg-[#171d2b]/5 transition-colors"
                                                >
                                                    Download PDF
                                                </button>
                                                <button 
                                                    onClick={() => { 
                                                        const exportCategories = categories.map(c => ({
                                                            name: c.name,
                                                            terms: c.terms.map(t => ({ front: t.term, back: t.definition }))
                                                        }));
                                                        exportToDOCX({ title: material.title, terms: [], categories: exportCategories });
                                                        setShowDownloadMenu(false);
                                                    }} 
                                                    className="w-full px-4 py-2 text-left text-sm text-[#171d2b] hover:bg-[#171d2b]/5 transition-colors"
                                                >
                                                    Download DOCX
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                        <button onClick={() => setShowShareModal(true)} className="p-2 rounded-lg border border-[#171d2b]/10 hover:bg-[#171d2b]/5 text-[#171d2b]/60 transition-colors" title="Share"><Share2 size={18} /></button>
                        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-lg border border-[#171d2b]/10 hover:bg-red-50 hover:border-red-200 text-red-500 transition-colors" title="Delete"><Trash2 size={18} /></button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6">
                        <h2 className="font-sora font-bold text-lg text-[#171d2b] mb-2">Delete {materialType === 'flashcard' ? 'Flashcard Set' : 'Reviewer'}?</h2>
                        <p className="text-[#171d2b]/60 text-sm mb-6">
                            This will permanently delete &quot;{material.title}&quot; and all its {materialType === 'flashcard' ? 'flashcards' : 'terms'}. This action cannot be undone.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                disabled={isDeleting}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteSet}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {materialType === 'flashcard' && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        <StudyToolButton title="Flashcards" icon={FlashcardsIcon} href={`/materials/${material.id}/flashcards`} />
                        <StudyToolButton title="Learn" icon={LearnIcon} href={`/materials/${material.id}/learn`} />
                        <StudyToolButton title="Practice" icon={PracticeIcon} href={`/materials/${material.id}/practice`} />
                        <StudyToolButton title="Match" icon={MatchIcon} href={`/materials/${material.id}/match`} />
                    </div>

                    <StudyingProgress items={terms.map(t => ({ id: t.id, status: t.stage === 'review' ? 'almost_done' : t.stage }))} className="mb-5" />

                    <div className="bg-white rounded-xl border border-[#171d2b]/5 shadow-sm overflow-hidden">
                        <div className="px-4 py-3 border-b border-[#171d2b]/5 flex items-center justify-between">
                            <h3 className="font-sora font-semibold text-[#171d2b] text-sm">Terms ({terms.length})</h3>
                            <button onClick={() => setIsAddingNew(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#171d2b] text-white text-xs font-medium hover:bg-[#2a3347] transition-colors"><Plus size={14} />Add Term</button>
                        </div>

                        <AnimatePresence>
                            {isAddingNew && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="px-4 py-3 bg-[#171d2b]/5 border-b border-[#171d2b]/5">
                                        <div className="flex flex-col md:flex-row gap-2">
                                            <input type="text" value={newTerm.front} onChange={(e) => setNewTerm({ ...newTerm, front: e.target.value })} placeholder="Enter term" className="flex-1 px-3 py-2 rounded-lg border border-[#171d2b]/10 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 text-sm bg-white" autoFocus />
                                            <input type="text" value={newTerm.back} onChange={(e) => setNewTerm({ ...newTerm, back: e.target.value })} placeholder="Enter definition" className="flex-[2] px-3 py-2 rounded-lg border border-[#171d2b]/10 focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 text-sm bg-white" />
                                            <div className="flex gap-2">
                                                <button onClick={handleAddNew} disabled={!newTerm.front.trim() || !newTerm.back.trim()} className="px-3 py-2 rounded-lg bg-[#171d2b] text-white text-sm font-medium hover:bg-[#2a3347] transition-colors disabled:opacity-50">Add</button>
                                                <button onClick={() => { setIsAddingNew(false); setNewTerm({ front: '', back: '' }); }} className="p-2 rounded-lg bg-[#171d2b]/10 text-[#171d2b] hover:bg-[#171d2b]/20 transition-colors"><X size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <Reorder.Group axis="y" values={terms} onReorder={setTerms} className="divide-y divide-[#171d2b]/5">
                            {terms.map((term) => (
                                <TermItem key={term.id} term={term} onEdit={() => handleEdit(term)} onDelete={() => handleDelete(term.id)} isEditing={editingId === term.id} onSave={handleSaveEdit} onCancel={handleCancelEdit} editData={editData} setEditData={setEditData} />
                            ))}
                        </Reorder.Group>

                        {terms.length === 0 && <div className="p-10 text-center"><p className="text-[#171d2b]/50 text-sm">No terms yet. Add your first term to get started.</p></div>}
                    </div>
                </>
            )}

            {materialType === 'reviewer' && (
                <ReviewerDisplay 
                    categories={categories} 
                    expandedCategories={expandedCategories} 
                    toggleCategory={toggleCategory} 
                    filterText={filterText} 
                    setFilterText={setFilterText}
                    onEditTerm={handleEditReviewerTerm}
                    onDeleteTerm={handleDeleteReviewerTerm}
                    onAddTerm={handleAddReviewerTerm}
                    onDeleteCategory={handleDeleteCategory}
                />
            )}
        </div>
    );
}
