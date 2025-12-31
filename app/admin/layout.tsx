import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
            <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
                <Sidebar />
            </div>
            <main className="pl-72 w-full">
                <div className="px-4 py-10 sm:px-6 lg:px-8 bg-white dark:bg-black min-h-screen">
                    {children}
                </div>
            </main>
        </div>
    );
}
