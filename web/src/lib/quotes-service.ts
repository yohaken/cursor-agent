import { getDelayedQuotes, pushRealtimeSnapshot } from "./quote-buffer";
import { getMockIndices, getMockStocks } from "./mock-engine";
import { fetchSetIndices, fetchSetStocks, hasSetApiKey } from "./set-api";
import type { IndexQuote, QuoteMode, QuotesResponse, StockQuote } from "./types";

export async function resolveStockQuotes(options: {
  mode: QuoteMode;
  market: string;
  symbols?: string[];
}): Promise<QuotesResponse> {
  const { mode, market, symbols } = options;
  let source: "set" | "mock" = "mock";
  let quotes: StockQuote[] = [];

  if (hasSetApiKey()) {
    if (mode === "delay10") {
      const delayed = await fetchSetStocks({ mode: "delay10", market, symbols });
      if (delayed?.length) {
        quotes = delayed;
        source = "set";
      }
    } else {
      const live = await fetchSetStocks({ mode: "realtime", market, symbols });
      if (live?.length) {
        quotes = live;
        source = "set";
      }
    }
  }

  if (!quotes.length) {
    const fresh = getMockStocks(symbols, market);
    if (mode === "delay10") {
      pushRealtimeSnapshot(fresh);
      quotes = getDelayedQuotes() ?? fresh;
    } else {
      quotes = fresh;
    }
  }

  return {
    mode,
    source,
    market,
    updatedAt: new Date().toISOString(),
    quotes,
  };
}

export async function resolveIndexQuotes(mode: QuoteMode): Promise<{
  source: "set" | "mock";
  updatedAt: string;
  indices: IndexQuote[];
}> {
  let source: "set" | "mock" = "mock";
  let indices: IndexQuote[] = [];

  if (hasSetApiKey()) {
    const fromSet = await fetchSetIndices(mode === "realtime" ? "realtime" : "delay10");
    if (fromSet?.length) {
      indices = fromSet;
      source = "set";
    }
  }

  if (!indices.length) {
    indices = getMockIndices();
  }

  return { source, updatedAt: new Date().toISOString(), indices };
}

export function pollIntervalMs(mode: QuoteMode): number {
  return mode === "realtime" ? 2000 : 10_000;
}
