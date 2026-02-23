"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useCalendarEventStore } from "@/lib/stores/calendarEventStore";
import type { CalendarEvent, CalendarEventType } from "@/lib/schemas/calendarEvent";
import { EVENT_TYPE_COLORS } from "@/lib/schemas/calendarEvent";
import EventModal from "./EventModal";

type ViewMode = "month" | "week" | "day";

const DAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
    study_session: "Study Session",
    task_deadline: "Task Deadline",
    exam: "Exam",
    pomodoro_block: "Pomodoro Block",
};

const HOUR_LABELS: string[] = Array.from({ length: 17 }, (_, i) => {
    const h = i + 6;
    return h === 12 ? "12 PM" : h < 12 ? `${h} AM` : `${h - 12} PM`;
});

function formatDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
}

function formatTime(iso: string): string {
    const d = new Date(iso);
    const h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${h12}:${m} ${ampm}`;
}

// Generate 6x7 month grid
function generateMonthDates(year: number, month: number): Date[][] {
    const first = new Date(year, month, 1);
    const startDow = first.getDay();
    const gridStart = new Date(year, month, 1 - startDow);
    const grid: Date[][] = [];
    for (let w = 0; w < 6; w++) {
        const row: Date[] = [];
        for (let d = 0; d < 7; d++) {
            const cur = new Date(gridStart);
            cur.setDate(gridStart.getDate() + w * 7 + d);
            row.push(cur);
        }
        grid.push(row);
    }
    return grid;
}

// ─── Month View ─────────────────────────────────────────────

interface MonthCellProps {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
    onSelectDay: (d: Date) => void;
    onSelectEvent: (e: CalendarEvent) => void;
}

function MonthCell({ date, isCurrentMonth, isToday, events, onSelectDay, onSelectEvent }: MonthCellProps) {
    return (
        <div
            className={`min-h-[5rem] border-b border-r border-[#171d2b]/10 p-1 cursor-pointer hover:bg-[#171d2b]/[0.03] transition-colors ${!isCurrentMonth ? "bg-[#171d2b]/[0.02]" : ""}`}
            onClick={() => onSelectDay(date)}
        >
            <div className={`text-xs font-medium mb-0.5 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? "bg-[#171d2b] text-white" : isCurrentMonth ? "text-[#171d2b]" : "text-[#171d2b]/30"}`}>
                {date.getDate()}
            </div>
            <div className="space-y-0.5">
                {events.slice(0, 3).map((ev) => (
                    <button
                        key={ev.id}
                        onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                        className="w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white font-medium"
                        style={{ backgroundColor: EVENT_TYPE_COLORS[ev.type] }}
                    >
                        {ev.title}
                    </button>
                ))}
                {events.length > 3 && (
                    <div className="text-[10px] text-[#171d2b]/50 pl-1">+{events.length - 3} more</div>
                )}
            </div>
        </div>
    );
}

// ─── Day Events Panel ─────────────────────────────────────────

interface DayPanelProps {
    date: Date;
    events: CalendarEvent[];
    onClose: () => void;
    onSelectEvent: (e: CalendarEvent) => void;
    onAddEvent: (d: Date) => void;
}

function DayPanel({ date, events, onClose, onSelectEvent, onAddEvent }: DayPanelProps) {
    return (
        <div className="bg-white rounded-xl border border-[#171d2b]/10 shadow-lg p-4 absolute right-0 top-0 w-80 z-30 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-serif text-sm font-semibold text-[#171d2b]">
                    {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                </h4>
                <button onClick={onClose} className="text-[#171d2b]/50 hover:text-[#171d2b] text-xs">✕</button>
            </div>
            {events.length === 0 ? (
                <p className="text-xs text-[#171d2b]/50">No events</p>
            ) : (
                <div className="space-y-2">
                    {events.map((ev) => (
                        <button
                            key={ev.id}
                            onClick={() => onSelectEvent(ev)}
                            className="w-full text-left p-2 rounded-lg border border-[#171d2b]/10 hover:bg-[#171d2b]/[0.03] transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: EVENT_TYPE_COLORS[ev.type] }} />
                                <span className="text-xs font-medium text-[#171d2b] truncate">{ev.title}</span>
                            </div>
                            {!ev.allDay && (
                                <div className="text-[10px] text-[#171d2b]/50 mt-0.5 pl-4">
                                    {formatTime(ev.startDateTime)} – {formatTime(ev.endDateTime)}
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
            <button
                onClick={() => onAddEvent(date)}
                className="mt-3 w-full flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-[#171d2b]/70 border border-dashed border-[#171d2b]/20 rounded-lg hover:bg-[#171d2b]/5 transition-colors"
            >
                <Plus size={12} /> Add Event
            </button>
        </div>
    );
}

// ─── Time Grid (Week & Day) ─────────────────────────────────

interface TimeGridProps {
    dates: Date[];
    eventsByDate: Map<string, CalendarEvent[]>;
    onSelectEvent: (e: CalendarEvent) => void;
    onAddEvent: (d: Date) => void;
}

function TimeGrid({ dates, eventsByDate, onSelectEvent, onAddEvent }: TimeGridProps) {
    const today = new Date();

    const GRID_START_HOUR = 6;
    const GRID_END_HOUR = 22;
    const REM_PER_HOUR = 3.5;

    function getEventPosition(ev: CalendarEvent) {
        const start = new Date(ev.startDateTime);
        const end = new Date(ev.endDateTime);
        const startHour = Math.max(GRID_START_HOUR, Math.min(GRID_END_HOUR, start.getHours() + start.getMinutes() / 60));
        const endHour = Math.max(GRID_START_HOUR, Math.min(GRID_END_HOUR, end.getHours() + end.getMinutes() / 60));
        const top = (startHour - GRID_START_HOUR) * REM_PER_HOUR;
        const height = Math.max(0.5, (endHour - startHour) * REM_PER_HOUR);
        return { top: `${top}rem`, height: `${height}rem` };
    }

    return (
        <div className="overflow-y-auto max-h-[calc(100vh-16rem)]">
            <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${dates.length}, 1fr)` }}>
                {/* Header row */}
                <div className="sticky top-0 z-10 bg-[#f0f0ea] border-b border-r border-[#171d2b]/10" />
                {dates.map((d) => (
                    <div
                        key={formatDateKey(d)}
                        className={`sticky top-0 z-10 bg-[#f0f0ea] border-b border-r border-[#171d2b]/10 px-2 py-2 text-center ${isSameDay(d, today) ? "bg-[#171d2b]/5" : ""}`}
                    >
                        <div className="text-[10px] text-[#171d2b]/50 font-medium">{DAY_HEADERS[d.getDay()]}</div>
                        <div className={`text-sm font-semibold mx-auto w-7 h-7 flex items-center justify-center rounded-full ${isSameDay(d, today) ? "bg-[#171d2b] text-white" : "text-[#171d2b]"}`}>
                            {d.getDate()}
                        </div>
                    </div>
                ))}

                {/* All-day events row */}
                <div className="border-r border-b border-[#171d2b]/10 pr-1 text-right">
                    <span className="text-[10px] text-[#171d2b]/40">All day</span>
                </div>
                {dates.map((d) => {
                    const allDayEvents = (eventsByDate.get(formatDateKey(d)) ?? []).filter((ev) => ev.allDay);
                    return (
                        <div key={`allday-${formatDateKey(d)}`} className="border-b border-r border-[#171d2b]/10 p-0.5 min-h-[1.5rem]">
                            {allDayEvents.map((ev) => (
                                <button
                                    key={ev.id}
                                    onClick={() => onSelectEvent(ev)}
                                    className="w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate text-white font-medium mb-0.5 hover:opacity-90 transition-opacity"
                                    style={{ backgroundColor: EVENT_TYPE_COLORS[ev.type] }}
                                >
                                    {ev.title}
                                </button>
                            ))}
                        </div>
                    );
                })}

                {/* Time rows */}
                {HOUR_LABELS.map((label, i) => (
                    <div key={label} className="contents">
                        <div className="border-r border-[#171d2b]/10 pr-1 text-right">
                            <span className="text-[10px] text-[#171d2b]/40 -translate-y-2 inline-block">{i === 0 ? "" : label}</span>
                        </div>
                        {dates.map((d) => (
                            <div
                                key={`${formatDateKey(d)}-${i}`}
                                className="border-b border-r border-[#171d2b]/10 h-14 relative cursor-pointer hover:bg-[#171d2b]/[0.02]"
                                onClick={() => {
                                    const nd = new Date(d);
                                    nd.setHours(i + 6, 0, 0, 0);
                                    onAddEvent(nd);
                                }}
                            >
                                {i === 0 && (eventsByDate.get(formatDateKey(d)) ?? []).map((ev) => {
                                    if (ev.allDay) return null;
                                    const pos = getEventPosition(ev);
                                    return (
                                        <button
                                            key={ev.id}
                                            onClick={(e) => { e.stopPropagation(); onSelectEvent(ev); }}
                                            className="absolute left-0.5 right-0.5 rounded px-1 text-[10px] text-white font-medium overflow-hidden z-10 hover:opacity-90 transition-opacity"
                                            style={{ backgroundColor: EVENT_TYPE_COLORS[ev.type], top: pos.top, height: pos.height, minHeight: "1.25rem" }}
                                        >
                                            <div className="truncate">{ev.title}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─── Legend ───────────────────────────────────────────────────

function Legend() {
    return (
        <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-t border-[#171d2b]/10">
            {(Object.entries(EVENT_TYPE_LABELS) as [CalendarEventType, string][]).map(([type, label]) => (
                <div key={type} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: EVENT_TYPE_COLORS[type] }} />
                    <span className="text-[10px] text-[#171d2b]/60">{label}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Main CalendarView ───────────────────────────────────────

export default function CalendarView() {
    const { events, loadFromStorage } = useCalendarEventStore();
    const [viewMode, setViewMode] = useState<ViewMode>("month");
    const today = new Date();
    const [currentDate, setCurrentDate] = useState(today);
    const [selectedDay, setSelectedDay] = useState<Date | null>(null);
    const [modalEvent, setModalEvent] = useState<CalendarEvent | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalDefaultDate, setModalDefaultDate] = useState<Date | undefined>();

    useEffect(() => {
        loadFromStorage();
    }, [loadFromStorage]);

    // Build event lookup by date
    const eventsByDate = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const ev of events) {
            const key = ev.startDateTime.slice(0, 10);
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ev);
        }
        return map;
    }, [events]);

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const goToToday = useCallback(() => setCurrentDate(new Date()), []);

    const goPrev = useCallback(() => {
        setCurrentDate((d) => {
            const nd = new Date(d);
            if (viewMode === "month") nd.setMonth(nd.getMonth() - 1);
            else if (viewMode === "week") nd.setDate(nd.getDate() - 7);
            else nd.setDate(nd.getDate() - 1);
            return nd;
        });
        setSelectedDay(null);
    }, [viewMode]);

    const goNext = useCallback(() => {
        setCurrentDate((d) => {
            const nd = new Date(d);
            if (viewMode === "month") nd.setMonth(nd.getMonth() + 1);
            else if (viewMode === "week") nd.setDate(nd.getDate() + 7);
            else nd.setDate(nd.getDate() + 1);
            return nd;
        });
        setSelectedDay(null);
    }, [viewMode]);

    const openAddModal = (date?: Date) => {
        setModalEvent(null);
        setModalDefaultDate(date);
        setModalOpen(true);
    };

    const openEditModal = (ev: CalendarEvent) => {
        setModalEvent(ev);
        setModalDefaultDate(undefined);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setModalEvent(null);
        setModalDefaultDate(undefined);
    };

    // Title text
    let headerTitle = "";
    if (viewMode === "month") {
        headerTitle = `${MONTH_NAMES[month]} ${year}`;
    } else if (viewMode === "week") {
        const ws = getWeekStart(currentDate);
        const we = new Date(ws);
        we.setDate(we.getDate() + 6);
        headerTitle = `${ws.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${we.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
        headerTitle = currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    }

    // Month grid
    const monthGrid = useMemo(() => generateMonthDates(year, month), [year, month]);

    // Week dates
    const weekDates = useMemo(() => {
        const ws = getWeekStart(currentDate);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(ws);
            d.setDate(ws.getDate() + i);
            return d;
        });
    }, [currentDate]);

    // Day dates
    const dayDates = useMemo(() => [new Date(currentDate)], [currentDate]);

    const viewModes: ViewMode[] = ["month", "week", "day"];

    return (
        <div className="bg-white rounded-xl border border-[#171d2b]/5 shadow-sm overflow-hidden flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-4 py-3 border-b border-[#171d2b]/10">
                <div className="flex items-center gap-2">
                    <button onClick={goPrev} className="w-8 h-8 flex items-center justify-center border border-[#171d2b]/20 rounded-lg hover:bg-[#171d2b]/5 transition-colors" aria-label="Previous">
                        <ChevronLeft size={16} className="text-[#171d2b]" />
                    </button>
                    <button onClick={goNext} className="w-8 h-8 flex items-center justify-center border border-[#171d2b]/20 rounded-lg hover:bg-[#171d2b]/5 transition-colors" aria-label="Next">
                        <ChevronRight size={16} className="text-[#171d2b]" />
                    </button>
                    <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium border border-[#171d2b]/20 rounded-lg hover:bg-[#171d2b]/5 transition-colors text-[#171d2b]">
                        Today
                    </button>
                    <h2 className="font-serif text-base sm:text-lg font-semibold text-[#171d2b] ml-2">{headerTitle}</h2>
                </div>
                <div className="flex items-center gap-2">
                    {/* View mode selector */}
                    <div className="flex border border-[#171d2b]/20 rounded-lg overflow-hidden">
                        {viewModes.map((vm) => (
                            <button
                                key={vm}
                                onClick={() => setViewMode(vm)}
                                className={`px-3 py-1.5 text-xs font-medium capitalize transition-colors ${viewMode === vm ? "bg-[#171d2b] text-white" : "text-[#171d2b] hover:bg-[#171d2b]/5"}`}
                            >
                                {vm}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => openAddModal()}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#171d2b] rounded-lg hover:bg-[#171d2b]/90 transition-colors"
                    >
                        <Plus size={14} /> Add Event
                    </button>
                </div>
            </div>

            {/* Content */}
            {viewMode === "month" && (
                <div className="relative">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 bg-[#f5f0e0]">
                        {DAY_HEADERS.map((d) => (
                            <div key={d} className="py-2 text-center text-[10px] text-[#171d2b]/70 font-semibold border-b border-r border-[#171d2b]/10 last:border-r-0">
                                {d}
                            </div>
                        ))}
                    </div>
                    {/* Grid */}
                    <div className="grid grid-cols-7">
                        {monthGrid.flat().map((date, idx) => (
                            <MonthCell
                                key={idx}
                                date={date}
                                isCurrentMonth={date.getMonth() === month}
                                isToday={isSameDay(date, today)}
                                events={eventsByDate.get(formatDateKey(date)) ?? []}
                                onSelectDay={(d) => setSelectedDay(d)}
                                onSelectEvent={openEditModal}
                            />
                        ))}
                    </div>
                    {/* Day panel popover */}
                    {selectedDay && (
                        <DayPanel
                            date={selectedDay}
                            events={eventsByDate.get(formatDateKey(selectedDay)) ?? []}
                            onClose={() => setSelectedDay(null)}
                            onSelectEvent={(ev) => { setSelectedDay(null); openEditModal(ev); }}
                            onAddEvent={(d) => { setSelectedDay(null); openAddModal(d); }}
                        />
                    )}
                </div>
            )}

            {viewMode === "week" && (
                <TimeGrid dates={weekDates} eventsByDate={eventsByDate} onSelectEvent={openEditModal} onAddEvent={openAddModal} />
            )}

            {viewMode === "day" && (
                <TimeGrid dates={dayDates} eventsByDate={eventsByDate} onSelectEvent={openEditModal} onAddEvent={openAddModal} />
            )}

            {/* Legend */}
            <Legend />

            {/* Modal */}
            {modalOpen && <EventModal event={modalEvent} defaultDate={modalDefaultDate} onClose={closeModal} />}
        </div>
    );
}
