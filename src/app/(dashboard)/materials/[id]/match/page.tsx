"use client";

import { useState, useCallback, useRef, useSyncExternalStore } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Loader2, X } from "lucide-react";
import SessionResultPage from "@/components/SessionResultPage";
import ExitPopup from "@/components/ExitPopup";
import { createClient } from "@/config/supabase/client";
import { useXPStore } from "@/lib/stores";
import { addXP, recordStudyActivity, updateFlashcardStatus, XP_REWARDS } from "@/services/activity";

type CardStatus = 'new' | 'learning' | 'review' | 'mastered';

interface FlashcardData {
    id: string;
    term: string;
    definition: string;
    status: CardStatus;
}

interface MatchCard {
    id: string;
    content: string;
    type: 'term' | 'definition';
    pairId: string;
    isMatched: boolean;
}

type Stage = "loading" | "playing" | "results";

function createGameCards(data: FlashcardData[]): MatchCard[] {
    const gameCards: MatchCard[] = [];
    const selected = data.slice(0, 6);
    selected.forEach(item => {
        gameCards.push({ id: `term-${item.id}`, content: item.term, type: 'term', pairId: item.id, isMatched: false });
        gameCards.push({ id: `def-${item.id}`, content: item.definition, type: 'definition', pairId: item.id, isMatched: false });
    });
    return gameCards.sort(() => Math.random() - 0.5);
}

export default function MatchPage() {
    const router = useRouter();
    const params = useParams();
    const [flashcardData, setFlashcardData] = useState<FlashcardData[]>([]);
    const [stage, setStage] = useState<Stage>("loading");
    const [cards, setCards] = useState<MatchCard[]>([]);
    const [selectedCards, setSelectedCards] = useState<MatchCard[]>([]);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [matchCount, setMatchCount] = useState(0);
    const [mistakeCount, setMistakeCount] = useState(0);
    const [finalXpEarned, setFinalXpEarned] = useState(0);
    const [finalTime, setFinalTime] = useState(0);
    const [showExitPopup, setShowExitPopup] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize and cleanup via useSyncExternalStore
    useSyncExternalStore(
        useCallback(() => {
            let initialized = false;
            const init = async () => {
                if (initialized) return;
                initialized = true;

                // Fetch XP stats for display
                useXPStore.getState().fetchXPStats();

                const supabase = createClient();
                const { data } = await supabase
                    .from("flashcards")
                    .select("id, front, back, status")
                    .eq("set_id", params.id)
                    .order("created_at");

                if (data && data.length > 0) {
                    const fcData: FlashcardData[] = data.map(c => ({ id: c.id, term: c.front, definition: c.back, status: (c.status || 'new') as CardStatus }));
                    setFlashcardData(fcData);
                    setCards(createGameCards(fcData));
                    setStage("playing");
                    timerRef.current = setInterval(() => setTimeElapsed(prev => prev + 0.1), 100);
                } else {
                    setStage("playing");
                }
            };
            init();
            return () => {
                if (timerRef.current) {
                    clearInterval(timerRef.current);
                    timerRef.current = null;
                }
            };
        }, [params.id]),
        () => null,
        () => null
    );

    const stopTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const startGame = useCallback(() => {
        stopTimer();
        setCards(createGameCards(flashcardData));
        setSelectedCards([]);
        setTimeElapsed(0);
        setMatchCount(0);
        setMistakeCount(0);
        setFinalXpEarned(0);
        setFinalTime(0);
        setStage("playing");
        timerRef.current = setInterval(() => setTimeElapsed(prev => prev + 0.1), 100);
    }, [stopTimer, flashcardData]);

    const handleCardClick = (card: MatchCard) => {
        if (stage !== "playing" || card.isMatched || selectedCards.find(c => c.id === card.id)) return;

        if (selectedCards.length === 0) {
            setSelectedCards([card]);
        } else if (selectedCards.length === 1) {
            const firstCard = selectedCards[0];
            setSelectedCards([firstCard, card]);

            if (firstCard.pairId === card.pairId) {
                // Match found - update flashcard status
                const matchedCard = flashcardData.find(c => c.id === firstCard.pairId);
                if (matchedCard) {
                    const newStatus: CardStatus = matchedCard.status === 'new' ? 'learning' 
                        : matchedCard.status === 'learning' ? 'review' : 'mastered';
                    updateFlashcardStatus(matchedCard.id, newStatus);
                    setFlashcardData(prev => prev.map(c => c.id === matchedCard.id ? { ...c, status: newStatus } : c));
                }

                setTimeout(() => {
                    const updated = cards.map(c => (c.id === firstCard.id || c.id === card.id) ? { ...c, isMatched: true } : c);
                    const allMatched = updated.every(c => c.isMatched);

                    setCards(updated);
                    setMatchCount(prev => prev + 1);
                    setSelectedCards([]);

                    if (allMatched) {
                        // Stop timer and capture final time in state
                        stopTimer();
                        setFinalTime(timeElapsed);

                        // Persist XP at moment of completion (not during render)
                        const newMatchCount = matchCount + 1;
                        const xpEarned = newMatchCount * XP_REWARDS.FLASHCARD_CORRECT;
                        setFinalXpEarned(xpEarned);

                        const persistResults = async () => {
                            if (xpEarned > 0) {
                                await addXP(xpEarned);
                                useXPStore.getState().fetchXPStats();
                            }
                            const minutesStudied = Math.max(1, Math.round(timeElapsed / 60));
                            await recordStudyActivity({ flashcards: newMatchCount, minutes: minutesStudied });
                        };
                        persistResults();

                        setStage("results");
                    }
                }, 300);
            } else {
                // No match
                setMistakeCount(prev => prev + 1);
                setTimeout(() => setSelectedCards([]), 800);
            }
        }
    };

    const formatTime = (seconds: number) => seconds.toFixed(1) + 's';

    // Get XP stats from store - must be called before any early returns
    const xpStats = useXPStore((state) => state.stats);

    if (stage === "loading") {
        return (
            <div className="min-h-screen bg-[#f0f0ea] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#171d2b]/40" />
            </div>
        );
    }

    // Results Screen
    if (stage === "results") {
        const resultItems = flashcardData.map(item => ({
            id: item.id,
            term: item.term,
            definition: item.definition,
            status: 'new' as 'new' | 'learning' | 'almost_done' | 'mastered'
        }));

        return (
            <SessionResultPage
                level={xpStats?.currentLevel || 1}
                currentXp={xpStats?.xpInLevel || 0}
                requiredXp={xpStats?.xpForNext || 100}
                xpEarned={finalXpEarned}
                correctCount={matchCount}
                totalCount={matchCount + mistakeCount}
                items={resultItems}
                onContinue={startGame}
                onExit={() => router.back()}
                title={`Match complete in ${formatTime(finalTime)}!`}
                showPressAnyKey={false}
            />
        );
    }

    if (cards.length === 0) {
        return (
            <div className="min-h-screen bg-[#f0f0ea] flex items-center justify-center">
                <p className="text-[#171d2b]/50">No flashcards found</p>
            </div>
        );
    }

    // Playing Screen
    return (
        <div className="min-h-screen bg-[#f0f0ea] p-4 sm:p-6">
            <ExitPopup
                isOpen={showExitPopup}
                onClose={() => setShowExitPopup(false)}
                onExit={() => { setShowExitPopup(false); stopTimer(); router.back(); }}
                xpToLose={matchCount * XP_REWARDS.FLASHCARD_CORRECT}
                currentLevel={xpStats?.currentLevel || 1}
                currentXp={xpStats?.xpInLevel || 0}
                maxXp={xpStats?.xpForNext || 100}
                nextLevel={(xpStats?.currentLevel || 1) + 1}
            />
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => setShowExitPopup(true)} className="p-2 hover:bg-[#171d2b]/5 rounded-lg transition-colors">
                        <X size={22} />
                    </button>
                    <div className="flex items-center gap-3 bg-white px-5 py-2.5 rounded-xl shadow-sm border border-[#171d2b]/5">
                        <Timer size={18} className="text-[#171d2b]/60" />
                        <span className="font-mono text-lg font-bold text-[#171d2b] w-14 text-center">{formatTime(timeElapsed)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#171d2b]/60">
                        <span>{matchCount}/{Math.min(flashcardData.length, 6)}</span>
                    </div>
                </div>

                {/* Game Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    <AnimatePresence>
                        {cards.map((card) => {
                            if (card.isMatched) return <motion.div key={card.id} initial={{ scale: 1 }} animate={{ scale: 0, opacity: 0 }} className="aspect-[4/3]" />;
                            const isSelected = selectedCards.find(c => c.id === card.id);
                            const isWrong = isSelected && selectedCards.length === 2 && selectedCards[0].pairId !== selectedCards[1].pairId;
                            return (
                                <motion.button
                                    key={card.id}
                                    layout
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1, x: isWrong ? [0, -8, 8, -8, 8, 0] : 0 }}
                                    transition={isWrong ? { duration: 0.4 } : { type: "spring", stiffness: 300, damping: 25 }}
                                    onClick={() => handleCardClick(card)}
                                    className={`aspect-[4/3] rounded-xl p-3 flex items-center justify-center text-center font-medium text-sm transition-all shadow-sm
                                        ${isSelected
                                            ? isWrong
                                                ? 'bg-red-50 border-2 border-red-300 text-red-700'
                                                : 'bg-[#171d2b] text-white scale-[1.02] shadow-lg'
                                            : 'bg-white text-[#171d2b] border border-[#171d2b]/5 hover:border-[#171d2b]/20 hover:shadow-md'
                                        }`}
                                >
                                    {card.content}
                                </motion.button>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
