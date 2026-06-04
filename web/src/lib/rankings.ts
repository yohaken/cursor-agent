import type { StockQuote } from "./types";

/** จัดอันดับตามมูลค่าตลาด (มูลค่าสูงสุดก่อน) */
export function topByMarketCap(quotes: StockQuote[], limit = 20): StockQuote[] {
  return [...quotes]
    .sort((a, b) => b.marketCap - a.marketCap)
    .slice(0, limit);
}
