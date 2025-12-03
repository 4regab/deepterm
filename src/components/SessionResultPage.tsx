"use client";

import React from "react";
import { Pencil } from "lucide-react";
import { HappyBirdMascot, SadBirdMascot } from "./EmotionalAssets";

export type ItemStatus = 'new' | 'learning' | 'almost_done' | 'mastered' | 'incorrect';

export interface ResultItem {
    id: string;
    term: string;
    definition: string;
    status: ItemStatus;
}

interface SessionResultPageProps {
    level?: number;
    currentXp?: number;
    requiredXp?: number;
    xpEarned?: number;
    correctCount: number;
    totalCount: number;
    items: ResultItem[];
    onContinue: () => void;
    onExit?: () => void;
    onTryAgain?: () => void;
    title?: string;
    hideStudyProgress?: boolean;
    continueButtonText?: string;
    showPressAnyKey?: boolean;
}

const StatusBadge = ({ status }: { status: ItemStatus }) => {
    const styles = {
        new: "bg-pink-100 text-pink-600",
        learning: "bg-purple-100 text-purple-600",
        almost_done: "bg-blue-100 text-blue-600",
        mastered: "bg-green-100 text-green-600",
        incorrect: "bg-red-100 text-red-600"
    };

    const labels = {
        new: "New cards",
        learning: "Still learning",
        almost_done: "Almost done",
        mastered: "Mastered",
        incorrect: "Incorrect"
    };

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 w-fit ${styles[status]}`}>
            <div className={`w-2 h-2 rounded-full border-2 border-current`} />
            {labels[status]}
        </span>
    );
};

const ProgressBar = ({ value, max, colorClass }: { value: number, max: number, colorClass: string }) => {
    return (
        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full ${colorClass}`}
                style={{ width: `${(value / max) * 100}%` }}
            />
        </div>
    );
};

export default function SessionResultPage({
    level = 1,
    currentXp = 0,
    requiredXp = 100,
    xpEarned = 0,
    correctCount,
    totalCount,
    items,
    onContinue,
    onExit,
    onTryAgain,
    title = "You're doing great, keep going!",
    hideStudyProgress = false,
    continueButtonText = "Next",
    showPressAnyKey = true
}: SessionResultPageProps) {

    // Calculate stats
    const stats = {
        new: items.filter(i => i.status === 'new').length,
        learning: items.filter(i => i.status === 'learning').length,
        almost_done: items.filter(i => i.status === 'almost_done').length,
        mastered: items.filter(i => i.status === 'mastered').length,
        total: items.length
    };

    const progressPercentage = Math.round(((stats.mastered + stats.almost_done * 0.5) / stats.total) * 100) || 0;

    return (
        <div className="min-h-screen bg-[#f0f0ea] py-12 px-4 flex flex-col items-center">

            {/* Mascot & Title */}
            <div className="text-center mb-8">
                <div className="w-32 h-32 mx-auto mb-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                        {Math.round((correctCount / totalCount) * 100) >= 50 ? (
                            <HappyBirdMascot className="w-28 h-28" />
                        ) : (
                            <SadBirdMascot className="w-28 h-28" />
                        )}
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-[#171d2b]">
                    {Math.round((correctCount / totalCount) * 100) >= 50 ? title : "Don't give up, keep practicing!"}
                </h1>
            </div>

            {/* Main Stats Card */}
            <div className="w-full max-w-4xl bg-white rounded-3xl p-6 shadow-sm border border-gray-100 mb-8">
                <div className="flex flex-col md:flex-row items-center gap-4">
                    {/* Level Progress */}
                    <div className="flex-1 w-full">
                        <div className="flex justify-between mb-2">
                            <span className="font-bold text-[#171d2b] text-sm">Level {level}</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                            <div
                                className="absolute top-0 left-0 h-full bg-[#8B5CF6] rounded-full"
                                style={{ width: `${Math.min((currentXp / requiredXp) * 100, 100)}%` }}
                            />
                        </div>
                        <div className="mt-1 text-xs text-gray-400 font-medium">{currentXp}/{requiredXp}XP</div>
                    </div>

                    {/* Session Stats */}
                    <div className="flex gap-4 w-full md:w-auto">
                        <div className="flex-1 md:flex-none bg-gray-50 rounded-xl p-3 text-center min-w-[100px]">
                            <div className="text-xl font-bold text-[#171d2b]">{correctCount}/{totalCount}</div>
                            <div className="text-xs text-gray-500 font-bold">Correct</div>
                        </div>
                        <div className="flex-1 md:flex-none bg-blue-50 rounded-xl p-3 text-center min-w-[100px] flex flex-col items-center justify-center">
                            <div className="text-xl font-bold text-blue-600 flex items-center gap-1">
                                {xpEarned} <Pencil size={14} className="fill-current" />
                            </div>
                            <div className="text-xs text-blue-400 font-bold">XP Earned</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Action Bar */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-white rounded-full shadow-xl border border-gray-100 p-2 pl-6 flex items-center gap-4">
                    {showPressAnyKey && !onTryAgain && !onExit && <span className="text-[#171d2b] font-bold text-sm hidden sm:block">Press any key to continue</span>}
                    {onExit && (
                        <button
                            onClick={onExit}
                            className="bg-gray-100 text-[#171d2b] px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
                        >
                            Exit
                        </button>
                    )}
                    {onTryAgain && (
                        <button
                            onClick={onContinue}
                            className="bg-gray-100 text-[#171d2b] px-6 py-3 rounded-full font-bold hover:bg-gray-200 transition-colors"
                        >
                            {continueButtonText}
                        </button>
                    )}
                    <button
                        onClick={onTryAgain ? onTryAgain : onContinue}
                        className="bg-[#2D9F83] text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-[#258a70] transition-colors"
                    >
                        {onTryAgain ? (<><span className="sm:hidden">Again</span><span className="hidden sm:inline">Try Again</span></>) : onExit ? "Next" : continueButtonText} {!onTryAgain && !onExit && continueButtonText === "Next" && <Pencil size={16} className="fill-current" />}
                    </button>
                </div>
            </div>

            {/* Studying Progress */}
            {!hideStudyProgress && (
                <div className="w-full max-w-4xl bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="font-bold text-[#171d2b]">Studying Progress</h2>
                        <span className="bg-gray-100 text-[#171d2b] px-3 py-1 rounded-full text-sm font-bold">{progressPercentage}%</span>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                <div className="w-3 h-3 rounded-full border-2 border-current" />
                            </div>
                            <span className="w-32 text-sm font-bold text-gray-600">New cards</span>
                            <ProgressBar value={stats.new} max={stats.total} colorClass="bg-pink-400" />
                            <span className="w-8 text-right font-bold text-[#171d2b]">{stats.new}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                <div className="w-3 h-3 rounded-full border-2 border-current" />
                            </div>
                            <span className="w-32 text-sm font-bold text-gray-600">Still learning</span>
                            <ProgressBar value={stats.learning} max={stats.total} colorClass="bg-purple-400" />
                            <span className="w-8 text-right font-bold text-[#171d2b]">{stats.learning}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                <div className="w-3 h-3 rounded-full border-2 border-current" />
                            </div>
                            <span className="w-32 text-sm font-bold text-gray-600">Almost done</span>
                            <ProgressBar value={stats.almost_done} max={stats.total} colorClass="bg-blue-400" />
                            <span className="w-8 text-right font-bold text-[#171d2b]">{stats.almost_done}</span>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                <div className="w-3 h-3 rounded-full border-2 border-current" />
                            </div>
                            <span className="w-32 text-sm font-bold text-gray-600">Mastered</span>
                            <ProgressBar value={stats.mastered} max={stats.total} colorClass="bg-green-400" />
                            <span className="w-8 text-right font-bold text-[#171d2b]">{stats.mastered}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Items List */}
            <div className="w-full max-w-4xl space-y-4 pb-24">
                {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-[#171d2b] uppercase tracking-wide">{item.term}</h3>
                            <StatusBadge status={item.status} />
                        </div>
                        <p className="text-gray-500 text-sm leading-relaxed">{item.definition}</p>
                    </div>
                ))}
            </div>

        </div>
    );
}
