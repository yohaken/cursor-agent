"use client";

import { useCallback, useEffect, useState } from "react";
import { ModeToggle } from "@/components/mode-toggle";
import type { QuoteMode, StockQuote } from "@/lib/types";

export default function ReportsPage() {
  const [mode, setMode] = useState<QuoteMode>("delay10");
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [generatedAt, setGeneratedAt] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/quotes?mode=${mode}&market=SET,mai`);
    if (!res.ok) return;
    const json = await res.json();
    setQuotes(json.quotes ?? []);
    setGeneratedAt(json.updatedAt ?? new Date().toISOString());
  }, [mode]);

  useEffect(() => {
    load();
  }, [load]);

  function downloadCsv() {
    const header = [
      "symbol",
      "name",
      "market",
      "last",
      "change",
      "changePercent",
      "volume",
      "value",
      "asOf",
    ];
    const rows = quotes.map((q) =>
      [
        q.symbol,
        q.name,
        q.market,
        q.last,
        q.change,
        q.changePercent,
        q.volume,
        q.value,
        q.asOf,
      ].join(","),
    );
    const csv = [header.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `setpulse-report-${mode}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">รายงานสรุปราคา</h2>
          <p className="text-sm text-zinc-500">ส่งออก snapshot ราคาหุ้น SET / mai เป็น CSV</p>
        </div>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-4 text-sm text-zinc-400">
        <p>โหมด: {mode === "realtime" ? "ณ เวลานั้น" : "ดีเลย์ 10 วินาที"}</p>
        <p>สร้างเมื่อ: {generatedAt ? new Date(generatedAt).toLocaleString("th-TH") : "—"}</p>
        <p>จำนวนหลักทรัพย์: {quotes.length}</p>
      </div>

      <button
        type="button"
        onClick={downloadCsv}
        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-zinc-950 hover:bg-emerald-400"
      >
        ดาวน์โหลด CSV
      </button>

      <p className="text-xs text-zinc-600">
        ข้อมูลจาก SET SMART Marketplace ต้องมีสิทธิ์ใช้งานตามเงื่อนไขของตลาดหลักทรัพย์ — ใช้เพื่อการลงทุนส่วนบุคคลเท่านั้น
      </p>
    </div>
  );
}
