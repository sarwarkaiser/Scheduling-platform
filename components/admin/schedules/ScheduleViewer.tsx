"use client";

import { useState } from "react";
import { getSchedule } from "@/app/actions/schedule";

export default function ScheduleViewer({
    initialEvents,
    programs,
}: {
    initialEvents: any[];
    programs: any[];
}) {
    const [events, setEvents] = useState(initialEvents);
    const [selectedProgram, setSelectedProgram] = useState(programs[0]?.id || "");
    const [loading, setLoading] = useState(false);

    // Simple Grid View for MVP
    // Columns: Dates
    // Rows: Shifts? Or just a list of cards per day.
    // Let's do a vertical list group by date.

    const groupedEvents = events.reduce((acc: any, event: any) => {
        const dateKey = new Date(event.start).toLocaleDateString();
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
    }, {});

    async function handleProgramChange(programId: string) {
        setSelectedProgram(programId);
        setLoading(true);
        // Fetch new schedule (assume default 30 day window for now or use current month)
        const today = new Date();
        const nextMonth = new Date();
        nextMonth.setDate(today.getDate() + 30);

        // In a real app we'd manage the date range state too
        const data = await getSchedule(
            programId,
            today.toISOString(),
            nextMonth.toISOString()
        );
        setEvents(data);
        setLoading(false);
    }

    function handlePrint() {
        window.print();
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between print:hidden">
                <div className="flex items-center gap-4">
                    <select
                        value={selectedProgram}
                        onChange={(e) => handleProgramChange(e.target.value)}
                        className="rounded-md border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                    >
                        {programs.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                    {loading && <span className="text-sm text-gray-500">Loading...</span>}
                </div>
                <button
                    onClick={handlePrint}
                    className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 dark:bg-white dark:text-black dark:hover:bg-gray-200"
                >
                    Export PDF / Print
                </button>
            </div>

            <div className="space-y-8" id="schedule-print-area">
                {Object.entries(groupedEvents).map(([date, dayEvents]: [string, any]) => (
                    <div key={date} className="break-inside-avoid">
                        <h3 className="mb-2 text-lg font-semibold border-b border-gray-200 pb-1 dark:text-white dark:border-gray-700">
                            {new Date(date).toLocaleDateString(undefined, {
                                weekday: "long",
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                            })}
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {dayEvents.map((event: any) => (
                                <div
                                    key={event.id}
                                    className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-gray-900 dark:text-white">
                                                {event.title}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(event.start).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(event.end).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                                            {event.resident.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                            {event.resident}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                {events.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        No schedule data found. Generate a schedule first.
                    </div>
                )}
            </div>

            <style jsx global>{`
        @media print {
            body * {
                visibility: hidden;
            }
            #schedule-print-area, #schedule-print-area * {
                visibility: visible;
            }
            #schedule-print-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
            }
            nav, header, footer, aside {
                display: none;
            }
        }
      `}</style>
        </div>
    );
}
