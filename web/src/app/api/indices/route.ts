import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail } from "@/lib/auth";
import { resolveIndexQuotes } from "@/lib/quotes-service";
import type { QuoteMode } from "@/lib/types";
import { z } from "zod";

const querySchema = z.object({
  mode: z.enum(["realtime", "delay10"]).default("delay10"),
});

export async function GET(request: NextRequest) {
  const email = await getSessionEmail();
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const payload = await resolveIndexQuotes(parsed.data.mode as QuoteMode);
  return NextResponse.json({ mode: parsed.data.mode, ...payload });
}
