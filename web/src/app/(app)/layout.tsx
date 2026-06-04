import { AppShell } from "@/components/app-shell";
import { getSessionEmail } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const email = await getSessionEmail();
  if (!email) redirect("/login");
  return <AppShell email={email}>{children}</AppShell>;
}
