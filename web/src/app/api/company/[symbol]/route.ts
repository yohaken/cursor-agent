import { NextRequest, NextResponse } from "next/server";
import { resolveCompanyProfile } from "@/lib/company-service";

type Params = { params: Promise<{ symbol: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const { symbol } = await params;
  const profile = resolveCompanyProfile(symbol);
  if (!profile) {
    return NextResponse.json({ error: "ไม่พบข้อมูลบริษัท" }, { status: 404 });
  }
  return NextResponse.json(profile);
}
