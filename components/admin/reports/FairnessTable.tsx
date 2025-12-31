
"use client";

import { recalculateFairness } from "@/app/actions/reports";
import { useState, useTransition } from "react";

interface FairnessTableProps {
    report: {
        stats: any[];
        averages: any;
        outliers: any[];
    };
    programId: string;
    startDate: Date;
    endDate: Date;
}

export default function FairnessTable({ report, programId, startDate, endDate }: FairnessTableProps) {
    const [isPending, startTransition] = useTransition();

    const handleRecalculate = () => {
        startTransition(async () => {
            await recalculateFairness(programId, startDate, endDate);
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-end">
                <button
                    onClick={handleRecalculate}
                    disabled={isPending}
                    className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                >
                    {isPending ? "Recalculating..." : "Recalculate Stats"}
                </button>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow dark:bg-gray-800 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Resdient</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Total Points</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Nights</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Weekends</th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-300">Holidays</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-800">
                        {report.stats.map((stat: any) => (
                            <tr key={stat.id}>
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                    {stat.resident.user.name}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {stat.totalPoints.toFixed(1)}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {stat.nightsCount}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {stat.weekendsCount}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                    {stat.holidaysCount}
                                </td>
                            </tr>
                        ))}
                        {/* Averages Row */}
                        <tr className="bg-gray-50 font-semibold dark:bg-gray-700">
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">Average</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">{report.averages.points.toFixed(1)}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">{report.averages.nights.toFixed(1)}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">{report.averages.weekends.toFixed(1)}</td>
                            <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">-</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
