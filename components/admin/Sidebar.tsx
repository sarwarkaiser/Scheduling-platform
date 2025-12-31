"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
    HomeIcon,
    UsersIcon,
    BuildingOfficeIcon,
    CalendarIcon,
    Cog6ToothIcon,
} from "@heroicons/react/24/outline";

const navigation = [
    { name: "Dashboard", href: "/admin", icon: HomeIcon },
    { name: "Residents", href: "/admin/residents", icon: UsersIcon },
    { name: "Organizations", href: "/admin/organizations", icon: BuildingOfficeIcon },
    { name: "Programs", href: "/admin/programs", icon: CalendarIcon },
    { name: "Schedule Viewer", href: "/admin/schedules", icon: CalendarIcon },
    { name: "Rules", href: "/admin/rules", icon: Cog6ToothIcon },
    { name: "Requests", href: "/admin/requests", icon: UsersIcon }, // Reusing Users icon
    { name: "Reports", href: "/admin/reports/fairness", icon: CalendarIcon },
    { name: "Holidays", href: "/admin/holidays", icon: CalendarIcon },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gray-900 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
                <span className="text-xl font-bold text-white">Scheduling Platform</span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={clsx(
                                                isActive
                                                    ? "bg-gray-800 text-white"
                                                    : "text-gray-400 hover:bg-gray-800 hover:text-white",
                                                "group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6"
                                            )}
                                        >
                                            <item.icon className="h-6 w-6 shrink-0" aria-hidden="true" />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <Link
                            href="/settings"
                            className="group -mx-2 flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-gray-400 hover:bg-gray-800 hover:text-white"
                        >
                            <Cog6ToothIcon className="h-6 w-6 shrink-0" aria-hidden="true" />
                            Settings
                        </Link>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
