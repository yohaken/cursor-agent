import type { IndexQuote, QuoteMode, StockQuote } from "./types";

const SET_BASE = "https://marketplace.set.or.th/api/public";

type RawRecord = Record<string, unknown>;

function num(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function str(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function normalizeMarket(value: unknown): "SET" | "mai" {
  const m = str(value, "SET").toLowerCase();
  return m === "mai" ? "mai" : "SET";
}

function pickArray(payload: unknown): RawRecord[] {
  if (Array.isArray(payload)) return payload as RawRecord[];
  if (payload && typeof payload === "object") {
    const obj = payload as RawRecord;
    for (const key of ["data", "stock", "stocks", "indices", "index", "result"]) {
      const inner = obj[key];
      if (Array.isArray(inner)) return inner as RawRecord[];
    }
  }
  return [];
}

function mapStock(row: RawRecord): StockQuote {
  const symbol = str(row.stockSymbol ?? row.symbol ?? row.securitySymbol, "—");
  const last = num(row.price ?? row.last ?? row.close ?? row.lastPrice);
  const prior = num(row.priorPrice ?? row.prior ?? row.referencePrice ?? row.refPrice);
  const change =
    num(row.change) ??
    (last !== null && prior !== null ? Math.round((last - prior) * 100) / 100 : null);
  const changePercent =
    num(row.percentChange ?? row.changePercent) ??
    (change !== null && prior ? Math.round((change / prior) * 10000) / 100 : null);
  const value = num(row.value ?? row.totalValue) ?? 0;
  const marketCap =
    num(row.marketCap ?? row.marketCapitalization ?? row.mktCap) ??
    (value > 0 ? value * 50 : 0);

  return {
    symbol,
    name: str(row.securityName ?? row.nameTh ?? row.name, symbol),
    market: normalizeMarket(row.market ?? row.marketId),
    last,
    change,
    changePercent,
    volume: num(row.volume ?? row.totalVolume) ?? 0,
    value,
    marketCap,
    bid: num(row.bid ?? row.bestBid),
    offer: num(row.offer ?? row.bestOffer ?? row.ask),
    high: num(row.high ?? row.highPrice),
    low: num(row.low ?? row.lowPrice),
    prior,
    asOf: str(row.datetime ?? row.dateTime ?? row.asOf, new Date().toISOString()),
  };
}

function mapIndex(row: RawRecord): IndexQuote {
  const symbol = str(row.indexSymbol ?? row.symbol ?? row.index, "SET");
  const last = num(row.price ?? row.last ?? row.indexValue);
  const prior = num(row.priorPrice ?? row.prior ?? row.referencePrice);
  const change =
    num(row.change) ??
    (last !== null && prior !== null ? Math.round((last - prior) * 100) / 100 : null);
  const changePercent =
    num(row.percentChange ?? row.changePercent) ??
    (change !== null && prior ? Math.round((change / prior) * 10000) / 100 : null);

  return {
    symbol,
    name: str(row.indexName ?? row.name, symbol),
    market: normalizeMarket(row.market ?? row.marketId),
    last,
    change,
    changePercent,
    asOf: str(row.datetime ?? row.dateTime, new Date().toISOString()),
  };
}

async function fetchSet<T>(
  path: "realtime" | "delay",
  resource: "stock" | "index",
  params: Record<string, string>,
): Promise<T[] | null> {
  const apiKey = process.env.SET_API_KEY?.trim();
  if (!apiKey) return null;

  const segment = path === "realtime" ? "realtime-data" : "delay-data";
  const url = new URL(`${SET_BASE}/${segment}/${resource}`);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { "api-key": apiKey, Accept: "application/json" },
    cache: "no-store",
  });

  if (!res.ok) {
    console.error(`SET API ${res.status} ${resource}:`, await res.text());
    return null;
  }

  const json = (await res.json()) as unknown;
  const rows = pickArray(json);
  return rows as T[];
}

export async function fetchSetStocks(options: {
  mode: QuoteMode;
  market?: string;
  symbols?: string[];
}): Promise<StockQuote[] | null> {
  const path = options.mode === "realtime" ? "realtime" : "delay";
  const params: Record<string, string> = {};
  if (options.market) params.market = options.market;
  if (options.symbols?.length) params.stockSymbol = options.symbols.join(",");

  const rows = await fetchSet<RawRecord>(path, "stock", params);
  if (!rows) return null;
  return rows.map(mapStock).filter((q) => q.symbol !== "—");
}

export async function fetchSetIndices(mode: QuoteMode): Promise<IndexQuote[] | null> {
  const path = mode === "realtime" ? "realtime" : "delay";
  const rows = await fetchSet<RawRecord>(path, "index", { market: "SET,mai" });
  if (!rows) return null;
  return rows.map(mapIndex);
}

export function hasSetApiKey(): boolean {
  return Boolean(process.env.SET_API_KEY?.trim());
}
