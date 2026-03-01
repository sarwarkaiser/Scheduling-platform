"use client";

import { useState, useTransition } from "react";
import { submitAvailabilityRequest, deleteMyAvailability } from "@/app/actions/availability";

const AVAILABILITY_TYPES = [
    { value: "vacation", label: "Vacation" },
    { value: "leave", label: "Leave of Absence" },
    { value: "academic_day", label: "Academic Day" },
    { value: "unavailable", label: "Unavailable" },
    { value: "post_call_protection", label: "Post-Call Protection" },
];

interface Availability {
    id: string;
    type: string;
    startDate: Date;
    endDate: Date;
    reason: string | null;
    approved: boolean;
}

export default function AvailabilityManager({
    residentId,
    availabilities,
}: {
    residentId: string;
    availabilities: Availability[];
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setSuccess("");
        const form = e.currentTarget;
        const data = new FormData(form);
        startTransition(async () => {
            try {
                await submitAvailabilityRequest(data);
                setSuccess("Request submitted successfully.");
                form.reset();
            } catch (err: any) {
                setError(err.message || "Failed to submit request.");
            }
        });
    }

    async function handleDelete(id: string) {
        setError("");
        startTransition(async () => {
            try {
                await deleteMyAvailability(id);
            } catch (err: any) {
                setError(err.message || "Could not delete request.");
            }
        });
    }

    return (
        <div className="space-y-8">
            {/* Submission form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <h2 className="text-lg font-bold mb-4 dark:text-white">Submit a Request</h2>
                {error && <p className="mb-4 text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>}
                {success && <p className="mb-4 text-sm text-green-600 bg-green-50 rounded p-3">{success}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="hidden" name="residentId" value={residentId} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Type
                            </label>
                            <select
                                name="type"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                {AVAILABILITY_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                name="startDate"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                name="endDate"
                                required
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Reason (optional)
                            </label>
                            <input
                                type="text"
                                name="reason"
                                placeholder="Brief reason"
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                        {isPending ? "Submitting…" : "Submit Request"}
                    </button>
                </form>
            </div>

            {/* Existing requests */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold dark:text-white">My Requests</h2>
                </div>
                {availabilities.length === 0 ? (
                    <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No requests submitted yet.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Type</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Start</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">End</th>
                                <th className="px-6 py-3 text-left font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {availabilities.map((a) => (
                                <tr key={a.id}>
                                    <td className="px-6 py-3 capitalize dark:text-white">
                                        {AVAILABILITY_TYPES.find(t => t.value === a.type)?.label || a.type}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600 dark:text-gray-300">
                                        {new Date(a.startDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3 text-gray-600 dark:text-gray-300">
                                        {new Date(a.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-3">
                                        {a.approved ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">Approved</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-semibold">Pending</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        {!a.approved && (
                                            <button
                                                onClick={() => handleDelete(a.id)}
                                                disabled={isPending}
                                                className="text-red-500 hover:text-red-700 text-xs disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
