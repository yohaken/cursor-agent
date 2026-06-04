import type { StockQuote } from "./types";

type Snapshot = { capturedAt: number; quotes: StockQuote[] };

const DELAY_MS = 10_000;

function getBuffer(): Snapshot[] {
  const g = globalThis as typeof globalThis & { __setPulseBuffer?: Snapshot[] };
  if (!g.__setPulseBuffer) g.__setPulseBuffer = [];
  return g.__setPulseBuffer;
}

export function pushRealtimeSnapshot(quotes: StockQuote[]): void {
  const buffer = getBuffer();
  buffer.push({ capturedAt: Date.now(), quotes });
  const cutoff = Date.now() - DELAY_MS * 3;
  while (buffer.length > 0 && buffer[0].capturedAt < cutoff) {
    buffer.shift();
  }
}

export function getDelayedQuotes(now = Date.now()): StockQuote[] | null {
  const target = now - DELAY_MS;
  const buffer = getBuffer();
  let chosen: Snapshot | undefined;
  for (const snap of buffer) {
    if (snap.capturedAt <= target) chosen = snap;
    else break;
  }
  return chosen?.quotes ?? null;
}

export const QUOTE_DELAY_MS = DELAY_MS;
