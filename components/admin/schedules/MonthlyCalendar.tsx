"use client";

import { useState, useTransition } from "react";
import { getSchedule } from "@/app/actions/schedule";
import { ChevronLeftIcon as ChevronLeft, ChevronRightIcon as ChevronRight } from "@heroicons/react/24/outline";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Tailwind colour ring per slot index so multiple residents are distinguishable
const CHIP_COLORS = [
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300",
    "bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300",
    "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300",
    "bg-orange-100 text-orange-700 dark:bg-orange-900/60 dark:text-orange-300",
];

interface ScheduleEvent {
    id: string;
    title: string;
    dateStr: string;
    start: Date | string;
    end: Date | string;
    residents: { id: string; name: string }[];
    status: string;
}

interface Props {
    programId: string;
    initialEvents: ScheduleEvent[];
}

function getMonthGrid(year: number, month: number): (Date | null)[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // ISO weekday: Mon=1…Sun=7; adjust so Mon is index 0
    const startOffset = (firstDay.getDay() + 6) % 7;
    const days: (Date | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
        days.push(new Date(year, month, d));
    }
    // Pad end to full weeks
    while (days.length % 7 !== 0) days.push(null);
    return days;
}

function isoDate(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getInitials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function MonthlyCalendar({ programId, initialEvents }: Props) {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());
    const [events, setEvents] = useState<ScheduleEvent[]>(initialEvents);
    const [selectedDay, setSelectedDay] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const days = getMonthGrid(year, month);

    // Build a map from dateStr → events
    const byDate: Record<string, ScheduleEvent[]> = {};
    for (const ev of events) {
        if (!byDate[ev.dateStr]) byDate[ev.dateStr] = [];
        byDate[ev.dateStr].push(ev);
    }

    function navigate(delta: number) {
        let m = month + delta;
        let y = year;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setMonth(m);
        setYear(y);
        setSelectedDay(null);
        startTransition(async () => {
            const start = new Date(y, m, 1).toISOString();
            const end = new Date(y, m + 1, 0, 23, 59, 59).toISOString();
            const data = await getSchedule(programId, start, end);
            setEvents(data as any);
        });
    }

    function goToday() {
        const t = new Date();
        setYear(t.getFullYear());
        setMonth(t.getMonth());
        startTransition(async () => {
            const start = new Date(t.getFullYear(), t.getMonth(), 1).toISOString();
            const end = new Date(t.getFullYear(), t.getMonth() + 1, 0, 23, 59, 59).toISOString();
            const data = await getSchedule(programId, start, end);
            setEvents(data as any);
        });
    }

    const monthLabel = new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const todayStr = isoDate(today);
    const selectedEvents = selectedDay ? (byDate[selectedDay] || []) : [];

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold dark:text-white">{monthLabel}</h2>
                <div className="flex items-center gap-2">
                    {isPending && <span className="text-xs text-gray-400">Loading…</span>}
                    <button onClick={goToday} className="px-3 py-1.5 text-sm font-medium bg-gray-100 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition">
                        Today
                    </button>
                    <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" aria-label="Previous month">
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <button onClick={() => navigate(1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition" aria-label="Next month">
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-700">
                    {WEEKDAYS.map((d) => (
                        <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Day grid */}
                <div className="grid grid-cols-7">
                    {days.map((date, i) => {
                        if (!date) return <div key={i} className="min-h-[90px] bg-gray-50 dark:bg-gray-800/40 border-b border-r border-gray-100 dark:border-gray-700" />;

                        const ds = isoDate(date);
                        const dayEvents = byDate[ds] || [];
                        const isToday = ds === todayStr;
                        const isSelected = ds === selectedDay;
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                        return (
                            <button
                                key={ds}
                                onClick={() => setSelectedDay(isSelected ? null : ds)}
                                className={[
                                    "min-h-[90px] p-2 text-left border-b border-r border-gray-100 dark:border-gray-700 transition-colors",
                                    isSelected ? "bg-indigo-50 dark:bg-indigo-900/20" : isWeekend ? "bg-blue-50/40 dark:bg-blue-900/10 hover:bg-blue-50 dark:hover:bg-blue-900/20" : "hover:bg-gray-50 dark:hover:bg-gray-700/40",
                                ].join(" ")}
                            >
                                <span className={[
                                    "text-sm font-medium inline-flex items-center justify-center w-6 h-6 rounded-full",
                                    isToday ? "bg-indigo-600 text-white" : "text-gray-700 dark:text-gray-300",
                                ].join(" ")}>
                                    {date.getDate()}
                                </span>
                                <div className="mt-1 space-y-0.5">
                                    {dayEvents.slice(0, 3).map((ev, idx) => (
                                        ev.residents.slice(0, 2).map((r, ri) => (
                                            <div
                                                key={`${ev.id}-${r.id}`}
                                                className={`text-[11px] px-1.5 py-0.5 rounded font-medium truncate ${CHIP_COLORS[(idx + ri) % CHIP_COLORS.length]}`}
                                                title={`${ev.title} — ${r.name}`}
                                            >
                                                {ev.title.slice(0, 6)}: {getInitials(r.name)}
                                            </div>
                                        ))
                                    ))}
                                    {dayEvents.length > 3 && (
                                        <div className="text-[10px] text-gray-400 pl-1">+{dayEvents.length - 3} more</div>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Day detail panel */}
            {selectedDay && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                        {new Date(selectedDay + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    </h3>
                    {selectedEvents.length === 0 ? (
                        <p className="text-sm text-gray-400">No shifts scheduled.</p>
                    ) : (
                        <div className="space-y-2">
                            {selectedEvents.map((ev) => (
                                <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                    <div className="flex-grow">
                                        <p className="font-medium text-sm dark:text-white">{ev.title}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(ev.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} –{" "}
                                            {new Date(ev.end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                    </div>
                                    <div className="flex gap-1">
                                        {ev.residents.length === 0 ? (
                                            <span className="text-xs text-gray-400 italic">Unassigned</span>
                                        ) : ev.residents.map((r, ri) => (
                                            <span key={r.id} className={`text-xs px-2 py-1 rounded-full font-semibold ${CHIP_COLORS[ri % CHIP_COLORS.length]}`} title={r.name}>
                                                {getInitials(r.name)}
                                            </span>
                                        ))}
                                    </div>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${ev.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                        {ev.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Legend */}
            <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                {CHIP_COLORS.map((c, i) => (
                    <div key={i} className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded ${c.split(" ")[0]}`} />
                        <span>Slot {i + 1}</span>
                    </div>
                ))}
                <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
                    <span>Weekend</span>
                </div>
            </div>
        </div>
    );
}
