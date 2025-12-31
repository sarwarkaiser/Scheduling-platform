import { getRequests } from "@/app/actions/requests";
import { getResidents } from "@/app/actions/residents";
import RequestsManager from "@/components/admin/requests/RequestsManager";

export default async function RequestsPage() {
    const requests = await getRequests();
    const residents = await getResidents();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold dark:text-white">Availability Management</h1>
            <p className="text-gray-500 dark:text-gray-400">
                Manage resident vacation requests and unavailability.
            </p>

            <RequestsManager
                requests={requests}
                residents={residents}
            />
        </div>
    );
}
