import { NextRequest, NextResponse } from "next/server";
import { buildMdaSummary } from "@/lib/company-service";

type Params = { params: Promise<{ symbol: string }> };

export async function POST(_request: NextRequest, { params }: Params) {
  const { symbol } = await params;
  const result = buildMdaSummary(symbol);
  if (!result) {
    return NextResponse.json({ error: "ไม่พบข้อมูลบริษัท" }, { status: 404 });
  }
  return NextResponse.json(result);
}
