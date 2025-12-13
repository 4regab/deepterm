"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import { RotateCcw, Check, X, Settings, Loader2 } from "lucide-react";
import { EncouragementToast, AnimatedProgress } from "@/components/EmotionalAssets";
import SessionResultPage from "@/components/SessionResultPage";
import ExitPopup from "@/components/ExitPopup";
import StudySettingsModal from "@/components/StudySettingsModal";
import { getStudySettings, StudySettings } from "@/utils/studySettings";
import { createClient } from "@/config/supabase/client";
import { logFlashcardReview, batchUpdateFlashcardStatuses, addXP, XP_REWARDS, type FlashcardStatusUpdate } from "@/services/activity";
import { useXPStore } from "@/lib/stores";

interface Flashcard {
    id: string;
    term: string;
    definition: string;
    status: 'new' | 'learning' | 'review' | 'mastered';
}

function createInitialSession(cards: Flashcard[], settings: StudySettings) {
    const sessionCards = [...cards].sort(() => Math.random() - 0.5).slice(0, settings.cardsPerRound);
    return {
        cards: sessionCards,
        currentIndex: 0,
        isFlipped: false,
        stats: { correct: 0, incorrect: 0, xp: 0, startTime: Date.now() },
        isComplete: false,
        streak: 0,
        pendingUpdates: [] as FlashcardStatusUpdate[] // Track status changes for batch update
    };
}

export default function FlashcardsPage() {
    const router = useRouter();
    const params = useParams();
    const [allCards, setAllCards] = useState<Flashcard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<StudySettings>(() => getStudySettings());
    const [studySession, setStudySession] = useState<ReturnType<typeof createInitialSession> | null>(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showExitPopup, setShowExitPopup] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const fetchCards = useCallback(async () => {
        // Fetch XP stats for display
        useXPStore.getState().fetchXPStats();

        const supabase = createClient();
        const { data } = await supabase
            .from("flashcards")
            .select("id, front, back, status")
            .eq("set_id", params.id)
            .order("created_at");

        if (data && data.length > 0) {
            const cards: Flashcard[] = data.map(c => ({
                id: c.id,
                term: c.front,
                definition: c.back,
                status: (c.status || 'new') as Flashcard['status'],
            }));
            setAllCards(cards);
            setStudySession(createInitialSession(cards, getStudySettings()));
        }
        setIsLoading(false);
    }, [params.id]);

    useState(() => { fetchCards(); });

    // Get XP stats from store - must be called before any early returns
    const xpStats = useXPStore((state) => state.stats);

    const handleSettingsSave = (newSettings: StudySettings) => {
        setSettings(newSettings);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f0f0ea] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#171d2b]/40" />
            </div>
        );
    }

    if (!studySession || studySession.cards.length === 0) {
        return (
            <div className="min-h-screen bg-[#f0f0ea] flex items-center justify-center">
                <p className="text-[#171d2b]/50">No flashcards found</p>
            </div>
        );
    }

    if (studySession.isComplete) {
        const resultItems = allCards.map(c => ({
            id: c.id,
            term: c.term,
            definition: c.definition,
            status: (c.status === 'review' ? 'almost_done' : c.status) as 'new' | 'learning' | 'almost_done' | 'mastered'
        }));

        return (
            <SessionResultPage
                level={xpStats?.currentLevel || 1}
                currentXp={xpStats?.xpInLevel || 0}
                requiredXp={xpStats?.xpForNext || 100}
                xpEarned={studySession.stats.xp}
                correctCount={studySession.stats.correct}
                totalCount={studySession.cards.length}
                items={resultItems}
                onContinue={() => setStudySession(createInitialSession(allCards, settings))}
                onExit={() => router.back()}
                title="Great job on your flashcards!"
                showPressAnyKey={false}
            />
        );
    }

    const currentCard = studySession.cards[studySession.currentIndex];
    const frontContent = settings.frontSide === 'definition' ? currentCard.definition : currentCard.term;
    const backContent = settings.frontSide === 'definition' ? currentCard.term : currentCard.definition;
    const frontLabel = settings.frontSide === 'definition' ? 'Definition' : 'Term';
    const backLabel = settings.frontSide === 'definition' ? 'Term' : 'Definition';

    // Dynamic font size based on text length for mobile responsiveness
    const getResponsiveFontSize = (text: string) => {
        const len = text.length;
        if (len < 50) return 'clamp(1.25rem, 5vw, 1.875rem)';
        if (len < 100) return 'clamp(1rem, 4vw, 1.5rem)';
        if (len < 200) return 'clamp(0.875rem, 3.5vw, 1.25rem)';
        if (len < 400) return 'clamp(0.75rem, 3vw, 1rem)';
        return 'clamp(0.625rem, 2.5vw, 0.875rem)';
    };

    const handleRate = async (correct: boolean) => {
        if (!studySession) return;

        const currentCard = studySession.cards[studySession.currentIndex];
        const isLast = studySession.currentIndex === studySession.cards.length - 1;
        const newStreak = correct ? studySession.streak + 1 : 0;

        // Calculate new status locally (no network request yet)
        const newStatus = correct
            ? (currentCard.status === 'new' ? 'learning' : currentCard.status === 'learning' ? 'review' : 'mastered')
            : 'learning';

        // Track the status change for batch update at session end
        const pendingUpdate: FlashcardStatusUpdate = { id: currentCard.id, status: newStatus as 'new' | 'learning' | 'review' | 'mastered' };

        // Update local card status
        const updatedCards = [...studySession.cards];
        updatedCards[studySession.currentIndex] = { ...currentCard, status: newStatus as Flashcard['status'] };

        if (correct && newStreak > 0 && newStreak % 3 === 0) {
            setToastMessage(`${newStreak} in a row! You're on fire!`);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }

        const xpGained = correct ? XP_REWARDS.FLASHCARD_CORRECT : 0;

        // Accumulate pending updates
        const newPendingUpdates = [...studySession.pendingUpdates, pendingUpdate];

        if (isLast) {
            const finalXp = studySession.stats.xp + xpGained;

            // Persist all results at session completion (batch update)
            const persistResults = async () => {
                const minutesStudied = Math.max(1, Math.round((Date.now() - studySession.stats.startTime) / 60000));

                // Batch update all flashcard statuses in one request
                await batchUpdateFlashcardStatuses(newPendingUpdates);

                await logFlashcardReview(studySession.cards.length, minutesStudied);
                if (finalXp > 0) {
                    await addXP(finalXp);
                    useXPStore.getState().fetchXPStats();
                }
            };
            persistResults();

            setStudySession({
                ...studySession,
                cards: updatedCards,
                stats: {
                    ...studySession.stats,
                    correct: studySession.stats.correct + (correct ? 1 : 0),
                    incorrect: studySession.stats.incorrect + (correct ? 0 : 1),
                    xp: finalXp
                },
                isComplete: true,
                streak: newStreak,
                pendingUpdates: newPendingUpdates
            });
        } else {
            setStudySession({
                ...studySession,
                cards: updatedCards,
                currentIndex: studySession.currentIndex + 1,
                isFlipped: false,
                stats: {
                    ...studySession.stats,
                    correct: studySession.stats.correct + (correct ? 1 : 0),
                    incorrect: studySession.stats.incorrect + (correct ? 0 : 1),
                    xp: studySession.stats.xp + xpGained
                },
                streak: newStreak,
                pendingUpdates: newPendingUpdates
            });
        }
    };

    return (
        <div className="min-h-screen flex flex-col max-w-5xl mx-auto px-4 sm:px-8 py-8 bg-[#f0f0ea]">
            <EncouragementToast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            <ExitPopup
                isOpen={showExitPopup}
                onClose={() => setShowExitPopup(false)}
                onExit={() => { setShowExitPopup(false); router.back(); }}
                xpToLose={studySession.stats.xp}
                currentLevel={xpStats?.currentLevel || 1}
                currentXp={xpStats?.xpInLevel || 0}
                maxXp={xpStats?.xpForNext || 100}
                nextLevel={(xpStats?.currentLevel || 1) + 1}
            />
            <StudySettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onSave={handleSettingsSave} />

            {/* Header */}
            <div className="flex justify-between items-center mb-8 pt-14 md:pt-0">
                <button onClick={() => setShowExitPopup(true)} className="p-2 hover:bg-[#171d2b]/5 rounded-full transition-colors">
                    <X size={24} />
                </button>
                <div className="flex flex-col items-center">
                    <span className="font-sora font-semibold text-[#171d2b]">Flashcards</span>
                    <span className="text-sm text-[#171d2b]/40">Card {studySession.currentIndex + 1} of {studySession.cards.length}</span>
                </div>
                <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-[#171d2b]/5 rounded-full transition-colors">
                    <Settings size={24} />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full mb-12">
                <AnimatedProgress value={studySession.currentIndex} total={studySession.cards.length} color="#171d2b" />
            </div>

            {/* Card Area */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[500px] perspective-1000">
                <div
                    className="relative w-full max-w-2xl aspect-[3/2] cursor-pointer group"
                    onClick={() => studySession && setStudySession({ ...studySession, isFlipped: !studySession.isFlipped })}
                >
                    <motion.div
                        className="w-full h-full relative preserve-3d"
                        animate={{ rotateY: studySession.isFlipped ? 180 : 0 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        style={{ transformStyle: "preserve-3d" }}
                    >
                        {/* Front */}
                        <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border border-[#171d2b]/5 flex flex-col items-center justify-center px-4 sm:px-8 pt-12 sm:pt-16 pb-10 sm:pb-12 text-center hover:shadow-2xl transition-shadow overflow-hidden">
                            <span className="absolute top-4 sm:top-6 left-4 sm:left-6 text-xs font-bold text-[#171d2b]/20 uppercase tracking-widest">{frontLabel}</span>
                            <div className="w-full h-full flex items-center justify-center overflow-y-auto">
                                <p className="font-sora font-medium text-[#171d2b] leading-relaxed break-words" style={{ fontSize: getResponsiveFontSize(frontContent) }}>{frontContent}</p>
                            </div>
                            <span className="absolute bottom-4 sm:bottom-6 text-xs text-[#171d2b]/40 opacity-0 group-hover:opacity-100 transition-opacity">Click to flip</span>
                        </div>

                        {/* Back */}
                        <div className="absolute inset-0 backface-hidden bg-[#171d2b] rounded-3xl shadow-xl flex flex-col items-center justify-center px-4 sm:px-8 pt-12 sm:pt-16 pb-10 sm:pb-12 text-center overflow-hidden" style={{ transform: "rotateY(180deg)" }}>
                            <span className="absolute top-4 sm:top-6 left-4 sm:left-6 text-xs font-bold text-white/20 uppercase tracking-widest">{backLabel}</span>
                            <div className="w-full h-full flex items-center justify-center overflow-y-auto">
                                <p className="font-sora font-medium text-white leading-relaxed break-words" style={{ fontSize: getResponsiveFontSize(backContent) }}>{backContent}</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Controls */}
                <div className="mt-12 h-24 flex items-center justify-center">
                    {!studySession.isFlipped ? (
                        <button
                            onClick={() => studySession && setStudySession({ ...studySession, isFlipped: true })}
                            className="px-6 py-3 rounded-full font-sora font-medium bg-[#171d2b] text-white hover:bg-[#2a3347] shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <RotateCcw size={18} />
                            Show Answer
                        </button>
                    ) : (
                        <div className="flex gap-4">
                            <button onClick={(e) => { e.stopPropagation(); handleRate(false); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-16 h-16 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-2xl border-2 border-transparent group-hover:border-red-200 transition-all hover:scale-110 active:scale-95">
                                    <X />
                                </div>
                                <span className="text-sm font-medium text-[#171d2b]/60 group-hover:text-red-600">Review</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); handleRate(true); }} className="flex flex-col items-center gap-2 group">
                                <div className="w-16 h-16 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl border-2 border-transparent group-hover:border-green-200 transition-all hover:scale-110 active:scale-95">
                                    <Check />
                                </div>
                                <span className="text-sm font-medium text-[#171d2b]/60 group-hover:text-green-600">Knew it</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
