"use client";

import { useState } from 'react';
import { signOut } from 'next-auth/react';

export default function ResidentDashboard({ resident, assignments }: { resident: any; assignments: any[] }) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                            {resident?.user?.name?.[0] || 'R'}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold dark:text-white">{resident?.user?.name || 'Resident Dashboard'}</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{resident?.program?.name} • PGY-{resident?.programYear?.year}</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => signOut({ callbackUrl: '/login' })}
                            className="text-gray-600 dark:text-gray-300 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Upcoming Shifts */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <h3 className="text-lg font-bold dark:text-white">My Upcoming Shifts</h3>
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full uppercase">Next 30 Days</span>
                            </div>
                            <div className="p-6">
                                {assignments.length > 0 ? (
                                    <div className="space-y-4">
                                        {assignments.map((assignment: any) => (
                                            <div key={assignment.id} className="flex items-center p-4 border rounded-lg hover:border-blue-200 transition bg-white dark:bg-gray-750">
                                                <div className="flex-shrink-0 w-16 text-center border-r pr-4 mr-4">
                                                    <p className="text-sm font-bold">{new Date(assignment.shiftInstance.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                                                    <p className="text-lg font-black">{new Date(assignment.shiftInstance.date).getDate()}</p>
                                                </div>
                                                <div className="flex-grow">
                                                    <p className="font-bold text-gray-900 dark:text-white">{assignment.shiftInstance.shiftTemplate.name}</p>
                                                    <p className="text-sm text-gray-500">{assignment.shiftInstance.startTime} - {assignment.shiftInstance.endTime} • {assignment.site.name}</p>
                                                </div>
                                                <div>
                                                    <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Request Swap</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 text-gray-400 mb-4">
                                            📅
                                        </div>
                                        <p className="text-gray-500">No shifts assigned for this period.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Stats and Actions */}
                    <div className="space-y-8">
                        {/* Summary Stats */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold mb-4 dark:text-white">Monthly Summary</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase">Total Shifts</p>
                                    <p className="text-2xl font-bold">{assignments.length}</p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
                                    <p className="text-xs text-gray-500 uppercase">Call Points</p>
                                    <p className="text-2xl font-bold text-blue-600">{assignments.length * 1.5}</p>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            <h3 className="text-lg font-bold mb-4 dark:text-white">Quick Actions</h3>
                            <div className="space-y-3">
                                <button className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition border-gray-100">Set Availability</button>
                                <button className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition border-gray-100">View Swap Board</button>
                                <button className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition border-gray-100">Contact Chief Resident</button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
