import { CompanyDetail } from "@/components/company-detail";
import { resolveCompanyProfile } from "@/lib/company-service";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ symbol: string }> };

export default async function StockPage({ params }: Props) {
  const { symbol } = await params;
  const profile = resolveCompanyProfile(symbol);
  if (!profile) notFound();
  return <CompanyDetail profile={profile} />;
}
