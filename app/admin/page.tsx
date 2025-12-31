import { getPrograms } from "@/app/actions/programs";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const programs = await getPrograms();
  return <AdminDashboard programs={programs} />;
}
