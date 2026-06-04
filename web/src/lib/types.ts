export type QuoteMode = "realtime" | "delay10";

export type MarketCode = "SET" | "mai";

export interface StockQuote {
  symbol: string;
  name: string;
  market: MarketCode;
  last: number | null;
  change: number | null;
  changePercent: number | null;
  volume: number;
  value: number;
  bid: number | null;
  offer: number | null;
  high: number | null;
  low: number | null;
  prior: number | null;
  asOf: string;
}

export interface IndexQuote {
  symbol: string;
  name: string;
  market: MarketCode;
  last: number | null;
  change: number | null;
  changePercent: number | null;
  asOf: string;
}

export interface QuotesResponse {
  mode: QuoteMode;
  source: "set" | "mock";
  market: string;
  updatedAt: string;
  quotes: StockQuote[];
}

export interface IndicesResponse {
  mode: QuoteMode;
  source: "set" | "mock";
  updatedAt: string;
  indices: IndexQuote[];
}

export function pollIntervalMs(mode: QuoteMode): number {
  return mode === "realtime" ? 2000 : 10_000;
}
