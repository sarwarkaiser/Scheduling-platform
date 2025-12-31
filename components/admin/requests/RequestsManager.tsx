"use client";

import { createRequest, deleteRequest } from "@/app/actions/requests";
import { useState } from "react";

const REQUEST_TYPES = [
    { value: "vacation", label: "Vacation" },
    { value: "unavailable", label: "Unavailable / Off" },
    { value: "academic_day", label: "Academic Day" },
    { value: "leave", label: "Leave of Absence" },
    { value: "post_call", label: "Post Call Protection" },
];

export default function RequestsManager({
    requests,
    residents,
}: {
    requests: any[];
    residents: any[];
}) {
    const [isAdding, setIsAdding] = useState(false);

    async function handleCreate(formData: FormData) {
        await createRequest(formData);
        setIsAdding(false);
    }

    // Group residents by program? Or just flat list.
    // Sort residents by name
    const sortedResidents = [...residents].sort((a, b) =>
        (a.user?.name || "").localeCompare(b.user?.name || "")
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold dark:text-white">Availability & Requests</h2>
                <button
                    onClick={() => setIsAdding(true)}
                    className="rounded bg-indigo-600 px-3 py-2 text-sm text-white hover:bg-indigo-500"
                >
                    + Add Request
                </button>
            </div>

            {isAdding && (
                <div className="rounded border border-gray-200 p-4 bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                    <h3 className="font-medium text-sm mb-4 dark:text-white">New Request</h3>
                    <form action={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-xs font-medium dark:text-gray-300">Resident</label>
                            <select name="residentId" required className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600">
                                <option value="">Select Resident</option>
                                {sortedResidents.map(r => (
                                    <option key={r.id} value={r.id}>{r.user?.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium dark:text-gray-300">Type</label>
                            <select name="type" required className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600">
                                {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium dark:text-gray-300">Reason (Optional)</label>
                            <input name="reason" className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium dark:text-gray-300">Start Date</label>
                            <input type="date" name="startDate" required className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium dark:text-gray-300">End Date</label>
                            <input type="date" name="endDate" required className="w-full rounded border p-2 text-sm dark:bg-gray-700 dark:border-gray-600" />
                        </div>

                        <div className="col-span-1 md:col-span-2 flex justify-end gap-2">
                            <button type="button" onClick={() => setIsAdding(false)} className="text-sm px-3 py-1 bg-gray-100 rounded hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200">Cancel</button>
                            <button type="submit" className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-500">Save Request</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:bg-gray-800 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Resident</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Dates</th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {requests.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No requests found.</td>
                            </tr>
                        ) : (
                            requests.map((req: any) => (
                                <tr key={req.id}>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{req.resident?.user?.name || "Unknown"}</div>
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4">
                                        <span className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800">
                                            {REQUEST_TYPES.find(t => t.value === req.type)?.label || req.type}
                                        </span>
                                        {req.reason && <div className="text-xs text-gray-500">{req.reason}</div>}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                                        {new Date(req.startDate).toLocaleDateString()} - {new Date(req.endDate).toLocaleDateString()}
                                    </td>
                                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                        <button
                                            onClick={() => deleteRequest(req.id)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
