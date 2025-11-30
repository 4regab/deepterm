"use client";

import { useState } from "react";
import { X, HelpCircle } from "lucide-react";
import { StudySettings, QuestionType, getStudySettings, saveStudySettings } from "@/utils/studySettings";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (settings: StudySettings) => void;
}

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
    mcq: 'Multiple Choice',
    truefalse: 'True / False',
    written: 'Written',
    flashcard: 'Flashcard',
};

// Moved outside component to avoid "creating components during render" error
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
    <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-[#171d2b]' : 'bg-gray-300'}`}
    >
        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-7' : 'left-1'}`} />
    </button>
);

const SectionHeader = ({ title, helpText }: { title: string; helpText?: string }) => (
    <div className="flex items-center gap-2 mb-4">
        <h3 className="font-sora font-semibold text-[#171d2b] text-sm">{title}</h3>
        {helpText && <HelpCircle size={14} className="text-gray-400 cursor-help" />}
    </div>
);

export default function StudySettingsModal({ isOpen, onClose, onSave }: Props) {
    const [settings, setSettings] = useState<StudySettings>(() => getStudySettings());

    if (!isOpen) return null;

    const handleToggleType = (type: QuestionType) => {
        const current = settings.enabledQuestionTypes;
        const updated = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];

        if (updated.length === 0) return;
        setSettings(prev => ({ ...prev, enabledQuestionTypes: updated }));
    };

    const handleSave = () => {
        const saved = saveStudySettings(settings);
        onSave(saved);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="font-sora font-bold text-xl text-[#171d2b]">Learn Options</h2>
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
                                    Length of Rounds <HelpCircle size={14} className="text-gray-400" />
                                </span>
                                <select
                                    value={settings.cardsPerRound}
                                    onChange={(e) => setSettings(prev => ({ ...prev, cardsPerRound: Number(e.target.value) }))}
                                    className="p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#171d2b]"
                                >
                                    {[5, 7, 10, 15, 20, 25, 30].map(n => (
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
                            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map(type => (
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

                    {/* Question Format */}
                    <div>
                        <SectionHeader title="Question Format" />
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#171d2b]/80 flex items-center gap-2">
                                    Answer with Term <HelpCircle size={14} className="text-gray-400" />
                                </span>
                                <Toggle
                                    checked={settings.frontSide === 'definition'}
                                    onChange={() => setSettings(prev => ({ ...prev, frontSide: 'definition' }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#171d2b]/80 flex items-center gap-2">
                                    Answer with Definition <HelpCircle size={14} className="text-gray-400" />
                                </span>
                                <Toggle
                                    checked={settings.frontSide === 'term'}
                                    onChange={() => setSettings(prev => ({ ...prev, frontSide: 'term' }))}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Learning Options */}
                    <div>
                        <SectionHeader title="Learning Options" />
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
                                    Smart grading <HelpCircle size={14} className="text-gray-400" />
                                </span>
                                <Toggle
                                    checked={settings.smartGrading}
                                    onChange={() => setSettings(prev => ({ ...prev, smartGrading: !prev.smartGrading }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#171d2b]/80 flex items-center gap-2">
                                    Re-type answers <HelpCircle size={14} className="text-gray-400" />
                                </span>
                                <Toggle
                                    checked={settings.retypeAnswers}
                                    onChange={() => setSettings(prev => ({ ...prev, retypeAnswers: !prev.retypeAnswers }))}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-[#171d2b]/80">Allow override wrong answers</span>
                                <Toggle
                                    checked={settings.overrideWrong}
                                    onChange={() => setSettings(prev => ({ ...prev, overrideWrong: !prev.overrideWrong }))}
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

                <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-white">
                    <button
                        onClick={() => setSettings(getStudySettings())}
                        className="px-6 py-3 text-red-500 font-semibold border border-red-200 rounded-xl hover:bg-red-50 transition-colors text-sm"
                    >
                        Reset progress & restart
                    </button>
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
