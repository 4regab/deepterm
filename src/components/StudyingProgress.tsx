"use client";

import React from "react";

export type ItemStatus = 'new' | 'learning' | 'almost_done' | 'mastered';

export interface StudyItem {
    id: string;
    status: ItemStatus;
}

interface StudyingProgressProps {
    items: StudyItem[];
    className?: string;
}

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

export default function StudyingProgress({ items, className = "" }: StudyingProgressProps) {
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
        <div className={`bg-white rounded-2xl p-5 shadow-sm border border-gray-100 ${className}`}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-[#171d2b] text-sm">Studying Progress</h2>
                <span className="bg-gray-100 text-[#171d2b] px-2.5 py-1 rounded-full text-xs font-bold">{progressPercentage}%</span>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#171d2b]/10 flex items-center justify-center text-[#171d2b]">
                        <div className="w-2 h-2 rounded-full border-2 border-current" />
                    </div>
                    <span className="w-28 text-xs font-bold text-gray-600">New cards</span>
                    <ProgressBar value={stats.new} max={stats.total} colorClass="bg-[#171d2b]/80" />
                    <span className="w-6 text-right font-bold text-[#171d2b] text-sm">{stats.new}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center text-[#8B5CF6]">
                        <div className="w-2 h-2 rounded-full border-2 border-current" />
                    </div>
                    <span className="w-28 text-xs font-bold text-gray-600">Still learning</span>
                    <ProgressBar value={stats.learning} max={stats.total} colorClass="bg-[#8B5CF6]" />
                    <span className="w-6 text-right font-bold text-[#171d2b] text-sm">{stats.learning}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#60A5FA]/10 flex items-center justify-center text-[#60A5FA]">
                        <div className="w-2 h-2 rounded-full border-2 border-current" />
                    </div>
                    <span className="w-28 text-xs font-bold text-gray-600">Almost done</span>
                    <ProgressBar value={stats.almost_done} max={stats.total} colorClass="bg-[#60A5FA]" />
                    <span className="w-6 text-right font-bold text-[#171d2b] text-sm">{stats.almost_done}</span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#10B981]/10 flex items-center justify-center text-[#10B981]">
                        <div className="w-2 h-2 rounded-full border-2 border-current" />
                    </div>
                    <span className="w-28 text-xs font-bold text-gray-600">Mastered</span>
                    <ProgressBar value={stats.mastered} max={stats.total} colorClass="bg-[#10B981]" />
                    <span className="w-6 text-right font-bold text-[#171d2b] text-sm">{stats.mastered}</span>
                </div>
            </div>
        </div>
    );
}
