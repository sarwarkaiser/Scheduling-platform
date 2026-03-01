"use client";

import { useState, useTransition } from "react";
import { requestSwap } from "@/app/actions/swaps";

interface ShiftInfo {
    id: string;
    shiftInstance: {
        date: string | Date;
        startTime: string | Date;
        endTime: string | Date;
        shiftTemplate: { name: string };
    };
    site: { name: string };
}

interface OpenSwap {
    id: string;
    reason: string | null;
    createdAt: string | Date;
    assignmentId: string;
    requester: { user: { name: string | null } };
    assignment: ShiftInfo;
}

interface MySwap {
    id: string;
    status: string;
    createdAt: string | Date;
    assignment: ShiftInfo;
}

function formatDate(d: string | Date) {
    return new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(d: string | Date) {
    return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_STYLES: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    cancelled: "bg-gray-100 text-gray-500",
};

export default function SwapBoard({
    openSwaps,
    mySwaps,
    residentId,
}: {
    openSwaps: OpenSwap[];
    mySwaps: MySwap[];
    residentId: string;
}) {
    const [isPending, startTransition] = useTransition();
    const [volunteering, setVolunteering] = useState<string | null>(null);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleVolunteer(swap: OpenSwap) {
        setError("");
        setSuccess("");
        setVolunteering(swap.id);
        startTransition(async () => {
            const result = await requestSwap({
                requesterId: residentId,
                assignmentId: swap.assignmentId,
                targetId: swap.requester.user.name || undefined,
                reason: "Volunteering to cover from swap board",
            });
            setVolunteering(null);
            if (result.success) {
                setSuccess("Your request to cover this shift has been submitted for approval.");
            } else {
                setError(result.error || "Failed to submit.");
            }
        });
    }

    return (
        <div className="space-y-8">
            {error && <p className="text-sm text-red-600 bg-red-50 rounded p-3">{error}</p>}
            {success && <p className="text-sm text-green-600 bg-green-50 rounded p-3">{success}</p>}

            {/* Open swap requests from colleagues */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-lg font-bold dark:text-white">Open Shifts Available to Cover</h2>
                    <span className="text-sm text-gray-500">{openSwaps.length} open</span>
                </div>
                {openSwaps.length === 0 ? (
                    <p className="p-6 text-sm text-gray-500 dark:text-gray-400">No open swap requests right now.</p>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {openSwaps.map((swap) => (
                            <li key={swap.id} className="px-6 py-4 flex items-center gap-4">
                                <div className="flex-shrink-0 w-16 text-center border-r border-gray-200 pr-4">
                                    <p className="text-xs text-gray-500 uppercase">
                                        {new Date(swap.assignment.shiftInstance.date).toLocaleDateString("en-US", { weekday: "short" })}
                                    </p>
                                    <p className="text-xl font-black dark:text-white">
                                        {new Date(swap.assignment.shiftInstance.date).getDate()}
                                    </p>
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold dark:text-white">{swap.assignment.shiftInstance.shiftTemplate.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {formatTime(swap.assignment.shiftInstance.startTime)} – {formatTime(swap.assignment.shiftInstance.endTime)}
                                        {" · "}{swap.assignment.site.name}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Posted by {swap.requester.user.name || "a colleague"}
                                        {swap.reason && ` · ${swap.reason}`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleVolunteer(swap)}
                                    disabled={isPending && volunteering === swap.id}
                                    className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                                >
                                    {isPending && volunteering === swap.id ? "Submitting…" : "Volunteer to Cover"}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* My own swap requests */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h2 className="text-lg font-bold dark:text-white">My Swap Requests</h2>
                </div>
                {mySwaps.length === 0 ? (
                    <p className="p-6 text-sm text-gray-500 dark:text-gray-400">You haven&apos;t posted any swap requests yet. Use &quot;Request Swap&quot; on a shift from your dashboard.</p>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                        {mySwaps.map((swap) => (
                            <li key={swap.id} className="px-6 py-4 flex items-center gap-4">
                                <div className="flex-shrink-0 w-16 text-center border-r border-gray-200 pr-4">
                                    <p className="text-xs text-gray-500 uppercase">
                                        {new Date(swap.assignment.shiftInstance.date).toLocaleDateString("en-US", { weekday: "short" })}
                                    </p>
                                    <p className="text-xl font-black dark:text-white">
                                        {new Date(swap.assignment.shiftInstance.date).getDate()}
                                    </p>
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold dark:text-white">{swap.assignment.shiftInstance.shiftTemplate.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {swap.assignment.site.name} · Posted {formatDate(swap.createdAt)}
                                    </p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_STYLES[swap.status] || "bg-gray-100 text-gray-500"}`}>
                                    {swap.status}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
