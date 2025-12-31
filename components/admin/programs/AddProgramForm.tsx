"use client";

import { createProgram } from "@/app/actions/programs";
import { useState } from "react";

export default function AddProgramForm({ organizations }: { organizations: any[] }) {
    const [isOpen, setIsOpen] = useState(false);

    async function clientAction(formData: FormData) {
        await createProgram(formData);
        setIsOpen(false);
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
                Add Program
            </button>
        );
    }

    return (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:bg-gray-800 dark:border-gray-700">
            <h3 className="mb-4 text-lg font-medium">Add New Program</h3>
            <form action={clientAction} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium">Organization</label>
                    <select
                        name="organizationId"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                    >
                        {organizations.map((org) => (
                            <option key={org.id} value={org.id}>
                                {org.name}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium">Name</label>
                    <input
                        name="name"
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Code (e.g., PSYCH-RES)</label>
                    <input
                        name="code"
                        type="text"
                        required
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium">Description</label>
                    <textarea
                        name="description"
                        className="mt-1 block w-full rounded-md border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600"
                        rows={3}
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                    >
                        Save
                    </button>
                </div>
            </form>
        </div>
    );
}
