"use client";

import { X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import type { CalendarEvent, CalendarEventType, RecurrencePattern } from "@/lib/schemas/calendarEvent";
import { EVENT_TYPE_COLORS } from "@/lib/schemas/calendarEvent";
import { useCalendarEventStore } from "@/lib/stores/calendarEventStore";

const EVENT_TYPES: { value: CalendarEventType; label: string }[] = [
    { value: "study_session", label: "Study Session" },
    { value: "task_deadline", label: "Task Deadline" },
    { value: "exam", label: "Exam" },
    { value: "pomodoro_block", label: "Pomodoro Block" },
];

const RECURRENCE_OPTIONS: { value: RecurrencePattern; label: string }[] = [
    { value: "none", label: "None" },
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
];

function toLocalDatetime(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toLocalDate(iso: string): string {
    return toLocalDatetime(iso).slice(0, 10);
}

interface EventModalProps {
    event?: CalendarEvent | null;
    defaultDate?: Date;
    onClose: () => void;
}

export default function EventModal({ event, defaultDate, onClose }: EventModalProps) {
    const { createEvent, updateEvent, deleteEvent } = useCalendarEventStore();

    const defaultStart = defaultDate ?? new Date();
    const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

    const [title, setTitle] = useState(event?.title ?? "");
    const [type, setType] = useState<CalendarEventType>(event?.type ?? "study_session");
    const [allDay, setAllDay] = useState(event?.allDay ?? false);
    const [startDate, setStartDate] = useState(event ? toLocalDate(event.startDateTime) : toLocalDate(defaultStart.toISOString()));
    const [startTime, setStartTime] = useState(event ? toLocalDatetime(event.startDateTime).slice(11) : toLocalDatetime(defaultStart.toISOString()).slice(11));
    const [endDate, setEndDate] = useState(event ? toLocalDate(event.endDateTime) : toLocalDate(defaultEnd.toISOString()));
    const [endTime, setEndTime] = useState(event ? toLocalDatetime(event.endDateTime).slice(11) : toLocalDatetime(defaultEnd.toISOString()).slice(11));
    const [recurrence, setRecurrence] = useState<RecurrencePattern>(event?.recurrence ?? "none");
    const [notes, setNotes] = useState(event?.notes ?? "");

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
    }, [onClose]);

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const handleSave = () => {
        if (!title.trim()) return;
        const startDateTime = allDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}`;
        const endDateTime = allDay ? `${endDate}T23:59:59` : `${endDate}T${endTime}`;

        if (event) {
            updateEvent(event.id, { title, type, startDateTime, endDateTime, allDay, recurrence, notes: notes || undefined });
        } else {
            createEvent({ title, type, startDateTime, endDateTime, allDay, recurrence, notes: notes || undefined });
        }
        onClose();
    };

    const handleDelete = () => {
        if (event) {
            deleteEvent(event.id);
            onClose();
        }
    };

    const inputCls = "w-full px-3 py-2 text-sm border border-[#171d2b]/15 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#171d2b]/20 font-sans text-[#171d2b]";
    const labelCls = "block text-xs font-semibold text-[#171d2b]/70 mb-1 font-sans";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/30" />
            <div
                className="relative bg-[#f0f0ea] rounded-xl border border-[#171d2b]/10 shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#171d2b]/10">
                    <h3 className="font-serif text-lg font-semibold text-[#171d2b]">
                        {event ? "Edit Event" : "New Event"}
                    </h3>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#171d2b]/5 transition-colors" aria-label="Close">
                        <X size={18} className="text-[#171d2b]/60" />
                    </button>
                </div>

                {/* Form */}
                <div className="px-5 py-4 space-y-4">
                    {/* Title */}
                    <div>
                        <label className={labelCls}>Title</label>
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event title" className={inputCls} autoFocus />
                    </div>

                    {/* Type */}
                    <div>
                        <label className={labelCls}>Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            {EVENT_TYPES.map((t) => (
                                <button
                                    key={t.value}
                                    type="button"
                                    onClick={() => setType(t.value)}
                                    className={`flex items-center gap-2 px-3 py-2 text-xs rounded-lg border transition-colors ${
                                        type === t.value
                                            ? "border-[#171d2b]/30 bg-white shadow-sm font-semibold"
                                            : "border-[#171d2b]/10 hover:bg-white/50"
                                    }`}
                                >
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: EVENT_TYPE_COLORS[t.value] }} />
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* All Day */}
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="rounded border-[#171d2b]/20 accent-[#171d2b]" />
                        <span className="text-sm text-[#171d2b]">All day</span>
                    </label>

                    {/* Start */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>Start Date</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                        </div>
                        {!allDay && (
                            <div>
                                <label className={labelCls}>Start Time</label>
                                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputCls} />
                            </div>
                        )}
                    </div>

                    {/* End */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className={labelCls}>End Date</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                        </div>
                        {!allDay && (
                            <div>
                                <label className={labelCls}>End Time</label>
                                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputCls} />
                            </div>
                        )}
                    </div>

                    {/* Recurrence */}
                    <div>
                        <label className={labelCls}>Recurrence</label>
                        <select value={recurrence} onChange={(e) => setRecurrence(e.target.value as RecurrencePattern)} className={inputCls}>
                            {RECURRENCE_OPTIONS.map((r) => (
                                <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className={labelCls}>Notes</label>
                        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Optional notes..." className={inputCls + " resize-none"} />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between px-5 py-4 border-t border-[#171d2b]/10">
                    {event ? (
                        <button onClick={handleDelete} className="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            Delete
                        </button>
                    ) : (
                        <div />
                    )}
                    <div className="flex items-center gap-2">
                        <button onClick={onClose} className="px-4 py-2 text-xs font-medium text-[#171d2b]/70 hover:bg-[#171d2b]/5 rounded-lg transition-colors">
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!title.trim()}
                            className="px-4 py-2 text-xs font-medium text-white bg-[#171d2b] rounded-lg hover:bg-[#171d2b]/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {event ? "Save" : "Create"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
