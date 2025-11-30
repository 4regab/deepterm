"use client";

import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { useState } from "react";
import { useActivityStore } from "@/lib/stores";
import { generateMonthGrid, type CalendarDay } from "@/utils/calendar";

// Warm amber/orange gradient for activity levels (brand consistent)
const LEVEL_COLORS = [
    "bg-[#f5f5f0]",
    "bg-[#f5e6c8]",
    "bg-[#e8c896]",
    "bg-[#d4a574]",
    "bg-[#c4875a]",
] as const;

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

function CalendarSkeleton() {
    return (
        <div className="flex items-center justify-center py-12">
            <div className="w-5 h-5 border-2 border-[#171d2b] border-t-transparent rounded-full animate-spin" />
        </div>
    );
}

interface CalendarDayCellProps {
    day: CalendarDay;
}

function CalendarDayCell({ day }: CalendarDayCellProps) {
    const [showTooltip, setShowTooltip] = useState(false);
    const isToday = day.isToday;
    const isCurrentMonth = day.isCurrentMonth;
    
    return (
        <div
            className="relative flex items-center justify-center"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <div
                className={`
                    w-full h-14 flex items-center justify-center text-xs font-medium
                    border-b border-r border-[#171d2b]/10
                    transition-colors cursor-default
                    ${LEVEL_COLORS[day.level]}
                    ${isToday ? "ring-2 ring-[#c4875a] ring-inset" : ""}
                    ${isCurrentMonth ? "text-[#171d2b]" : "text-[#171d2b]/30"}
                    hover:bg-[#171d2b]/5
                `}
            >
                {day.dayOfMonth}
            </div>
            {showTooltip && isCurrentMonth && day.minutesStudied > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#171d2b] text-white text-xs rounded-lg whitespace-nowrap z-20 shadow-lg">
                    <div className="font-medium">{day.minutesStudied} min studied</div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#171d2b]" />
                </div>
            )}
        </div>
    );
}

export default function StudyCalendar() {
    const { activity, loading } = useActivityStore();
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());

    const grid = generateMonthGrid(currentYear, currentMonth, activity);

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-[#171d2b]/5 shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="bg-[#f5e6c8] px-3 py-2 border-b border-[#171d2b]/5">
                <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[#171d2b]/70" />
                    <h2 className="font-serif-4 text-sm text-[#171d2b]">Study History</h2>
                </div>
            </div>

            {/* Month navigation */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#171d2b]/10 bg-white">
                <button
                    onClick={handlePrevMonth}
                    className="w-7 h-7 flex items-center justify-center border border-[#171d2b]/20 rounded hover:bg-[#171d2b]/5 transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeft size={16} className="text-[#171d2b]" />
                </button>
                <span className="font-serif text-sm text-[#171d2b] font-semibold">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
                <button
                    onClick={handleNextMonth}
                    className="w-7 h-7 flex items-center justify-center border border-[#171d2b]/20 rounded hover:bg-[#171d2b]/5 transition-colors"
                    aria-label="Next month"
                >
                    <ChevronRight size={16} className="text-[#171d2b]" />
                </button>
            </div>

            {loading ? (
                <CalendarSkeleton />
            ) : (
                <>
                    {/* Day of week headers */}
                    <div className="grid grid-cols-7 bg-[#f5f0e0]">
                        {DAY_HEADERS.map((day) => (
                            <div
                                key={day}
                                className="py-1.5 text-center text-[10px] text-[#171d2b]/70 font-semibold border-b border-r border-[#171d2b]/10 last:border-r-0"
                            >
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="grid grid-cols-7 flex-1">
                        {grid.flat().map((day, index) => (
                            <CalendarDayCell key={index} day={day} />
                        ))}
                    </div>

                    {/* Legend */}
                    <div className="flex justify-center items-center gap-2 py-2 border-t border-[#171d2b]/10">
                        <span className="text-[10px] text-[#171d2b]/60">Less</span>
                        <div className="flex gap-1">
                            {LEVEL_COLORS.map((color, i) => (
                                <div key={i} className={`w-3 h-3 rounded-sm ${color} border border-[#171d2b]/10`} />
                            ))}
                        </div>
                        <span className="text-[10px] text-[#171d2b]/60">More</span>
                    </div>
                </>
            )}
        </div>
    );
}
