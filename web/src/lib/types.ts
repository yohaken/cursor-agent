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
  /** มูลค่าการซื้อขาย (บาท) */
  value: number;
  /** มูลค่าตลาด (บาท) — ใช้จัดอันดับ Top 20 */
  marketCap: number;
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
  top: number;
  updatedAt: string;
  quotes: StockQuote[];
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  market: MarketCode;
  sector: string;
  businessDescription: string;
  website?: string;
  latestQuarter: string;
}

export interface MdaSummaryResult {
  symbol: string;
  quarter: string;
  downloadedAt: string;
  summary: string;
  highlights: string[];
  rawText: string;
}

export function pollIntervalMs(mode: QuoteMode): number {
  return mode === "realtime" ? 2000 : 10_000;
}
