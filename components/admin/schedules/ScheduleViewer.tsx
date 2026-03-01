"use client";

import { useState, useTransition } from "react";
import { getSchedule } from "@/app/actions/schedule";
import MonthlyCalendar from "./MonthlyCalendar";

export default function ScheduleViewer({
    initialEvents,
    programs,
}: {
    initialEvents: any[];
    programs: any[];
}) {
    const [selectedProgram, setSelectedProgram] = useState(programs[0]?.id || "");
    const [events, setEvents] = useState(initialEvents);
    const [view, setView] = useState<"calendar" | "list">("calendar");
    const [isPending, startTransition] = useTransition();

    async function handleProgramChange(programId: string) {
        setSelectedProgram(programId);
        startTransition(async () => {
            const today = new Date();
            const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
            const end = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();
            const data = await getSchedule(programId, start, end);
            setEvents(data as any);
        });
    }

    // List view helpers
    const groupedEvents = events.reduce((acc: any, ev: any) => {
        const key = ev.dateStr || new Date(ev.start).toLocaleDateString();
        if (!acc[key]) acc[key] = [];
        acc[key].push(ev);
        return acc;
    }, {});

    return (
        <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
                <div className="flex items-center gap-3">
                    <select
                        value={selectedProgram}
                        onChange={(e) => handleProgramChange(e.target.value)}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                        {programs.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    {isPending && <span className="text-xs text-gray-400">Loading…</span>}
                </div>
                <div className="flex items-center gap-2">
                    {/* View toggle */}
                    <div className="flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
                        <button
                            onClick={() => setView("calendar")}
                            className={`px-3 py-1.5 font-medium transition ${view === "calendar" ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                        >
                            Calendar
                        </button>
                        <button
                            onClick={() => setView("list")}
                            className={`px-3 py-1.5 font-medium transition ${view === "list" ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                        >
                            List
                        </button>
                    </div>
                    <button
                        onClick={() => window.print()}
                        className="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-black dark:hover:bg-gray-200 transition"
                    >
                        Print
                    </button>
                </div>
            </div>

            {/* Calendar view */}
            {view === "calendar" && (
                <MonthlyCalendar programId={selectedProgram} initialEvents={events} />
            )}

            {/* List view */}
            {view === "list" && (
                <div className="space-y-6" id="schedule-print-area">
                    {Object.entries(groupedEvents).length === 0 && (
                        <div className="text-center py-12 text-gray-500">No schedule data. Generate a schedule first.</div>
                    )}
                    {Object.entries(groupedEvents).map(([dateKey, dayEvents]: [string, any]) => (
                        <div key={dateKey} className="break-inside-avoid">
                            <h3 className="mb-2 text-base font-semibold border-b border-gray-200 pb-1 dark:text-white dark:border-gray-700">
                                {new Date(dateKey + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
                            </h3>
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {dayEvents.map((ev: any) => (
                                    <div key={ev.id} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                        <p className="font-medium text-sm text-gray-900 dark:text-white">{ev.title}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(ev.start).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })} –{" "}
                                            {new Date(ev.end).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                                        </p>
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                                {ev.resident?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-xs text-gray-700 dark:text-gray-200">{ev.resident}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
