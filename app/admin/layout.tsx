import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
            <div className="fixed inset-y-0 z-50 flex w-64 flex-col">
                <Sidebar />
            </div>
            <main className="pl-64 w-full overflow-y-auto">
                <div className="px-6 py-8 sm:px-8 lg:px-10 min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}
