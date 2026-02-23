"use client";

import { CalendarView } from "@/components/Calendar";

export default function CalendarPage() {
    return (
        <div>
            <header className="mb-6">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#171d2b]">Calendar</h1>
                <p className="text-sm text-[#171d2b]/60 mt-1">Manage your study schedule and events</p>
            </header>
            <CalendarView />
        </div>
    );
}
