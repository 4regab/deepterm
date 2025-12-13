"use client";

import { useState, useCallback, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";
import {
    Check, X, Edit3, ArrowRight, Loader2
} from "lucide-react";
import { EncouragementToast, AnimatedProgress, HappyBirdMascot, SadBirdMascot } from "@/components/EmotionalAssets";
import SessionResultPage from "@/components/SessionResultPage";
import ExitPopup from "@/components/ExitPopup";
import StudySettingsModal from "@/components/StudySettingsModal";
import { getStudySettings, getQuestionTypeForStage, StudySettings, QuestionType } from "@/utils/studySettings";
import { createClient } from "@/config/supabase/client";
import { useXPStore } from "@/lib/stores";
import { addXP, recordStudyActivity, batchUpdateFlashcardStatuses, XP_REWARDS, type FlashcardStatusUpdate } from "@/services/activity";

type LearnStage = 'new' | 'learning' | 'almost_done' | 'mastered';

interface LearnCard {
    id: string;
    term: string;
    definition: string;
    stage: LearnStage;
    masteredShown?: boolean;
}

interface SessionCard extends LearnCard {
    questionType: QuestionType;
    mcqOptions?: string[];
    correctOptionIndex?: number;
    tfDisplayedAnswer?: string;
    tfIsCorrect?: boolean;
}

function buildSessionQueue(cards: LearnCard[], settings: StudySettings): SessionCard[] {
    const candidates = cards.filter(c => c.stage !== 'mastered' || !c.masteredShown);
    const shuffled = [...candidates].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, settings.cardsPerRound);

    // Determine if we're showing definition and asking for term, or vice versa
    const askForTerm = settings.frontSide === 'definition';

    return selected.map(card => {
        const questionType = getQuestionTypeForStage(card.stage, settings.enabledQuestionTypes);
        const sessionCard: SessionCard = { ...card, questionType };

        if (questionType === 'mcq') {
            // If showing definition, options should be TERMS (not definitions)
            // If showing term, options should be DEFINITIONS
            const correctAnswer = askForTerm ? card.term : card.definition;
            const otherOptions = cards
                .filter(c => c.id !== card.id)
                .map(c => askForTerm ? c.term : c.definition);
            const shuffledOthers = otherOptions.sort(() => Math.random() - 0.5).slice(0, 3);
            const options = [...shuffledOthers, correctAnswer].sort(() => Math.random() - 0.5);
            sessionCard.mcqOptions = options;
            sessionCard.correctOptionIndex = options.indexOf(correctAnswer);
        } else if (questionType === 'truefalse') {
            const isCorrect = Math.random() > 0.5;
            if (isCorrect) {
                sessionCard.tfDisplayedAnswer = askForTerm ? card.term : card.definition;
            } else {
                const others = cards.filter(c => c.id !== card.id);
                const wrongAnswer = others.length > 0
                    ? (askForTerm ? others[Math.floor(Math.random() * others.length)].term : others[Math.floor(Math.random() * others.length)].definition)
                    : (askForTerm ? card.term : card.definition);
                sessionCard.tfDisplayedAnswer = wrongAnswer;
            }
            sessionCard.tfIsCorrect = isCorrect;
        }

        return sessionCard;
    });
}

export default function LearnPage() {
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [settings, setSettings] = useState<StudySettings>(() => getStudySettings());
    const [cards, setCards] = useState<LearnCard[]>([]);
    const [sessionQueue, setSessionQueue] = useState<SessionCard[]>([]);

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
            const loadedCards: LearnCard[] = data.map(c => ({
                id: c.id,
                term: c.front,
                definition: c.back,
                stage: (c.status === 'review' ? 'almost_done' : c.status || 'new') as LearnStage,
            }));
            setCards(loadedCards);
            setSessionQueue(buildSessionQueue(loadedCards, getStudySettings()));
        }
        setIsLoading(false);
    }, [params.id]);

    useState(() => { fetchCards(); });
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [writtenAnswer, setWrittenAnswer] = useState("");
    const [writtenSubmitted, setWrittenSubmitted] = useState(false);
    const [writtenCorrect, setWrittenCorrect] = useState(false);
    const [showExitPopup, setShowExitPopup] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [sessionStats, setSessionStats] = useState(() => ({ correct: 0, incorrect: 0, xpGained: 0, startTime: Date.now() }));
    const [showToast, setShowToast] = useState(false);
    const [toastMessage] = useState("");
    const [sessionComplete, setSessionComplete] = useState(false);
    const [pendingUpdates, setPendingUpdates] = useState<FlashcardStatusUpdate[]>([]); // Track status changes for batch update

    // New state for feedback flow
    const [answerState, setAnswerState] = useState<'idle' | 'correct' | 'incorrect'>('idle');
    const [selectedOptionIndex, setSelectedOptionIndex] = useState<number | null>(null);
    const [pendingResult, setPendingResult] = useState<{ correct: boolean } | null>(null);

    // Edit card state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTerm, setEditTerm] = useState("");
    const [editDefinition, setEditDefinition] = useState("");
    const [isSavingEdit, setIsSavingEdit] = useState(false);

    const handleSettingsSave = (newSettings: StudySettings) => {
        setSettings(newSettings);
    };

    const openEditModal = () => {
        const currentCard = sessionQueue[currentIndex];
        setEditTerm(currentCard.term);
        setEditDefinition(currentCard.definition);
        setShowEditModal(true);
    };

    const handleSaveEdit = async () => {
        if (!editTerm.trim() || !editDefinition.trim()) return;

        setIsSavingEdit(true);
        const currentCard = sessionQueue[currentIndex];

        const supabase = createClient();
        await supabase
            .from("flashcards")
            .update({ front: editTerm.trim(), back: editDefinition.trim() })
            .eq("id", currentCard.id);

        // Update local state - cards, sessionQueue
        setCards(prev => prev.map(c =>
            c.id === currentCard.id
                ? { ...c, term: editTerm.trim(), definition: editDefinition.trim() }
                : c
        ));
        setSessionQueue(prev => prev.map(c =>
            c.id === currentCard.id
                ? { ...c, term: editTerm.trim(), definition: editDefinition.trim() }
                : c
        ));

        setIsSavingEdit(false);
        setShowEditModal(false);
    };

    const restartSession = () => {
        const queue = buildSessionQueue(cards, settings);
        setSessionQueue(queue);
        setCurrentIndex(0);
        setIsFlipped(false);
        setWrittenAnswer("");
        setWrittenSubmitted(false);
        setSessionStats({ correct: 0, incorrect: 0, xpGained: 0, startTime: Date.now() });
        setSessionComplete(false);
        setAnswerState('idle');
        setSelectedOptionIndex(null);
        setPendingResult(null);
        setPendingUpdates([]); // Reset pending updates for new session
    };

    // 1. Submit Answer (UI Feedback)
    const submitAnswer = useCallback((correct: boolean, index?: number) => {
        if (answerState !== 'idle') return; // Prevent double submission

        setAnswerState(correct ? 'correct' : 'incorrect');
        if (index !== undefined) setSelectedOptionIndex(index);
        setPendingResult({ correct });
    }, [answerState]);

    // 2. Override Result
    const handleOverride = () => {
        if (!pendingResult) return;
        const newCorrect = !pendingResult.correct;
        setPendingResult({ correct: newCorrect });
        setAnswerState(newCorrect ? 'correct' : 'incorrect');
    };

    // 3. Continue to Next Question (Commit Result)
    const handleNext = useCallback(async () => {
        if (!pendingResult) return;

        const currentCard = sessionQueue[currentIndex];
        const correct = pendingResult.correct;
        let nextStage: LearnStage = currentCard.stage;
        let xp = 0;

        if (correct) {
            if (currentCard.stage === 'new') nextStage = 'learning';
            else if (currentCard.stage === 'learning') nextStage = 'almost_done';
            else if (currentCard.stage === 'almost_done') nextStage = 'mastered';
            xp = XP_REWARDS.FLASHCARD_CORRECT;
        } else {
            if (currentCard.stage === 'almost_done') nextStage = 'learning';
        }

        // Track status update locally (no network request yet - batched at session end)
        const dbStatus = nextStage === 'almost_done' ? 'review' : nextStage;
        const newPendingUpdate: FlashcardStatusUpdate = { id: currentCard.id, status: dbStatus as 'new' | 'learning' | 'review' | 'mastered' };
        setPendingUpdates(prev => [...prev, newPendingUpdate]);

        const isMasteredCard = currentCard.stage === 'mastered';
        setCards(prev => prev.map(c => c.id === currentCard.id
            ? { ...c, stage: nextStage, masteredShown: isMasteredCard ? true : c.masteredShown }
            : c
        ));

        setSessionStats(prev => ({
            ...prev,
            correct: prev.correct + (correct ? 1 : 0),
            incorrect: prev.incorrect + (correct ? 0 : 1),
            xpGained: prev.xpGained + xp
        }));

        const isLastQuestion = currentIndex >= sessionQueue.length - 1;

        if (!isLastQuestion) {
            setCurrentIndex(prev => prev + 1);
            setIsFlipped(false);
            setWrittenAnswer("");
            setWrittenSubmitted(false);
            setAnswerState('idle');
            setSelectedOptionIndex(null);
            setPendingResult(null);
        } else {
            // Session complete - batch update all flashcard statuses and persist XP/activity
            const allUpdates = [...pendingUpdates, newPendingUpdate];
            if (allUpdates.length > 0) {
                await batchUpdateFlashcardStatuses(allUpdates);
            }

            const totalXpGained = sessionStats.xpGained + xp;
            if (totalXpGained > 0) {
                await addXP(totalXpGained);
                useXPStore.getState().fetchXPStats();
            }
            const minutesStudied = Math.max(1, Math.round((Date.now() - sessionStats.startTime) / 60000));
            await recordStudyActivity({ flashcards: sessionQueue.length, minutes: minutesStudied });
            setSessionComplete(true);
        }
    }, [currentIndex, pendingResult, sessionQueue, sessionStats.xpGained, sessionStats.startTime, pendingUpdates]);

    // Auto-next effect - triggers handleNext after configured duration
    useSyncExternalStore(
        useCallback(() => {
            if (!sessionComplete && answerState !== 'idle' && settings.autoNextAfterAnswer && pendingResult) {
                const timer = setTimeout(() => {
                    handleNext();
                }, settings.autoNextDuration * 1000);
                return () => clearTimeout(timer);
            }
            return () => { };
        }, [sessionComplete, answerState, settings.autoNextAfterAnswer, settings.autoNextDuration, pendingResult, handleNext]),
        () => null,
        () => null
    );

    const [justSubmittedWritten, setJustSubmittedWritten] = useState(false);

    const handleWrittenSubmit = () => {
        const currentCard = sessionQueue[currentIndex];
        const correct = writtenAnswer.trim().toLowerCase() === currentCard.term.toLowerCase();
        setWrittenCorrect(correct);
        setWrittenSubmitted(true);
        setJustSubmittedWritten(true);
        submitAnswer(correct);
        // Reset flag after a short delay to allow key handler to ignore the Enter key
        setTimeout(() => setJustSubmittedWritten(false), 100);
    };

    // Key press handler with keyboard shortcuts
    const handleKeyPress = useCallback((e: KeyboardEvent) => {
        if (sessionComplete || showExitPopup || showSettings || showEditModal || justSubmittedWritten) return;

        const currentCard = sessionQueue[currentIndex];
        if (!currentCard) return;

        // Keyboard shortcuts for MCQ (1-4 for A-D)
        if (currentCard.questionType === 'mcq' && currentCard.mcqOptions && answerState === 'idle') {
            const key = e.key;
            if (['1', '2', '3', '4'].includes(key)) {
                const index = parseInt(key) - 1;
                if (index < currentCard.mcqOptions.length) {
                    e.preventDefault();
                    const isCorrect = index === currentCard.correctOptionIndex;
                    submitAnswer(isCorrect, index);
                }
            }
        }

        // Keyboard shortcuts for True/False (a/b or 1/2)
        if (currentCard.questionType === 'truefalse' && answerState === 'idle') {
            const key = e.key.toLowerCase();
            if (key === 'a' || key === '1') {
                e.preventDefault();
                submitAnswer(true === currentCard.tfIsCorrect, 0);
            } else if (key === 'b' || key === '2') {
                e.preventDefault();
                submitAnswer(false === currentCard.tfIsCorrect, 1);
            }
        }

        // Keyboard shortcut for Flashcard (space to flip)
        if (currentCard.questionType === 'flashcard' && !isFlipped) {
            if (e.code === 'Space') {
                e.preventDefault();
                setIsFlipped(true);
            }
        }

        // Keyboard shortcuts for flashcard feedback (1 for didn't get it, 2 for got it)
        if (currentCard.questionType === 'flashcard' && isFlipped && answerState === 'idle') {
            const key = e.key;
            if (key === '1') {
                e.preventDefault();
                submitAnswer(false);
            } else if (key === '2') {
                e.preventDefault();
                submitAnswer(true);
            }
        }

        // Press any key to continue to next question
        if (answerState !== 'idle') {
            handleNext();
        }
    }, [sessionComplete, answerState, showExitPopup, showSettings, showEditModal, justSubmittedWritten, currentIndex, sessionQueue, isFlipped, submitAnswer, handleNext]);

    useSyncExternalStore(
        useCallback(() => {
            const handler = (e: KeyboardEvent) => handleKeyPress(e);
            window.addEventListener('keydown', handler);
            return () => window.removeEventListener('keydown', handler);
        }, [handleKeyPress]),
        () => null,
        () => null
    );

    // Get XP stats from store - must be called before any early returns
    const xpStats = useXPStore((state) => state.stats);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#f0f0ea] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#171d2b]/40" />
            </div>
        );
    }

    if (sessionQueue.length === 0 && !sessionComplete) {
        return (
            <div className="min-h-screen bg-[#f0f0ea] flex items-center justify-center">
                <p className="text-[#171d2b]/50">No flashcards found</p>
            </div>
        );
    }

    if (sessionComplete) {
        const total = sessionStats.correct + sessionStats.incorrect;

        // Map cards to ResultItem format
        const resultItems = cards.map(c => ({
            id: c.id,
            term: c.term,
            definition: c.definition,
            status: c.stage as 'new' | 'learning' | 'almost_done' | 'mastered'
        }));

        return (
            <SessionResultPage
                level={xpStats?.currentLevel || 1}
                currentXp={xpStats?.xpInLevel || 0}
                requiredXp={xpStats?.xpForNext || 100}
                xpEarned={sessionStats.xpGained}
                correctCount={sessionStats.correct}
                totalCount={total}
                items={resultItems}
                onContinue={restartSession}
                onExit={() => router.back()}
                showPressAnyKey={false}
            />
        );
    }

    const currentCard = sessionQueue[currentIndex];
    const frontContent = settings.frontSide === 'definition' ? currentCard.definition : currentCard.term;
    const backContent = settings.frontSide === 'definition' ? currentCard.term : currentCard.definition;

    return (
        <div className="min-h-screen bg-[#f0f0ea] flex flex-col pb-32 relative">
            <EncouragementToast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            <ExitPopup
                isOpen={showExitPopup}
                onClose={() => setShowExitPopup(false)}
                onExit={() => { setShowExitPopup(false); router.back(); }}
                xpToLose={sessionStats.xpGained}
                currentLevel={xpStats?.currentLevel || 1}
                currentXp={xpStats?.xpInLevel || 0}
                maxXp={xpStats?.xpForNext || 100}
                nextLevel={(xpStats?.currentLevel || 1) + 1}
            />
            <StudySettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} onSave={handleSettingsSave} />

            {/* Edit Card Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="font-sora font-bold text-xl text-[#171d2b]">Edit Card</h2>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#171d2b]/70 mb-2">Term</label>
                                <input
                                    type="text"
                                    value={editTerm}
                                    onChange={(e) => setEditTerm(e.target.value)}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#171d2b]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#171d2b]/70 mb-2">Definition</label>
                                <textarea
                                    value={editDefinition}
                                    onChange={(e) => setEditDefinition(e.target.value)}
                                    rows={4}
                                    className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-[#171d2b] resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="flex-1 py-3 border border-gray-200 rounded-xl font-medium hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                disabled={isSavingEdit || !editTerm.trim() || !editDefinition.trim()}
                                className="flex-1 py-3 bg-[#171d2b] text-white rounded-xl font-medium hover:bg-[#2a3347] disabled:opacity-50"
                            >
                                {isSavingEdit ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    {/* Learn Mode button removed */}
                </div>

                <h1 className="font-sora font-bold text-[#171d2b] text-base sm:text-lg absolute left-1/2 transform -translate-x-1/2 truncate max-w-[40%]">
                    DSA MIDTERMS
                </h1>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-full font-semibold text-[#171d2b] text-xs sm:text-sm hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Options
                    </button>
                    <button
                        onClick={() => setShowExitPopup(true)}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 shadow-sm"
                    >
                        <X size={20} className="text-[#171d2b]" />
                    </button>
                </div>
            </header>

            <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-4 sm:py-8 flex flex-col items-center">

                {/* Progress Bar */}
                <div className="w-full max-w-3xl mb-4 sm:mb-8">
                    <AnimatedProgress value={currentIndex + 1} total={sessionQueue.length} />
                </div>

                {/* Question Card */}
                <div className="w-full max-w-3xl bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 p-4 sm:p-8 min-h-[200px] sm:min-h-[300px] flex flex-col relative mb-4 sm:mb-8">
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                        <span className="text-xs sm:text-sm font-medium text-gray-500">Definition</span>
                        <div className="flex items-center gap-2">
                            {currentCard.stage === 'new' && (
                                <span className="px-2 sm:px-3 py-1 bg-pink-100 text-pink-600 text-xs font-bold rounded-full flex items-center gap-1">
                                    <div className="w-2 h-2 rounded-full border-2 border-pink-600" />
                                    New cards
                                </span>
                            )}
                            <button
                                onClick={openEditModal}
                                className="p-2 hover:bg-gray-50 rounded-full text-gray-400 hover:text-[#171d2b]"
                            >
                                <Edit3 size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 flex items-center justify-start">
                        <p className="text-base sm:text-xl font-sora font-medium text-[#171d2b] leading-relaxed">
                            {frontContent}
                        </p>
                    </div>
                </div>

                {/* Answer Section */}
                <div className="w-full max-w-3xl">
                    {/* Feedback Message */}
                    {answerState !== 'idle' && (
                        <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {answerState === 'correct' ? (
                                <h3 className="text-[#2D9F83] font-bold text-lg flex items-center gap-2">
                                    Nice work! That’s some impressive stuff! 🥳
                                </h3>
                            ) : (
                                <h3 className="text-[#FF6B6B] font-bold text-lg flex items-center gap-2">
                                    No worries, you’re still learning.
                                </h3>
                            )}
                        </div>
                    )}

                    {/* MCQ */}
                    {currentCard.questionType === 'mcq' && (
                        <>
                            {answerState === 'idle' && <h3 className="text-[#171d2b] font-bold mb-4">Select the matching term</h3>}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                {currentCard.mcqOptions?.map((opt, i) => {
                                    const isCorrectOption = i === currentCard.correctOptionIndex;
                                    const isSelected = i === selectedOptionIndex;

                                    const letters = ['A', 'B', 'C', 'D'];
                                    let buttonStyle = "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md";
                                    let numberStyle = "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white";
                                    let numberContent: React.ReactNode = letters[i];

                                    if (answerState !== 'idle') {
                                        if (isCorrectOption) {
                                            buttonStyle = "bg-[#E6F8F3] border-[#2D9F83]";
                                            numberStyle = "bg-[#2D9F83] text-white";
                                            numberContent = <Check size={16} strokeWidth={3} />;
                                        } else if (isSelected && answerState === 'incorrect') {
                                            buttonStyle = "bg-[#FFF0F0] border-[#FF6B6B]";
                                            numberStyle = "bg-[#FF6B6B] text-white";
                                            numberContent = <X size={16} strokeWidth={3} />;
                                        } else {
                                            buttonStyle = "bg-white border-gray-100 opacity-50";
                                            numberStyle = "bg-gray-100 text-gray-400";
                                        }
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => submitAnswer(isCorrectOption, i)}
                                            disabled={answerState !== 'idle'}
                                            className={`group p-3 sm:p-4 border rounded-2xl transition-all text-left flex items-center gap-3 sm:gap-4 ${buttonStyle}`}
                                        >
                                            <div className={`w-8 h-8 min-w-[32px] rounded-full font-bold flex items-center justify-center text-sm transition-colors ${numberStyle}`}>
                                                {numberContent}
                                            </div>
                                            <span className="font-medium text-[#171d2b] text-base sm:text-lg break-words">{opt}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* True/False */}
                    {currentCard.questionType === 'truefalse' && (
                        <>
                            {answerState === 'idle' && (
                                <div className="mb-4">
                                    <h3 className="text-[#171d2b] font-bold mb-2">Is this the correct term?</h3>
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <span className="text-xs text-gray-500 block mb-1">Term</span>
                                        <p className="text-lg font-semibold text-[#171d2b]">{currentCard.tfDisplayedAnswer}</p>
                                    </div>
                                </div>
                            )}
                            {answerState !== 'idle' && (
                                <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                                    <span className="text-xs text-gray-500 block mb-1">Displayed Term</span>
                                    <p className="text-lg font-semibold text-[#171d2b]">{currentCard.tfDisplayedAnswer}</p>
                                    {!currentCard.tfIsCorrect && (
                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                            <span className="text-xs text-gray-500 block mb-1">Correct Term</span>
                                            <p className="text-lg font-semibold text-[#2D9F83]">{backContent}</p>
                                        </div>
                                    )}
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {[true, false].map((val, i) => {
                                    const isCorrectOption = val === currentCard.tfIsCorrect;
                                    const isSelected = (i === 0 && selectedOptionIndex === 0) || (i === 1 && selectedOptionIndex === 1);
                                    const optionIndex = i;
                                    const letters = ['A', 'B'];

                                    let buttonStyle = "bg-white border-gray-200 hover:border-gray-300 hover:shadow-md";
                                    let numberStyle = "bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white";
                                    let numberContent: React.ReactNode = letters[i];

                                    if (answerState !== 'idle') {
                                        if (isCorrectOption) {
                                            buttonStyle = "bg-[#E6F8F3] border-[#2D9F83]";
                                            numberStyle = "bg-[#2D9F83] text-white";
                                            numberContent = <Check size={16} strokeWidth={3} />;
                                        } else if (isSelected && answerState === 'incorrect') {
                                            buttonStyle = "bg-[#FFF0F0] border-[#FF6B6B]";
                                            numberStyle = "bg-[#FF6B6B] text-white";
                                            numberContent = <X size={16} strokeWidth={3} />;
                                        } else {
                                            buttonStyle = "bg-white border-gray-100 opacity-50";
                                            numberStyle = "bg-gray-100 text-gray-400";
                                        }
                                    }

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => submitAnswer(isCorrectOption, optionIndex)}
                                            disabled={answerState !== 'idle'}
                                            className={`group p-4 sm:p-6 border rounded-2xl transition-all text-left flex items-center gap-4 ${buttonStyle}`}
                                        >
                                            <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center text-sm transition-colors ${numberStyle}`}>
                                                {numberContent}
                                            </div>
                                            <span className="font-medium text-[#171d2b] text-base sm:text-lg">{val ? "True" : "False"}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </>
                    )}

                    {/* Written */}
                    {currentCard.questionType === 'written' && (
                        <>
                            <h3 className="text-[#171d2b] font-bold mb-4">Answer to the best of your ability</h3>
                            {!writtenSubmitted ? (
                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        value={writtenAnswer}
                                        onChange={(e) => setWrittenAnswer(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && writtenAnswer.trim() && handleWrittenSubmit()}
                                        placeholder="Type your answer and press Enter"
                                        className="w-full p-4 bg-white border border-gray-300 rounded-2xl focus:border-[#171d2b] focus:outline-none text-lg placeholder:text-gray-400"
                                        autoFocus
                                    />
                                    <div className="flex gap-3 justify-end">
                                        <button
                                            onClick={() => submitAnswer(false)}
                                            className="px-6 py-3 font-bold text-[#171d2b] hover:bg-gray-100 rounded-xl transition-colors border border-gray-200"
                                        >
                                            Skip
                                        </button>
                                        <button
                                            onClick={handleWrittenSubmit}
                                            disabled={!writtenAnswer.trim()}
                                            className="px-8 py-3 bg-[#171d2b] text-white font-bold rounded-xl hover:bg-[#2a3347] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            Answer
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-3">
                                        <span className="text-xs text-gray-500 block mb-1">Your Answer</span>
                                        <p className="text-lg font-medium text-[#171d2b]">{writtenAnswer}</p>
                                    </div>
                                    <div className={`p-6 rounded-2xl ${writtenCorrect ? 'bg-[#E6F8F3] border border-[#2D9F83]' : 'bg-[#FFF0F0] border border-[#FF6B6B]'}`}>
                                        <p className={`font-semibold text-lg ${writtenCorrect ? 'text-[#2D9F83]' : 'text-[#FF6B6B]'}`}>
                                            {writtenCorrect ? 'Correct!' : 'Incorrect'}
                                        </p>
                                        <div className="mt-3 pt-3 border-t border-current/10">
                                            <span className="text-xs opacity-70 block mb-1">Correct Answer</span>
                                            <p className="font-bold text-lg">{backContent}</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Flashcard */}
                    {currentCard.questionType === 'flashcard' && (
                        <div className="flex flex-col items-center">
                            {!isFlipped ? (
                                <button
                                    onClick={() => setIsFlipped(true)}
                                    className="px-8 py-3 rounded-full bg-white border border-gray-200 font-bold text-[#171d2b] hover:bg-gray-50 shadow-sm transition-all"
                                >
                                    Show Answer
                                </button>
                            ) : (
                                <div className="w-full bg-white rounded-3xl shadow-sm border border-gray-100 p-8 text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <span className="text-sm font-medium text-gray-500 block mb-4">Term</span>
                                    <p className="text-xl font-sora font-medium text-[#171d2b] mb-8">{backContent}</p>

                                    {answerState === 'idle' && (
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={() => submitAnswer(false)}
                                                className="px-8 py-3 rounded-xl border-2 border-red-100 text-red-600 font-bold hover:bg-red-50 transition-colors"
                                            >
                                                <X className="inline mr-2" size={18} />
                                                Forgot
                                            </button>
                                            <button
                                                onClick={() => submitAnswer(true)}
                                                className="px-8 py-3 rounded-xl border-2 border-green-100 text-green-600 font-bold hover:bg-green-50 transition-colors"
                                            >
                                                <Check className="inline mr-2" size={18} />
                                                Knew it
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* Bottom Bar */}
            <AnimatePresence>
                {answerState !== 'idle' && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40"
                    >
                        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 relative">
                            <div className="hidden md:block text-[#171d2b]/60 font-medium">
                                Press any key to continue
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto sm:ml-auto relative">
                                <button
                                    onClick={handleOverride}
                                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-gray-200 font-bold text-[#171d2b] hover:bg-gray-50 transition-colors text-sm sm:text-base"
                                >
                                    Override: I got it {answerState === 'correct' ? 'wrong' : 'right'}
                                </button>

                                <div className="relative">
                                    {/* Mascot - Sitting on top of button */}
                                    <div className="absolute -top-[44px] sm:-top-[54px] left-1/2 -translate-x-1/2 pointer-events-none z-20">
                                        {answerState === 'correct' ? (
                                            <HappyBirdMascot className="w-14 h-14 sm:w-[68px] sm:h-[68px]" />
                                        ) : (
                                            <SadBirdMascot className="w-14 h-14 sm:w-[68px] sm:h-[68px]" />
                                        )}
                                    </div>
                                    <button
                                        onClick={handleNext}
                                        className="px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-[#2D9F83] text-white font-bold hover:bg-[#258a70] transition-colors flex items-center gap-2 relative z-10 text-sm sm:text-base"
                                    >
                                        Next
                                        <ArrowRight size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
