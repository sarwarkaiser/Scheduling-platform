"use client";

import { useState, useTransition } from "react";
import { notifyResidents } from "@/app/actions/schedule";

export default function NotifyButton({ programId }: { programId: string }) {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<{ sent: number; skipped: number } | null>(null);

    function handleClick() {
        setResult(null);
        startTransition(async () => {
            const res = await notifyResidents(programId);
            setResult(res);
        });
    }

    return (
        <div className="flex items-center gap-3">
            {result && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                    {result.sent === 0
                        ? "No upcoming shifts to notify."
                        : `Notified ${result.sent} resident${result.sent !== 1 ? "s" : ""}${result.skipped > 0 ? ` (${result.skipped} skipped)` : ""}`}
                </span>
            )}
            <button
                onClick={handleClick}
                disabled={isPending}
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
            >
                {isPending ? "Sending…" : "Notify Residents"}
            </button>
        </div>
    );
}
