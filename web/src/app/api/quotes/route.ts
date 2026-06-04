import { NextRequest, NextResponse } from "next/server";
import { resolveStockQuotes } from "@/lib/quotes-service";
import type { QuoteMode } from "@/lib/types";
import { z } from "zod";

const querySchema = z.object({
  mode: z.enum(["realtime", "delay10"]).default("delay10"),
  market: z.string().default("SET,mai"),
  symbols: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const symbols = parsed.data.symbols
    ?.split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  const payload = await resolveStockQuotes({
    mode: parsed.data.mode as QuoteMode,
    market: parsed.data.market,
    symbols,
  });

  return NextResponse.json(payload);
}
