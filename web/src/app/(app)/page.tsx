import { DashboardClient } from "@/components/dashboard-client";
import { getSessionEmail } from "@/lib/auth";

export default async function DashboardPage() {
  const email = (await getSessionEmail()) ?? "ผู้ใช้";
  return <DashboardClient email={email} />;
}
