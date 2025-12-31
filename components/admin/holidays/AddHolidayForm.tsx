
"use client";

import { addHoliday } from "@/app/actions/holidays";
import { useTransition, useRef } from "react";

export default function AddHolidayForm({ programId }: { programId: string }) {
    const [isPending, startTransition] = useTransition();
    const formRef = useRef<HTMLFormElement>(null);

    const handleSubmit = (formData: FormData) => {
        if (!programId) return alert("No program selected");
        formData.append("programId", programId);

        startTransition(async () => {
            try {
                await addHoliday(formData);
                formRef.current?.reset();
            } catch (e) {
                alert("Failed to add holiday");
            }
        });
    };

    if (!programId) return <div>Please select a program first.</div>;

    return (
        <div className="bg-white p-6 shadow sm:rounded-lg dark:bg-gray-800">
            <form action={handleSubmit} ref={formRef} className="space-y-4">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                    <input type="text" name="name" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                    <input type="date" name="date" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                </div>
                <button
                    type="submit"
                    disabled={isPending}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {isPending ? "Adding..." : "Add Holiday"}
                </button>
            </form>
        </div>
    );
}
