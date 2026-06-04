"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { IndexCards } from "@/components/index-cards";
import { ModeToggle } from "@/components/mode-toggle";
import { QuoteTable } from "@/components/quote-table";
import { pollIntervalMs } from "@/lib/types";
import type { IndexQuote, QuoteMode, StockQuote } from "@/lib/types";

const WATCHLIST_KEY = "setpulse_watchlist";

type Props = {
  email: string;
};

export function DashboardClient({ email }: Props) {
  const [mode, setMode] = useState<QuoteMode>("delay10");
  const [marketFilter, setMarketFilter] = useState<"all" | "SET" | "mai">("all");
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [indices, setIndices] = useState<IndexQuote[]>([]);
  const [source, setSource] = useState<"set" | "mock">("mock");
  const [updatedAt, setUpdatedAt] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  useEffect(() => {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (raw) {
      try {
        setWatchlist(new Set(JSON.parse(raw) as string[]));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const marketParam = useMemo(() => {
    if (marketFilter === "SET") return "SET";
    if (marketFilter === "mai") return "mai";
    return "SET,mai";
  }, [marketFilter]);

  const refresh = useCallback(async () => {
    try {
      const [qRes, iRes] = await Promise.all([
        fetch(`/api/quotes?mode=${mode}&market=${encodeURIComponent(marketParam)}`),
        fetch(`/api/indices?mode=${mode}`),
      ]);
      if (!qRes.ok || !iRes.ok) return;
      const qJson = await qRes.json();
      const iJson = await iRes.json();
      setQuotes(qJson.quotes ?? []);
      setIndices(iJson.indices ?? []);
      setSource(qJson.source ?? "mock");
      setUpdatedAt(qJson.updatedAt ?? new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [mode, marketParam]);

  useEffect(() => {
    setLoading(true);
    refresh();
    const id = window.setInterval(refresh, pollIntervalMs(mode));
    return () => window.clearInterval(id);
  }, [mode, marketParam, refresh]);

  function toggleWatch(symbol: string) {
    setWatchlist((prev) => {
      const next = new Set(prev);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify([...next]));
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">สวัสดี {email}</p>
          <h2 className="text-2xl font-semibold">ภาพรวมตลาด SET / mai</h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <ModeToggle mode={mode} onChange={setMode} />
          <select
            value={marketFilter}
            onChange={(e) => setMarketFilter(e.target.value as "all" | "SET" | "mai")}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200"
          >
            <option value="all">ทุกตลาด</option>
            <option value="SET">SET</option>
            <option value="mai">mai</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="rounded-full border border-white/10 px-2 py-1">
          แหล่งข้อมูล: {source === "set" ? "SET SMART Marketplace" : "จำลอง (demo)"}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-1">
          อัปเดตล่าสุด: {updatedAt ? new Date(updatedAt).toLocaleString("th-TH") : "—"}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-1">
          รีเฟรชทุก {pollIntervalMs(mode) / 1000} วินาที
        </span>
      </div>

      <IndexCards indices={indices} />

      {loading ? (
        <p className="text-sm text-zinc-500">กำลังโหลดราคา...</p>
      ) : (
        <QuoteTable quotes={quotes} watchlist={watchlist} onToggleWatch={toggleWatch} />
      )}
    </div>
  );
}
