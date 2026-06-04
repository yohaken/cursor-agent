import type { IndexQuote, MarketCode, StockQuote } from "./types";

type MockState = {
  stocks: Map<string, StockQuote>;
  indices: Map<string, IndexQuote>;
};

const SEED_STOCKS: Array<{
  symbol: string;
  name: string;
  market: MarketCode;
  base: number;
}> = [
  { symbol: "PTT", name: "ปตท.", market: "SET", base: 34.5 },
  { symbol: "AOT", name: "ท่าอากาศยานไทย", market: "SET", base: 68.25 },
  { symbol: "CPALL", name: "ซีพี ออลล์", market: "SET", base: 58.0 },
  { symbol: "ADVANC", name: "แอดวานซ์", market: "SET", base: 298.0 },
  { symbol: "KBANK", name: "กสิกรไทย", market: "SET", base: 142.5 },
  { symbol: "DELTA", name: "เดลต้า", market: "SET", base: 62.0 },
  { symbol: "HUMAN", name: "ฮิวแมนิก้า", market: "mai", base: 12.4 },
  { symbol: "PROEN", name: "พราวน์ เอ็นจิเนียริ่ง", market: "mai", base: 8.75 },
  { symbol: "ITEL", name: "อินเตอร์ เน็ต", market: "mai", base: 4.2 },
  { symbol: "JASIF", name: "จัสมิน อินเตอร์เนชั่นแนล", market: "mai", base: 6.85 },
];

const SEED_INDICES = [
  { symbol: "SET", name: "ดัชนี SET", market: "SET" as MarketCode, base: 1425.32 },
  { symbol: "SET50", name: "ดัชนี SET50", market: "SET" as MarketCode, base: 1024.18 },
  { symbol: "mai", name: "ดัชนี mai", market: "mai" as MarketCode, base: 412.55 },
];

function getState(): MockState {
  const g = globalThis as typeof globalThis & { __setPulseMock?: MockState };
  if (!g.__setPulseMock) {
    const now = new Date().toISOString();
    const stocks = new Map<string, StockQuote>();
    for (const s of SEED_STOCKS) {
      stocks.set(s.symbol, {
        symbol: s.symbol,
        name: s.name,
        market: s.market,
        last: s.base,
        change: 0,
        changePercent: 0,
        volume: 1_200_000,
        value: s.base * 1_200_000,
        bid: s.base - 0.02,
        offer: s.base + 0.02,
        high: s.base + 0.5,
        low: s.base - 0.5,
        prior: s.base,
        asOf: now,
      });
    }
    const indices = new Map<string, IndexQuote>();
    for (const i of SEED_INDICES) {
      indices.set(i.symbol, {
        symbol: i.symbol,
        name: i.name,
        market: i.market,
        last: i.base,
        change: 0,
        changePercent: 0,
        asOf: now,
      });
    }
    g.__setPulseMock = { stocks, indices };
  }
  return g.__setPulseMock;
}

function tickPrice(price: number): number {
  const delta = (Math.random() - 0.5) * 0.08;
  return Math.max(0.01, Math.round((price + delta) * 100) / 100);
}

export function advanceMockMarket(): void {
  const state = getState();
  const now = new Date().toISOString();

  for (const quote of state.stocks.values()) {
    const prior = quote.last ?? quote.prior ?? 1;
    const last = tickPrice(prior);
    const change = Math.round((last - prior) * 100) / 100;
    const changePercent = prior ? Math.round((change / prior) * 10000) / 100 : 0;
    const volumeDelta = Math.floor(Math.random() * 80_000);
    quote.last = last;
    quote.change = change;
    quote.changePercent = changePercent;
    quote.volume += volumeDelta;
    quote.value += volumeDelta * last;
    quote.bid = Math.round((last - 0.02) * 100) / 100;
    quote.offer = Math.round((last + 0.02) * 100) / 100;
    quote.high = Math.max(quote.high ?? last, last);
    quote.low = Math.min(quote.low ?? last, last);
    quote.asOf = now;
  }

  for (const idx of state.indices.values()) {
    const prior = idx.last ?? 1;
    const last = Math.round(tickPrice(prior) * 100) / 100;
    const change = Math.round((last - prior) * 100) / 100;
    idx.last = last;
    idx.change = change;
    idx.changePercent = prior ? Math.round((change / prior) * 10000) / 100 : 0;
    idx.asOf = now;
  }
}

export function getMockStocks(symbols?: string[], market?: string): StockQuote[] {
  advanceMockMarket();
  const state = getState();
  let list = [...state.stocks.values()];
  if (market) {
    const markets = market.split(",").map((m) => m.trim().toLowerCase());
    list = list.filter((q) => markets.includes(q.market.toLowerCase()));
  }
  if (symbols?.length) {
    const set = new Set(symbols.map((s) => s.toUpperCase()));
    list = list.filter((q) => set.has(q.symbol));
  }
  return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function getMockIndices(): IndexQuote[] {
  advanceMockMarket();
  return [...getState().indices.values()];
}
