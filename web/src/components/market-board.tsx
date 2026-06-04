"use client";

import { useCallback, useEffect, useState } from "react";
import { IndexCards } from "@/components/index-cards";
import { ModeToggle } from "@/components/mode-toggle";
import { QuoteTable } from "@/components/quote-table";
import { pollIntervalMs } from "@/lib/types";
import type { IndexQuote, MarketCode, QuoteMode, StockQuote } from "@/lib/types";

const WATCHLIST_KEY = "setpulse_watchlist";
const TOP_N = 20;

type Props = {
  market: MarketCode;
  title: string;
  subtitle: string;
};

export function MarketBoard({ market, title, subtitle }: Props) {
  const [mode, setMode] = useState<QuoteMode>("delay10");
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

  const refresh = useCallback(async () => {
    try {
      const [qRes, iRes] = await Promise.all([
        fetch(`/api/quotes?mode=${mode}&market=${market}&top=${TOP_N}`),
        fetch(`/api/indices?mode=${mode}`),
      ]);
      if (!qRes.ok || !iRes.ok) return;
      const qJson = await qRes.json();
      const iJson = await iRes.json();
      setQuotes(qJson.quotes ?? []);
      const allIndices: IndexQuote[] = iJson.indices ?? [];
      setIndices(
        market === "mai"
          ? allIndices.filter((i) => i.market === "mai" || i.symbol.toLowerCase() === "mai")
          : allIndices.filter((i) => i.market === "SET" || ["SET", "SET50"].includes(i.symbol)),
      );
      setSource(qJson.source ?? "mock");
      setUpdatedAt(qJson.updatedAt ?? new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [mode, market]);

  useEffect(() => {
    setLoading(true);
    refresh();
    const id = window.setInterval(refresh, pollIntervalMs(mode));
    return () => window.clearInterval(id);
  }, [mode, market, refresh]);

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
          <h2 className="text-2xl font-semibold">{title}</h2>
          <p className="text-sm text-zinc-500">{subtitle}</p>
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
        <span className="rounded-full border border-white/10 px-2 py-1">
          Top {TOP_N} มูลค่าตลาดสูงสุด
        </span>
        <span className="rounded-full border border-white/10 px-2 py-1">
          แหล่งข้อมูล: {source === "set" ? "SET SMART Marketplace" : "จำลอง (demo)"}
        </span>
        <span className="rounded-full border border-white/10 px-2 py-1">
          อัปเดต: {updatedAt ? new Date(updatedAt).toLocaleString("th-TH") : "—"}
        </span>
      </div>

      {indices.length > 0 && <IndexCards indices={indices} />}

      {loading ? (
        <p className="text-sm text-zinc-500">กำลังโหลดรายชื่อ...</p>
      ) : (
        <QuoteTable quotes={quotes} watchlist={watchlist} onToggleWatch={toggleWatch} />
      )}
    </div>
  );
}
