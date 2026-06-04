"use client";

import { changeClass, formatNumber } from "@/lib/format";
import type { IndexQuote } from "@/lib/types";

export function IndexCards({ indices }: { indices: IndexQuote[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {indices.map((idx) => (
        <div
          key={idx.symbol}
          className="rounded-2xl border border-white/10 bg-gradient-to-br from-zinc-900/80 to-zinc-950/80 p-4"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">{idx.market}</p>
              <h3 className="text-lg font-semibold text-zinc-100">{idx.name}</h3>
            </div>
            <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-zinc-400">{idx.symbol}</span>
          </div>
          <p className={`mt-3 font-mono text-2xl font-semibold ${changeClass(idx.change)}`}>
            {formatNumber(idx.last, 2)}
          </p>
          <p className={`mt-1 text-sm font-mono ${changeClass(idx.change)}`}>
            {idx.change === null
              ? "—"
              : `${idx.change > 0 ? "+" : ""}${formatNumber(idx.change)} (${formatNumber(idx.changePercent)}%)`}
          </p>
        </div>
      ))}
    </div>
  );
}
