"use client";

import type { QuoteMode } from "@/lib/types";

type Props = {
  mode: QuoteMode;
  onChange: (mode: QuoteMode) => void;
};

export function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1 text-sm">
      <button
        type="button"
        onClick={() => onChange("realtime")}
        className={`rounded-lg px-3 py-1.5 transition ${
          mode === "realtime" ? "bg-cyan-500/20 text-cyan-200" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        ณ เวลานั้น
      </button>
      <button
        type="button"
        onClick={() => onChange("delay10")}
        className={`rounded-lg px-3 py-1.5 transition ${
          mode === "delay10" ? "bg-amber-500/20 text-amber-200" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        ดีเลย์ 10 วิ
      </button>
    </div>
  );
}
