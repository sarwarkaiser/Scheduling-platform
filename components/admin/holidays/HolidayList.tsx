
"use client";

import { deleteHoliday } from "@/app/actions/holidays";
import { useTransition } from "react";

export default function HolidayList({ holidays }: { holidays: any[] }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = (id: string) => {
        if (confirm("Delete this holiday?")) {
            startTransition(async () => {
                await deleteHoliday(id);
            });
        }
    };

    if (holidays.length === 0) {
        return <p className="text-gray-500">No holidays defined.</p>;
    }

    return (
        <ul className="divide-y divide-gray-200 dark:divide-gray-700 bg-white shadow rounded-lg dark:bg-gray-800">
            {holidays.map((holiday) => (
                <li key={holiday.id} className="flex justify-between p-4">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">{holiday.name}</p>
                        <p className="text-sm text-gray-500">{new Date(holiday.date).toLocaleDateString()}</p>
                    </div>
                    <button
                        onClick={() => handleDelete(holiday.id)}
                        disabled={isPending}
                        className="text-red-600 hover:text-red-900 text-sm font-medium disabled:opacity-50"
                    >
                        Delete
                    </button>
                </li>
            ))}
        </ul>
    );
}
