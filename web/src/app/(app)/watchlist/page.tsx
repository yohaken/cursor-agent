"use client";

import { useCallback, useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import { QuoteTable } from "@/components/quote-table";
import type { QuoteMode, StockQuote } from "@/lib/types";
import { pollIntervalMs } from "@/lib/types";

const WATCHLIST_KEY = "setpulse_watchlist";

export default function WatchlistPage() {
  const [mode, setMode] = useState<QuoteMode>("delay10");
  const [symbols, setSymbols] = useState<string[]>([]);
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [input, setInput] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem(WATCHLIST_KEY);
    if (raw) {
      try {
        const list = JSON.parse(raw) as string[];
        setSymbols(list);
        setWatchlist(new Set(list));
      } catch {
        /* ignore */
      }
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!symbols.length) {
      setQuotes([]);
      return;
    }
    const res = await fetch(
      `/api/quotes?mode=${mode}&market=SET,mai&symbols=${symbols.join(",")}`,
    );
    if (!res.ok) return;
    const json = await res.json();
    setQuotes(json.quotes ?? []);
  }, [mode, symbols]);

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, pollIntervalMs(mode));
    return () => window.clearInterval(id);
  }, [mode, symbols, refresh]);

  function persist(list: string[]) {
    setSymbols(list);
    setWatchlist(new Set(list));
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(list));
  }

  function addSymbol() {
    const sym = input.trim().toUpperCase();
    if (!sym || symbols.includes(sym)) return;
    persist([...symbols, sym]);
    setInput("");
  }

  function toggleWatch(symbol: string) {
    const next = symbols.filter((s) => s !== symbol);
    persist(next);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Watchlist</h2>
          <p className="text-sm text-zinc-500">ติดตามหลักทรัพย์ที่คุณสนใจ (เก็บในเบราว์เซอร์)</p>
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.toUpperCase())}
          placeholder="เช่น PTT, AOT"
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={addSymbol}
          className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-medium text-zinc-950"
        >
          เพิ่ม
        </button>
      </div>

      {symbols.length === 0 ? (
        <p className="text-sm text-zinc-500">ยังไม่มีหลักทรัพย์ใน watchlist — เพิ่มจากแดชบอร์ด (★) หรือช่องด้านบน</p>
      ) : (
        <QuoteTable quotes={quotes} watchlist={watchlist} onToggleWatch={toggleWatch} />
      )}
    </div>
  );
}
