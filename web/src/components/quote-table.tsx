"use client";

import Link from "next/link";
import { changeClass, formatMarketCap, formatNumber, formatTime, formatVolume } from "@/lib/format";
import type { StockQuote } from "@/lib/types";

type Props = {
  quotes: StockQuote[];
  watchlist: Set<string>;
  onToggleWatch: (symbol: string) => void;
  showRank?: boolean;
};

export function QuoteTable({ quotes, watchlist, onToggleWatch, showRank = true }: Props) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/60">
      <table className="min-w-full text-sm">
        <thead className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3">★</th>
            {showRank && <th className="px-4 py-3 text-right">อันดับ</th>}
            <th className="px-4 py-3">หลักทรัพย์</th>
            <th className="px-4 py-3 text-right">มูลค่าตลาด</th>
            <th className="px-4 py-3 text-right">ราคาล่าสุด</th>
            <th className="px-4 py-3 text-right">% เปลี่ยนแปลง</th>
            <th className="px-4 py-3 text-right">ปริมาณ</th>
            <th className="px-4 py-3 text-right">เวลา</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q, index) => (
            <tr key={q.symbol} className="border-b border-white/5 hover:bg-white/5">
              <td className="px-4 py-3">
                <button
                  type="button"
                  aria-label={`เพิ่ม ${q.symbol} ใน watchlist`}
                  onClick={() => onToggleWatch(q.symbol)}
                  className={watchlist.has(q.symbol) ? "text-amber-300" : "text-zinc-600 hover:text-amber-200"}
                >
                  ★
                </button>
              </td>
              {showRank && (
                <td className="px-4 py-3 text-right font-mono text-zinc-500">{index + 1}</td>
              )}
              <td className="px-4 py-3">
                <Link href={`/stock/${q.symbol}`} className="group block">
                  <div className="font-medium text-cyan-300 group-hover:text-cyan-200 group-hover:underline">
                    {q.symbol}
                  </div>
                  <div className="text-xs text-zinc-500">{q.name}</div>
                </Link>
              </td>
              <td className="px-4 py-3 text-right font-mono text-zinc-300">
                {formatMarketCap(q.marketCap)}
              </td>
              <td className={`px-4 py-3 text-right font-mono ${changeClass(q.change)}`}>
                {formatNumber(q.last)}
              </td>
              <td className={`px-4 py-3 text-right font-mono ${changeClass(q.change)}`}>
                {q.changePercent === null ? "—" : `${formatNumber(q.changePercent)}%`}
              </td>
              <td className="px-4 py-3 text-right font-mono text-zinc-300">{formatVolume(q.volume)}</td>
              <td className="px-4 py-3 text-right text-xs text-zinc-500">{formatTime(q.asOf)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {quotes.length === 0 && (
        <p className="px-4 py-8 text-center text-sm text-zinc-500">ไม่พบข้อมูลในตลาดที่เลือก</p>
      )}
    </div>
  );
}
