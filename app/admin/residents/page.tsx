import { getResidents } from "@/app/actions/residents";
import { getPrograms } from "@/app/actions/programs";
import AddResidentForm from "@/components/admin/residents/AddResidentForm";
import ResidentList from "@/components/admin/residents/ResidentList";

export default async function ResidentsPage() {
    const residents = await getResidents();
    const programs = await getPrograms();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold dark:text-white">Residents</h1>
                <AddResidentForm programs={programs} />
            </div>

            <ResidentList residents={residents} />
        </div>
    );
}
