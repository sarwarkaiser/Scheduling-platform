"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
    HomeIcon,
    UsersIcon,
    BuildingOffice2Icon,
    AcademicCapIcon,
    CalendarDaysIcon,
    ShieldCheckIcon,
    ClipboardDocumentListIcon,
    ChartBarSquareIcon,
    SunIcon,
    Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const navigation = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon, exact: true },
    { name: "Residents", href: "/admin/residents", icon: UsersIcon },
    { name: "Organizations", href: "/admin/organizations", icon: BuildingOffice2Icon },
    { name: "Programs", href: "/admin/programs", icon: AcademicCapIcon },
    { name: "Schedule", href: "/admin/schedules", icon: CalendarDaysIcon },
    { name: "Rules", href: "/admin/rules", icon: ShieldCheckIcon },
    { name: "Requests", href: "/admin/requests", icon: ClipboardDocumentListIcon },
    { name: "Reports", href: "/admin/reports/fairness", icon: ChartBarSquareIcon },
    { name: "Holidays", href: "/admin/holidays", icon: SunIcon },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-4 pb-4">
            <div className="flex h-16 shrink-0 items-center gap-x-3 px-2 border-b border-slate-800">
                <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
                    <CalendarDaysIcon className="h-5 w-5 text-white" />
                </div>
                <span className="text-base font-bold text-white tracking-tight leading-tight">
                    Resident<br />
                    <span className="text-indigo-400">Scheduler</span>
                </span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <p className="px-2 text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">
                            Navigation
                        </p>
                        <ul role="list" className="-mx-2 space-y-0.5">
                            {navigation.map((item) => {
                                const isActive = item.exact
                                    ? pathname === item.href
                                    : pathname === item.href || pathname.startsWith(item.href + "/");
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={clsx(
                                                isActive
                                                    ? "bg-indigo-600 text-white shadow-sm"
                                                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                                "group flex gap-x-3 rounded-lg px-3 py-2 text-sm font-medium leading-6 transition-colors"
                                            )}
                                        >
                                            <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>
                    <li className="mt-auto border-t border-slate-800 pt-4">
                        <Link
                            href="/settings"
                            className={clsx(
                                pathname === "/settings"
                                    ? "bg-indigo-600 text-white"
                                    : "text-slate-400 hover:bg-slate-800 hover:text-white",
                                "-mx-2 flex gap-x-3 rounded-lg px-3 py-2 text-sm font-medium leading-6 transition-colors"
                            )}
                        >
                            <Cog6ToothIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
                            Settings
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
