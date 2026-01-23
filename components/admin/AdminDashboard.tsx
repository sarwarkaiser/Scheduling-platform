
"use client";

import { useState } from 'react'
import Link from 'next/link'
import { signOut } from 'next-auth/react'

export default function AdminPage({ programs }: { programs: any[] }) {
    const [programId, setProgramId] = useState(programs[0]?.id || '')
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    const [isGenerating, setIsGenerating] = useState(false)
    const [result, setResult] = useState<any>(null)

    const handleGenerate = async () => {
        setIsGenerating(true)
        setResult(null)
        try {
            const res = await fetch('/api/schedules/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    programId,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString()
                })
            })
            const data = await res.json()
            setResult(data)
        } catch (e: any) {
            setResult({ success: false, error: e.message })
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="container mx-auto p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold dark:text-white">Admin Dashboard</h1>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                >
                    Sign Out
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Link href="/admin/residents" className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition">
                    <h3 className="text-xl font-bold mb-2 dark:text-white">Residents</h3>
                    <p className="text-gray-600 dark:text-gray-300">Manage resident profiles and details.</p>
                </Link>
                <Link href="/admin/holidays" className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition">
                    <h3 className="text-xl font-bold mb-2 dark:text-white">Holidays</h3>
                    <p className="text-gray-600 dark:text-gray-300">Configure global holiday calendar.</p>
                </Link>
                <Link href="/admin/requests" className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition">
                    <h3 className="text-xl font-bold mb-2 dark:text-white">Requests</h3>
                    <p className="text-gray-600 dark:text-gray-300">Approve swaps and time-off requests.</p>
                </Link>
                <Link href="/admin/reports/fairness" className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition">
                    <h3 className="text-xl font-bold mb-2 dark:text-white">Fairness Report</h3>
                    <p className="text-gray-600 dark:text-gray-300">View workload distribution metrics.</p>
                </Link>
                <Link href="/dashboard" className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg shadow border border-blue-100 hover:shadow-md transition">
                    <h3 className="text-xl font-bold mb-2 dark:text-blue-600">Resident Dashboard</h3>
                    <p className="text-gray-600 dark:text-gray-300">Switch to the resident's view of the application.</p>
                </Link>
            </div>

            <div className="bg-white shadow-md rounded-lg p-6 mb-6 dark:bg-gray-800">
                <h2 className="text-xl font-semibold mb-4 dark:text-white">Schedule Generation</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">Program</label>
                        <select
                            value={programId}
                            onChange={(e) => setProgramId(e.target.value)}
                            className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        >
                            {programs.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2 dark:text-gray-300">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border rounded px-3 py-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {isGenerating ? 'Generating...' : 'Generate Schedule'}
                    </button>

                    {result && (
                        <div className={`mt-6 p-0 border rounded-lg overflow-hidden ${result.status === 'completed' ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'}`}>
                            <div className={`px-4 py-2 text-sm font-semibold flex justify-between items-center ${result.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                <span>{result.status === 'completed' ? '✅ Generation Successful' : '❌ Generation Failed'}</span>
                                {result.status === 'completed' && (
                                    <Link
                                        href="/admin/schedules"
                                        className="text-xs bg-white px-2 py-1 rounded border border-green-300 hover:bg-green-50 transition"
                                    >
                                        View Schedule
                                    </Link>
                                )}
                            </div>
                            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Assignments</p>
                                    <p className="text-2xl font-bold dark:text-white">{result.result?.assignments ?? 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Violations</p>
                                    <p className="text-2xl font-bold dark:text-white text-orange-600">{result.result?.violations ?? 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Unassigned</p>
                                    <p className="text-2xl font-bold dark:text-white text-red-600">{result.result?.unassignedShifts ?? 0}</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Fairness Score</p>
                                    <p className="text-2xl font-bold dark:text-white">{result.result?.score ?? 0}</p>
                                </div>
                            </div>
                            {result.error && (
                                <div className="px-4 py-3 bg-red-100 border-t border-red-200 text-red-700 text-sm">
                                    {result.error}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
