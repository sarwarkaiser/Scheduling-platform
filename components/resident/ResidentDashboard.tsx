"use client";

import { signOut } from 'next-auth/react';

type ResidentDashboardProps = {
    resident: {
        user?: { name?: string | null } | null;
        program?: { name?: string | null } | null;
        programYear?: { year?: number | null } | null;
    };
    assignments: Array<{
        id: string;
        shiftInstance: {
            date: string | Date;
            startTime?: string | null;
            endTime?: string | null;
            shiftTemplate?: { name?: string | null } | null;
        };
        site: { name?: string | null };
    }>;
};

const formatShiftDate = (value: string | Date, options: Intl.DateTimeFormatOptions) =>
    new Date(value).toLocaleDateString('en-US', options);

export default function ResidentDashboard({ resident, assignments }: ResidentDashboardProps) {
    const nextShift = assignments[0];
    const hasAssignments = assignments.length > 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <header className="bg-white/90 backdrop-blur dark:bg-slate-900/80 shadow-sm border-b border-slate-200/60 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="h-11 w-11 bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
                            {resident?.user?.name?.[0] || 'R'}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold dark:text-white">{resident?.user?.name || 'Resident Dashboard'}</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {resident?.program?.name || 'Program'} • PGY-{resident?.programYear?.year ?? '—'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 px-3 py-2 text-sm font-medium"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <section className="mb-8 grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-6 text-white shadow-lg">
                        <p className="text-sm uppercase tracking-widest text-white/80">Welcome back</p>
                        <h2 className="mt-3 text-2xl font-semibold">Here’s your next 30 days at a glance.</h2>
                        <div className="mt-6 grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-white/15 p-4 backdrop-blur">
                                <p className="text-xs uppercase text-white/70">Upcoming Shifts</p>
                                <p className="mt-2 text-2xl font-bold">{assignments.length}</p>
                            </div>
                            <div className="rounded-xl bg-white/15 p-4 backdrop-blur">
                                <p className="text-xs uppercase text-white/70">Call Points</p>
                                <p className="mt-2 text-2xl font-bold">{(assignments.length * 1.5).toFixed(1)}</p>
                            </div>
                            <div className="rounded-xl bg-white/15 p-4 backdrop-blur">
                                <p className="text-xs uppercase text-white/70">Next Shift</p>
                                <p className="mt-2 text-lg font-semibold">
                                    {nextShift
                                        ? formatShiftDate(nextShift.shiftInstance.date, { month: 'short', day: 'numeric' })
                                        : 'No shifts'}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Next Shift Details</h3>
                        {nextShift ? (
                            <div className="mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                <div className="flex items-center justify-between">
                                    <span>Date</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {formatShiftDate(nextShift.shiftInstance.date, { weekday: 'long', month: 'short', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Shift</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {nextShift.shiftInstance.shiftTemplate?.name || 'Shift'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Time</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">
                                        {nextShift.shiftInstance.startTime || 'TBD'} - {nextShift.shiftInstance.endTime || 'TBD'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span>Site</span>
                                    <span className="font-semibold text-slate-900 dark:text-white">{nextShift.site?.name || 'TBD'}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">You’re clear for now. Check back later for new assignments.</p>
                        )}
                        <button className="mt-6 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100">
                            View Full Calendar
                        </button>
                    </div>
                </section>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Upcoming Shifts */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
                            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <h3 className="text-lg font-bold dark:text-white">My Upcoming Shifts</h3>
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full uppercase">Next 30 Days</span>
                            </div>
                            <div className="p-6">
                                {hasAssignments ? (
                                    <div className="space-y-4">
                                        {assignments.map((assignment: any) => (
                                            <div key={assignment.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-indigo-200 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:flex-row sm:items-center">
                                                <div className="flex-shrink-0 w-20 text-center sm:border-r sm:pr-4 sm:mr-4 border-slate-200 dark:border-slate-700">
                                                    <p className="text-sm font-semibold text-slate-500">
                                                        {formatShiftDate(assignment.shiftInstance.date, { weekday: 'short' })}
                                                    </p>
                                                    <p className="text-2xl font-black text-slate-900 dark:text-white">
                                                        {formatShiftDate(assignment.shiftInstance.date, { day: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-semibold text-slate-900 dark:text-white">
                                                        {assignment.shiftInstance.shiftTemplate?.name || 'Shift'}
                                                    </p>
                                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                                        {assignment.shiftInstance.startTime || 'TBD'} - {assignment.shiftInstance.endTime || 'TBD'} • {assignment.site?.name || 'TBD'}
                                                    </p>
                                                </div>
                                                <div className="sm:text-right">
                                                    <button className="rounded-full border border-indigo-200 px-3 py-1 text-xs font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-indigo-400/40 dark:text-indigo-200">
                                                        Request Swap
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                                            📅
                                        </div>
                                        <p className="text-slate-500">No shifts assigned for this period.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Stats and Actions */}
                    <div className="space-y-8">
                        {/* Summary Stats */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-bold mb-4 dark:text-white">Monthly Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                    <p className="text-xs text-slate-500 uppercase">Total Shifts</p>
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white">{assignments.length}</p>
                                </div>
                                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
                                    <p className="text-xs text-slate-500 uppercase">Call Points</p>
                                    <p className="text-2xl font-bold text-indigo-600">{(assignments.length * 1.5).toFixed(1)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-bold mb-4 dark:text-white">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full py-2 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition dark:bg-slate-950 dark:border-slate-700 dark:hover:bg-slate-800">Set Availability</button>
                                <button className="w-full py-2 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition dark:bg-slate-950 dark:border-slate-700 dark:hover:bg-slate-800">View Swap Board</button>
                                <button className="w-full py-2 px-4 bg-white border border-slate-200 rounded-lg text-sm font-semibold hover:bg-slate-50 transition dark:bg-slate-950 dark:border-slate-700 dark:hover:bg-slate-800">Contact Chief Resident</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
