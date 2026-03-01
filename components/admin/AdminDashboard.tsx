"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
    UsersIcon,
    AcademicCapIcon,
    ClipboardDocumentListIcon,
    CalendarDaysIcon,
    SparklesIcon,
    ArrowRightIcon,
    ChevronRightIcon,
} from "@heroicons/react/24/outline";

interface Props {
    programs: { id: string; name: string }[];
    stats: { residents: number; programs: number; pendingRequests: number };
}

const quickLinks = [
    {
        title: "Residents",
        description: "Manage resident profiles",
        href: "/admin/residents",
        icon: UsersIcon,
        color: "bg-blue-500",
        light: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-600 dark:text-blue-400",
    },
    {
        title: "Programs",
        description: "Configure training programs",
        href: "/admin/programs",
        icon: AcademicCapIcon,
        color: "bg-violet-500",
        light: "bg-violet-50 dark:bg-violet-900/20",
        text: "text-violet-600 dark:text-violet-400",
    },
    {
        title: "Requests",
        description: "Approve swaps & time-off",
        href: "/admin/requests",
        icon: ClipboardDocumentListIcon,
        color: "bg-amber-500",
        light: "bg-amber-50 dark:bg-amber-900/20",
        text: "text-amber-600 dark:text-amber-400",
    },
    {
        title: "Schedule Viewer",
        description: "Browse the published schedule",
        href: "/admin/schedules",
        icon: CalendarDaysIcon,
        color: "bg-emerald-500",
        light: "bg-emerald-50 dark:bg-emerald-900/20",
        text: "text-emerald-600 dark:text-emerald-400",
    },
];

export default function AdminDashboard({ programs, stats }: Props) {
    const [programId, setProgramId] = useState(programs[0]?.id || "");
    const [startDate, setStartDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [endDate, setEndDate] = useState(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0]
    );
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setResult(null);
        try {
            const res = await fetch("/api/schedules/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    programId,
                    startDate: new Date(startDate).toISOString(),
                    endDate: new Date(endDate).toISOString(),
                }),
            });
            const data = await res.json();
            setResult(data);
        } catch (e: any) {
            setResult({ status: "error", error: e.message });
        } finally {
            setIsGenerating(false);
        }
    };

    const statCards = [
        {
            label: "Active Residents",
            value: stats.residents,
            icon: UsersIcon,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-900/20",
        },
        {
            label: "Programs",
            value: stats.programs,
            icon: AcademicCapIcon,
            color: "text-violet-600",
            bg: "bg-violet-50 dark:bg-violet-900/20",
        },
        {
            label: "Pending Requests",
            value: stats.pendingRequests,
            icon: ClipboardDocumentListIcon,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-900/20",
        },
    ];

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Admin Dashboard
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage your residency scheduling platform
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard"
                        className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium flex items-center gap-1"
                    >
                        Resident View <ArrowRightIcon className="h-3.5 w-3.5" />
                    </Link>
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        Sign Out
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {statCards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center gap-4"
                    >
                        <div className={`h-11 w-11 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                            <card.icon className={`h-6 w-6 ${card.color}`} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                {card.value}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {card.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Links */}
            <div>
                <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                    Quick Access
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickLinks.map((link) => (
                        <Link
                            key={link.title}
                            href={link.href}
                            className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-sm transition-all"
                        >
                            <div className={`h-9 w-9 rounded-lg ${link.light} flex items-center justify-center mb-3`}>
                                <link.icon className={`h-5 w-5 ${link.text}`} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {link.title}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {link.description}
                                    </p>
                                </div>
                                <ChevronRightIcon className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Schedule Generation */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                        <SparklesIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                            Schedule Generation
                        </h2>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Auto-assign residents to shifts using the scheduling engine
                        </p>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                            Program
                        </label>
                        <select
                            value={programId}
                            onChange={(e) => setProgramId(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            {programs.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating || programs.length === 0}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg text-sm transition-colors"
                    >
                        <SparklesIcon className="h-4 w-4" />
                        {isGenerating ? "Generating…" : "Generate Schedule"}
                    </button>

                    {result && (
                        <div
                            className={`rounded-lg overflow-hidden border ${
                                result.status === "completed"
                                    ? "border-emerald-200 dark:border-emerald-800"
                                    : "border-red-200 dark:border-red-800"
                            }`}
                        >
                            <div
                                className={`px-4 py-2.5 flex items-center justify-between text-sm font-semibold ${
                                    result.status === "completed"
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300"
                                        : "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300"
                                }`}
                            >
                                <span>
                                    {result.status === "completed"
                                        ? "Generation successful"
                                        : "Generation failed"}
                                </span>
                                {result.status === "completed" && (
                                    <Link
                                        href="/admin/schedules"
                                        className="text-xs bg-white dark:bg-slate-800 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-50 transition flex items-center gap-1"
                                    >
                                        View Schedule <ArrowRightIcon className="h-3 w-3" />
                                    </Link>
                                )}
                            </div>
                            {result.status === "completed" && (
                                <div className="px-4 py-4 grid grid-cols-4 gap-3 bg-white dark:bg-slate-800/50">
                                    {[
                                        { label: "Assignments", value: result.result?.assignments ?? 0, color: "text-slate-900 dark:text-white" },
                                        { label: "Violations", value: result.result?.violations ?? 0, color: "text-amber-600" },
                                        { label: "Unassigned", value: result.result?.unassignedShifts ?? 0, color: "text-red-600" },
                                        { label: "Fairness Score", value: result.result?.score ?? 0, color: "text-slate-900 dark:text-white" },
                                    ].map((m) => (
                                        <div key={m.label} className="text-center">
                                            <p className={`text-xl font-bold ${m.color}`}>{m.value}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{m.label}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {result.error && (
                                <div className="px-4 py-3 text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/10 border-t border-red-200 dark:border-red-800">
                                    {typeof result.error === "string"
                                        ? result.error
                                        : result.message || "An unexpected error occurred."}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
