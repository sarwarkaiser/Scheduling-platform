
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
                        <div className={`mt-4 p-4 rounded ${result.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                            <pre className="text-sm dark:text-white overflow-auto">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
