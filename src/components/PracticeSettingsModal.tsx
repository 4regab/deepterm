"use client";

import { useState } from "react";
import { X, HelpCircle } from "lucide-react";

export type PracticeQuestionType = "multipleChoice" | "trueFalse" | "fillBlank";

export interface PracticeSettings {
    cardCount: number | "max";
    enabledQuestionTypes: PracticeQuestionType[];
    shuffleTerms: boolean;
    autoNextAfterAnswer: boolean;
    autoNextDuration: number;
    answerFeedback: boolean;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: PracticeSettings) => void;
    totalCards: number;
    currentSettings: PracticeSettings;
}

const QUESTION_TYPE_LABELS: Record<PracticeQuestionType, string> = {
    multipleChoice: "Multiple Choice",
    trueFalse: "True / False",
    fillBlank: "Fill in Blank",
};

const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative ${checked ? "bg-[#171d2b]" : "bg-gray-300"}`}
    >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "left-7" : "left-1"}`} />
    </button>
);

const SectionHeader = ({ title, helpText }: { title: string; helpText?: string }) => (
    <div className="flex items-center gap-2 mb-4">
        <h3 className="font-sora font-semibold text-[#171d2b] text-sm">{title}</h3>
        {helpText && <HelpCircle size={14} className="text-gray-400 cursor-help" />}
    </div>
);

export default function PracticeSettingsModal({ isOpen, onClose, onSave, totalCards, currentSettings }: Props) {
    const [settings, setSettings] = useState<PracticeSettings>(currentSettings);
    const [prevSettings, setPrevSettings] = useState<PracticeSettings>(currentSettings);

    // Sync local state when currentSettings prop changes (modal reopens with new settings)
    if (currentSettings !== prevSettings) {
        setSettings(currentSettings);
        setPrevSettings(currentSettings);
    }

    if (!isOpen) return null;

    const handleToggleType = (type: PracticeQuestionType) => {
        const current = settings.enabledQuestionTypes;
        const updated = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];

        if (updated.length === 0) return;
        setSettings(prev => ({ ...prev, enabledQuestionTypes: updated }));
    };

    const handleSave = () => {
        onSave(settings);
        // Don't call onClose here - parent handles closing after processing save
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="font-sora font-bold text-xl text-[#171d2b]">Practice Options</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-[#171d2b]" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* General Section */}
                    <div>
                        <SectionHeader title="General" />
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#171d2b]/80 flex items-center gap-2">
                                    Number of Questions <HelpCircle size={14} className="text-gray-400" />
                                </span>
                                <select
                                    value={settings.cardCount}
                                    onChange={(e) => setSettings(prev => ({ 
                                        ...prev, 
                                        cardCount: e.target.value === "max" ? "max" : Number(e.target.value) 
                                    }))}
                                    className="p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#171d2b]"
                                >
                                    <option value="max">All ({totalCards})</option>
                                    {[5, 10, 15, 20, 25, 30].filter(n => n <= totalCards).map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Question Types */}
                    <div>
                        <SectionHeader title="Question Types" />
                        <div className="space-y-3">
                            {(Object.keys(QUESTION_TYPE_LABELS) as PracticeQuestionType[]).map(type => (
                                <div key={type} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-[#171d2b]/80">{QUESTION_TYPE_LABELS[type]}</span>
                                    <Toggle
                                        checked={settings.enabledQuestionTypes.includes(type)}
                                        onChange={() => handleToggleType(type)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Practice Options */}
                    <div>
                        <SectionHeader title="Practice Options" />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#171d2b]/80">Shuffle terms</span>
                                <Toggle
                                    checked={settings.shuffleTerms}
                                    onChange={() => setSettings(prev => ({ ...prev, shuffleTerms: !prev.shuffleTerms }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#171d2b]/80 flex items-center gap-2">
                                    Answer Feedback
                                    <div className="relative group">
                                        <HelpCircle size={14} className="text-gray-400 cursor-help" />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#171d2b] text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 text-center z-50">
                                            When off, answers won&apos;t be shown after each question - mimics real exam conditions. Results shown at the end.
                                        </div>
                                    </div>
                                </span>
                                <Toggle
                                    checked={settings.answerFeedback}
                                    onChange={() => setSettings(prev => ({ ...prev, answerFeedback: !prev.answerFeedback }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#171d2b]/80 flex items-center gap-2">
                                    Auto next after answer <HelpCircle size={14} className="text-gray-400" />
                                </span>
                                <Toggle
                                    checked={settings.autoNextAfterAnswer}
                                    onChange={() => setSettings(prev => ({ ...prev, autoNextAfterAnswer: !prev.autoNextAfterAnswer }))}
                                />
                            </div>
                            {settings.autoNextAfterAnswer && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-[#171d2b]/80">Duration (seconds)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={settings.autoNextDuration}
                                        onChange={(e) => {
                                            const val = Math.max(1, Math.min(5, Number(e.target.value) || 1));
                                            setSettings(prev => ({ ...prev, autoNextDuration: val }));
                                        }}
                                        className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#171d2b]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 flex items-center justify-end bg-white">
                    <button
                        onClick={handleSave}
                        className="px-8 py-3 bg-[#171d2b] text-white font-semibold rounded-xl hover:bg-[#2a3347] transition-colors text-sm"
                    >
                        Save options
                    </button>
                </div>
            </div>
        </div>
    );
}
