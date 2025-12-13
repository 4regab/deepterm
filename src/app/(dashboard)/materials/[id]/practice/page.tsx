"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import { FloatingOrb, EncouragementToast, AnimatedProgress, HappyBirdMascot, SadBirdMascot } from "@/components/EmotionalAssets";
import SessionResultPage from "@/components/SessionResultPage";
import ExitPopup from "@/components/ExitPopup";
import PracticeSettingsModal, { PracticeSettings } from "@/components/PracticeSettingsModal";
import { createClient } from "@/config/supabase/client";
import { useXPStore } from "@/lib/stores";
import { addXP, recordStudyActivity, batchUpdateFlashcardStatuses, XP_REWARDS, type FlashcardStatusUpdate } from "@/services/activity";

type QuestionType = "multipleChoice" | "trueFalse" | "fillBlank";

type CardStatus = 'new' | 'learning' | 'review' | 'mastered';

interface FlashcardData {
    id: string;
    term: string;
    definition: string;
    status: CardStatus;
}

interface Question {
    id: string;
    type: QuestionType;
    question: string;
    options?: string[];
    correctAnswer: string;
    userAnswer?: string;
    isCorrect?: boolean;
    explanation?: string;
    // For true/false questions
    tfDisplayedTerm?: string;
    tfIsCorrectPairing?: boolean;
}

type Stage = "loading" | "config" | "generating" | "take" | "results";

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    multipleChoice: "Multiple Choice",
    trueFalse: "True/False",
    fillBlank: "Fill in Blank",
};

const DEFAULT_PRACTICE_SETTINGS: PracticeSettings = {
    cardCount: "max",
    enabledQuestionTypes: ["multipleChoice", "trueFalse", "fillBlank"],
    shuffleTerms: true,
    autoNextAfterAnswer: false,
    autoNextDuration: 2,
    answerFeedback: false,
};

function generateQuestionsFromCards(cards: FlashcardData[], types: QuestionType[], cardCount: number): Question[] {
    const questions: Question[] = [];
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    const selectedCards = shuffled.slice(0, cardCount);

    selectedCards.forEach((card, idx) => {
        const type = types[idx % types.length];

        if (type === 'trueFalse') {
            // True/False: Show definition, display a term, ask if it's correct
            const isCorrectPairing = Math.random() > 0.5;
            let displayedTerm: string;

            if (isCorrectPairing) {
                displayedTerm = card.term;
            } else {
                const others = cards.filter(c => c.id !== card.id);
                displayedTerm = others.length > 0
                    ? others[Math.floor(Math.random() * others.length)].term
                    : card.term;
            }

            questions.push({
                id: card.id,
                type,
                question: card.definition,
                correctAnswer: isCorrectPairing ? 'true' : 'false',
                tfDisplayedTerm: displayedTerm,
                tfIsCorrectPairing: isCorrectPairing,
            });
        } else if (type === 'fillBlank') {
            questions.push({
                id: card.id,
                type,
                question: `${card.definition.split(' ').slice(0, 3).join(' ')} _____ ${card.definition.split(' ').slice(-2).join(' ')}`,
                correctAnswer: card.term.toLowerCase(),
            });
        } else {
            // Multiple choice - show definition, ask for term (like learn mode)
            const others = cards.filter(c => c.id !== card.id).map(c => c.term);
            const wrongOptions = others.sort(() => Math.random() - 0.5).slice(0, 3);
            questions.push({
                id: card.id,
                type,
                question: card.definition,
                correctAnswer: card.term,
                options: [...wrongOptions, card.term].sort(() => Math.random() - 0.5),
            });
        }
    });

    return questions;
}

export default function PracticePage() {
    const router = useRouter();
    const params = useParams();
    const [flashcardData, setFlashcardData] = useState<FlashcardData[]>([]);
    const [stage, setStage] = useState<Stage>("loading");
    const [questions, setQuestions] = useState<Question[]>([]);
    const [settings, setSettings] = useState<PracticeSettings>(DEFAULT_PRACTICE_SETTINGS);
    const [showSettings, setShowSettings] = useState(false);
    const [pendingUpdates, setPendingUpdates] = useState<FlashcardStatusUpdate[]>([]); // Track status changes for batch update

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
            const cards = data.map(c => ({ id: c.id, term: c.front, definition: c.back, status: (c.status || 'new') as CardStatus }));
            setFlashcardData(cards);
            // Show config screen first
            setStage("config");
            setShowSettings(true);
        } else {
            setStage("config");
        }
    }, [params.id]);

    useState(() => { fetchCards(); });
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [streak, setStreak] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showExitPopup, setShowExitPopup] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const [finalXpEarned, setFinalXpEarned] = useState(0);

    const handleSettingsSave = (newSettings: PracticeSettings) => {
        setSettings(newSettings);
        setShowSettings(false); // Close modal here after receiving settings
        // Generate questions with settings
        setStage("generating");
        setTimeout(() => {
            const count = newSettings.cardCount === "max" ? flashcardData.length : newSettings.cardCount;
            const generated = generateQuestionsFromCards(flashcardData, newSettings.enabledQuestionTypes as QuestionType[], count);
            setQuestions(generated);
            setCurrentQuestionIndex(0);
            setShowAnswer(false);
            setStreak(0);
            setStage("take");
        }, 1500);
    };

    const handleSettingsClose = () => {
        setShowSettings(false);
        // If still in config stage (initial), go back
        if (stage === "config") {
            router.back();
        }
    };

    const nextQuestion = useCallback(() => {
        setShowAnswer(false);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            // Persist all results at session completion (batch update)
            const correct = questions.filter(q => q.isCorrect).length;
            const xpEarned = correct * XP_REWARDS.FLASHCARD_CORRECT;
            setFinalXpEarned(xpEarned);

            const persistResults = async () => {
                // Batch update all flashcard statuses in one request
                if (pendingUpdates.length > 0) {
                    await batchUpdateFlashcardStatuses(pendingUpdates);
                }

                if (xpEarned > 0) {
                    await addXP(xpEarned);
                    useXPStore.getState().fetchXPStats();
                }
                await recordStudyActivity({ quizzes: 1 });
            };
            persistResults();

            setStage("results");
        }
    }, [currentQuestionIndex, questions, pendingUpdates]);

    const handleAnswer = async (answer: string) => {
        const updated = [...questions];
        updated[currentQuestionIndex].userAnswer = answer;
        const current = updated[currentQuestionIndex];
        const isCorrect = current.type === "fillBlank"
            ? answer.toLowerCase().trim().includes(current.correctAnswer.toLowerCase().trim().split(" ")[0])
            : answer.toLowerCase() === current.correctAnswer.toLowerCase();
        updated[currentQuestionIndex].isCorrect = isCorrect;
        setQuestions(updated);

        // Track flashcard status update locally (no network request yet)
        const cardIndex = flashcardData.findIndex(c => c.id === current.id);
        if (cardIndex !== -1) {
            const card = flashcardData[cardIndex];
            const newStatus: CardStatus = isCorrect
                ? (card.status === 'new' ? 'learning' : card.status === 'learning' ? 'review' : 'mastered')
                : 'learning';

            // Track for batch update at session end
            setPendingUpdates(prev => [...prev, { id: card.id, status: newStatus }]);

            // Update local state only
            const updatedCards = [...flashcardData];
            updatedCards[cardIndex] = { ...card, status: newStatus };
            setFlashcardData(updatedCards);
        }

        // Exam mode (no feedback) - don't show answer, let user navigate manually
        if (!settings.answerFeedback) {
            // Don't auto-advance - user uses Previous/Next/Finish buttons
            return;
        }

        // Feedback mode - show answer
        setShowAnswer(true);

        if (isCorrect) {
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > 1 && newStreak % 3 === 0) {
                setToastMessage(`${newStreak} in a row!`);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        } else {
            setStreak(0);
        }

        // Auto next after configured duration if enabled
        if (settings.autoNextAfterAnswer) {
            let count = settings.autoNextDuration;
            const tick = () => {
                count--;
                if (count <= 0) {
                    nextQuestion();
                } else {
                    timerRef.current = setTimeout(tick, 1000);
                }
            };
            timerRef.current = setTimeout(tick, 1000);
        }
    };

    const startOver = () => {
        // Regenerate with current settings
        setStage("generating");
        setPendingUpdates([]); // Reset pending updates for new session
        setTimeout(() => {
            const count = settings.cardCount === "max" ? flashcardData.length : settings.cardCount;
            const generated = generateQuestionsFromCards(flashcardData, settings.enabledQuestionTypes as QuestionType[], count);
            setQuestions(generated);
            setCurrentQuestionIndex(0);
            setShowAnswer(false);
            setStreak(0);
            setFinalXpEarned(0);
            setStage("take");
        }, 1500);
    };



    const calculateScore = () => {
        const correct = questions.filter(q => q.isCorrect).length;
        return { correct, total: questions.length, percentage: Math.round((correct / questions.length) * 100) };
    };

    const currentQuestion = questions[currentQuestionIndex];

    // Keyboard shortcuts handler - disabled for now to avoid SSR issues
    // TODO: Re-enable with proper useEffect if needed

    // Get XP stats from store
    const xpStats = useXPStore((state) => state.stats);

    // Results screen renders as full page
    if (stage === "results") {
        const score = calculateScore();

        // Only show incorrect answers
        const incorrectQuestions = questions.filter(q => !q.isCorrect);
        const resultItems = incorrectQuestions.map(q => {
            const fc = flashcardData.find(f => f.id === q.id);
            return {
                id: q.id,
                term: fc?.term || q.correctAnswer,
                definition: fc?.definition || q.question,
                status: 'incorrect' as 'new' | 'learning' | 'almost_done' | 'mastered' | 'incorrect'
            };
        });

        return (
            <SessionResultPage
                level={xpStats?.currentLevel || 1}
                currentXp={xpStats?.xpInLevel || 0}
                requiredXp={xpStats?.xpForNext || 100}
                xpEarned={finalXpEarned}
                correctCount={score.correct}
                totalCount={score.total}
                items={resultItems}
                onContinue={() => router.back()}
                onTryAgain={startOver}
                title="Practice test complete, keep going!"
                hideStudyProgress={true}
                continueButtonText="Exit"
            />
        );
    }

    if (stage === "loading") {
        return (
            <div className="min-h-screen bg-[#f0f0ea] flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-[#171d2b]/40" />
            </div>
        );
    }

    return (
        <div className="bg-[#f0f0ea] min-h-screen flex justify-center">
            <EncouragementToast message={toastMessage} isVisible={showToast} onClose={() => setShowToast(false)} />
            <main className="w-full max-w-[900px] px-4 sm:px-8 py-8">
                <AnimatePresence mode="wait">
                    {/* Config Screen - Shows settings modal */}
                    {stage === "config" && (
                        <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-[60vh] flex flex-col items-center justify-center text-center">
                            <PracticeSettingsModal
                                isOpen={showSettings}
                                onClose={handleSettingsClose}
                                onSave={handleSettingsSave}
                                totalCards={flashcardData.length}
                                currentSettings={settings}
                            />
                            <div className="mb-8"><FloatingOrb state="idle" /></div>
                            <h3 className="font-sora text-2xl font-bold text-[#171d2b] mb-2">Practice Test</h3>
                            <p className="text-[#171d2b]/60 mb-6">Configure your test settings</p>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="px-8 py-3 bg-[#171d2b] text-white font-semibold rounded-xl hover:bg-[#2a3347] transition-colors"
                            >
                                Open Settings
                            </button>
                        </motion.div>
                    )}

                    {/* Generating Screen - Lazy Load Skeleton */}
                    {stage === "generating" && (
                        <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            {/* Header skeleton */}
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                                <div className="w-32 h-6 bg-gray-200 rounded-lg animate-pulse" />
                                <div className="w-20 h-10 bg-gray-200 rounded-full animate-pulse" />
                            </div>

                            {/* Progress bar skeleton */}
                            <div className="w-full h-2 bg-gray-200 rounded-full animate-pulse" />

                            {/* Question card skeleton */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[200px]">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="w-36 h-4 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-24 h-6 bg-gray-200 rounded-full animate-pulse" />
                                </div>
                                <div className="space-y-3">
                                    <div className="w-full h-5 bg-gray-200 rounded animate-pulse" />
                                    <div className="w-3/4 h-5 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>

                            {/* Answer options skeleton */}
                            <div className="grid gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="w-full p-4 rounded-xl border-2 border-gray-200 bg-white flex items-center gap-4">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                                        <div className="flex-1 h-5 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Take Test Screen */}
                    {stage === "take" && currentQuestion && (
                        <motion.div key="take" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                            <ExitPopup isOpen={showExitPopup} onClose={() => setShowExitPopup(false)} onExit={() => { setShowExitPopup(false); router.back(); }} xpToLose={questions.filter(q => q.isCorrect).length * XP_REWARDS.FLASHCARD_CORRECT} currentLevel={xpStats?.currentLevel || 1} currentXp={xpStats?.xpInLevel || 0} maxXp={xpStats?.xpForNext || 100} nextLevel={(xpStats?.currentLevel || 1) + 1} />
                            <PracticeSettingsModal
                                isOpen={showSettings}
                                onClose={handleSettingsClose}
                                onSave={handleSettingsSave}
                                totalCards={flashcardData.length}
                                currentSettings={settings}
                            />
                            <div className="flex items-center justify-between mb-4">
                                <button onClick={() => setShowExitPopup(true)} className="p-2 hover:bg-[#171d2b]/5 rounded-full transition-colors"><X size={24} /></button>
                                <span className="font-sora font-semibold text-[#171d2b]">Practice Test</span>
                                <button
                                    onClick={() => setShowSettings(true)}
                                    className="px-3 sm:px-4 py-2 bg-white border border-gray-200 rounded-full font-semibold text-[#171d2b] text-xs sm:text-sm hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Options
                                </button>
                            </div>
                            {/* Progress bar - clickable in exam mode */}
                            {!settings.answerFeedback ? (
                                <div className="w-full flex gap-1.5">
                                    {questions.map((q, i) => {
                                        const isAnswered = q.userAnswer !== undefined;
                                        const isCurrent = i === currentQuestionIndex;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setCurrentQuestionIndex(i)}
                                                className={`flex-1 h-2 rounded-full transition-all ${isAnswered || isCurrent ? 'bg-[#171d2b]' : 'bg-[#171d2b]/10'
                                                    } hover:opacity-80`}
                                                title={`Question ${i + 1}${isAnswered ? ' (answered)' : ''}`}
                                            />
                                        );
                                    })}
                                </div>
                            ) : (
                                <AnimatedProgress value={currentQuestionIndex + 1} total={questions.length} color="#171d2b" />
                            )}

                            {/* Question Card */}
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 min-h-[200px] flex flex-col mb-6">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-gray-500 text-sm font-medium">Question {currentQuestionIndex + 1} of {questions.length}</span>
                                    <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-[#171d2b]">{QUESTION_TYPE_LABELS[currentQuestion.type]}</span>
                                </div>
                                <h3 className="font-sora text-xl font-medium text-[#171d2b] leading-relaxed">{currentQuestion.question}</h3>
                            </div>

                            {/* Answer Section */}
                            <div className="flex-1">
                                {currentQuestion.type === "multipleChoice" && currentQuestion.options && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {currentQuestion.options.map((opt, i) => {
                                            const isSelected = currentQuestion.userAnswer === opt;
                                            const isCorrectAnswer = opt === currentQuestion.correctAnswer;
                                            const showFeedbackColors = settings.answerFeedback && showAnswer;

                                            let borderClass = "border-gray-200";
                                            let bgClass = "bg-white";
                                            let textClass = "text-[#171d2b]";

                                            if (showFeedbackColors) {
                                                if (isCorrectAnswer) {
                                                    borderClass = "border-green-500";
                                                    bgClass = "bg-green-50";
                                                    textClass = "text-green-700";
                                                } else if (isSelected) {
                                                    borderClass = "border-red-500";
                                                    bgClass = "bg-red-50";
                                                    textClass = "text-red-700";
                                                } else {
                                                    bgClass = "bg-gray-50";
                                                    textClass = "text-gray-400";
                                                }
                                            } else if (isSelected) {
                                                borderClass = "border-[#171d2b]";
                                                bgClass = "bg-gray-50";
                                            }

                                            return (
                                                <button key={i} onClick={() => !showFeedbackColors && handleAnswer(opt)} disabled={showFeedbackColors}
                                                    className={`w-full p-4 rounded-xl border-2 text-left font-medium transition-all flex items-center gap-4 ${borderClass} ${bgClass} ${textClass} hover:shadow-md`}>
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${showFeedbackColors && isCorrectAnswer ? "bg-green-200 text-green-700" :
                                                        showFeedbackColors && isSelected ? "bg-red-200 text-red-700" :
                                                            "bg-blue-100 text-blue-600"
                                                        }`}>
                                                        {String.fromCharCode(65 + i)}
                                                    </div>
                                                    {opt}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                {currentQuestion.type === "trueFalse" && (
                                    <div className="space-y-4">
                                        {/* Show the term being asked about */}
                                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
                                            <span className="text-xs text-gray-500 block mb-1">Is this the correct term?</span>
                                            <p className="text-lg font-semibold text-[#171d2b]">{currentQuestion.tfDisplayedTerm}</p>
                                        </div>

                                        {/* Show correct term after answer if wrong - only in feedback mode */}
                                        {settings.answerFeedback && showAnswer && !currentQuestion.tfIsCorrectPairing && (
                                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                                                <span className="text-xs text-green-600 block mb-1">Correct Term</span>
                                                <p className="text-lg font-semibold text-green-700">
                                                    {flashcardData.find(c => c.id === currentQuestion.id)?.term}
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            {["true", "false"].map((val, i) => {
                                                const isSelected = currentQuestion.userAnswer === val;
                                                const isCorrectAnswer = val === currentQuestion.correctAnswer;
                                                const showFeedbackColors = settings.answerFeedback && showAnswer;

                                                let borderClass = "border-gray-200";
                                                let bgClass = "bg-white";
                                                let textClass = "text-[#171d2b]";

                                                if (showFeedbackColors) {
                                                    if (isCorrectAnswer) {
                                                        borderClass = "border-green-500";
                                                        bgClass = "bg-green-50";
                                                        textClass = "text-green-700";
                                                    } else if (isSelected) {
                                                        borderClass = "border-red-500";
                                                        bgClass = "bg-red-50";
                                                        textClass = "text-red-700";
                                                    } else {
                                                        bgClass = "bg-gray-50";
                                                        textClass = "text-gray-400";
                                                    }
                                                } else if (isSelected) {
                                                    borderClass = "border-[#171d2b]";
                                                    bgClass = "bg-gray-50";
                                                }

                                                return (
                                                    <button key={val} onClick={() => !showFeedbackColors && handleAnswer(val)} disabled={showFeedbackColors}
                                                        className={`h-20 rounded-xl border-2 font-medium transition-all flex items-center justify-center gap-3 ${borderClass} ${bgClass} ${textClass} hover:shadow-md`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${showFeedbackColors && isCorrectAnswer ? "bg-green-200 text-green-700" :
                                                            showFeedbackColors && isSelected ? "bg-red-200 text-red-700" :
                                                                i === 0 ? "bg-blue-100 text-blue-600" : "bg-orange-100 text-orange-600"
                                                            }`}>
                                                            {i + 1}
                                                        </div>
                                                        {val === "true" ? "True" : "False"}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                                {currentQuestion.type === "fillBlank" && (
                                    <div>
                                        <input
                                            type="text"
                                            placeholder="Type your answer..."
                                            disabled={settings.answerFeedback && showAnswer}
                                            defaultValue={currentQuestion.userAnswer || ""}
                                            key={`fillblank-${currentQuestionIndex}`}
                                            onBlur={e => {
                                                // Auto-save on blur in exam mode
                                                if (!settings.answerFeedback && e.target.value.trim()) {
                                                    handleAnswer(e.target.value);
                                                }
                                            }}
                                            onKeyDown={e => {
                                                if (e.key === "Enter" && !(settings.answerFeedback && showAnswer)) {
                                                    handleAnswer((e.target as HTMLInputElement).value);
                                                }
                                            }}
                                            className={`w-full p-4 rounded-xl border-2 focus:outline-none text-lg bg-white placeholder:text-gray-400 ${currentQuestion.userAnswer
                                                    ? 'border-[#171d2b] bg-gray-50'
                                                    : 'border-gray-200 focus:border-[#171d2b]'
                                                }`}
                                        />
                                        {!(settings.answerFeedback && showAnswer) && !currentQuestion.userAnswer && (
                                            <p className="text-gray-400 text-xs mt-2 ml-1">{settings.answerFeedback ? 'Press Enter to submit' : 'Type and navigate away or press Enter'}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Feedback Message - Only in feedback mode */}
                            {settings.answerFeedback && showAnswer && (
                                <div className="mb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {currentQuestion.isCorrect ? (
                                        <h3 className="text-[#2D9F83] font-bold text-lg flex items-center gap-2">
                                            Nice work! That&apos;s some impressive stuff!
                                        </h3>
                                    ) : (
                                        <h3 className="text-[#FF6B6B] font-bold text-lg flex items-center gap-2">
                                            No worries, you&apos;re still learning.
                                        </h3>
                                    )}
                                    {!currentQuestion.isCorrect && (
                                        <p className="text-[#171d2b]/80 text-sm mt-2">Correct answer: <span className="font-bold">{currentQuestion.correctAnswer}</span></p>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}


                </AnimatePresence>
            </main>

            {/* Bottom Bar - Exam Mode Navigation */}
            <AnimatePresence>
                {stage === "take" && !settings.answerFeedback && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40"
                    >
                        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                            {currentQuestionIndex > 0 ? (
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                                    className="px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gray-100 text-[#171d2b] font-bold hover:bg-gray-200 transition-colors text-sm sm:text-base"
                                >
                                    Previous
                                </button>
                            ) : (
                                <div className="w-[88px] sm:w-[106px]" />
                            )}
                            <span className="text-sm text-[#171d2b]/60 font-medium">
                                {questions.filter(q => q.userAnswer !== undefined).length} of {questions.length} answered
                            </span>
                            {currentQuestionIndex === questions.length - 1 ? (
                                <button
                                    onClick={() => {
                                        const correct = questions.filter(q => q.isCorrect).length;
                                        const xpEarned = correct * XP_REWARDS.FLASHCARD_CORRECT;
                                        setFinalXpEarned(xpEarned);

                                        const persistResults = async () => {
                                            // Batch update all flashcard statuses in one request
                                            if (pendingUpdates.length > 0) {
                                                await batchUpdateFlashcardStatuses(pendingUpdates);
                                            }

                                            if (xpEarned > 0) {
                                                await addXP(xpEarned);
                                                useXPStore.getState().fetchXPStats();
                                            }
                                            await recordStudyActivity({ quizzes: 1 });
                                        };
                                        persistResults();

                                        setStage("results");
                                    }}
                                    disabled={questions.some(q => q.userAnswer === undefined)}
                                    className={`px-6 sm:px-8 py-2 sm:py-3 rounded-full font-bold transition-colors text-sm sm:text-base ${questions.some(q => q.userAnswer === undefined)
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#2D9F83] text-white hover:bg-[#258a70]'
                                        }`}
                                >
                                    Finish Test
                                </button>
                            ) : (
                                <button
                                    onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                    disabled={currentQuestion?.userAnswer === undefined}
                                    className={`px-4 sm:px-6 py-2 sm:py-3 rounded-full font-bold transition-colors text-sm sm:text-base ${currentQuestion?.userAnswer === undefined
                                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                            : 'bg-[#171d2b] text-white hover:bg-[#2a3347]'
                                        }`}
                                >
                                    Next
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Bar with Bird Mascot - Feedback Mode */}
            <AnimatePresence>
                {stage === "take" && settings.answerFeedback && showAnswer && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 sm:p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40"
                    >
                        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 relative">
                            <div className="hidden md:block text-[#171d2b]/60 font-medium">
                                {currentQuestion.isCorrect ? "Great job!" : "Keep practicing!"}
                            </div>

                            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto sm:ml-auto relative">
                                <div className="relative">
                                    {/* Mascot - Sitting on top of button */}
                                    <div className="absolute -top-[44px] sm:-top-[54px] left-1/2 -translate-x-1/2 pointer-events-none z-20">
                                        {currentQuestion.isCorrect ? (
                                            <HappyBirdMascot className="w-14 h-14 sm:w-[68px] sm:h-[68px]" />
                                        ) : (
                                            <SadBirdMascot className="w-14 h-14 sm:w-[68px] sm:h-[68px]" />
                                        )}
                                    </div>
                                    <button
                                        onClick={nextQuestion}
                                        className="px-6 sm:px-8 py-2 sm:py-3 rounded-full bg-[#2D9F83] text-white font-bold hover:bg-[#258a70] transition-colors flex items-center gap-2 relative z-10 text-sm sm:text-base"
                                    >
                                        {currentQuestionIndex === questions.length - 1 ? "See Results" : "Next"}
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
