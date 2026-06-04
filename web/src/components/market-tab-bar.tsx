"use client";

import type { MarketCode } from "@/lib/types";

type Props = {
  active: MarketCode;
  onChange: (market: MarketCode) => void;
};

export function MarketTabBar({ active, onChange }: Props) {
  const tabs: { id: MarketCode; label: string; hint: string }[] = [
    { id: "SET", label: "ตลาด SET", hint: "Top 20 มูลค่าตลาด" },
    { id: "mai", label: "ตลาด mai", hint: "Top 20 มูลค่าตลาด" },
  ];

  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/5 p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`rounded-lg px-4 py-2 text-sm transition ${
            active === tab.id
              ? tab.id === "mai"
                ? "bg-violet-500/25 text-violet-100"
                : "bg-cyan-500/25 text-cyan-100"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <span className="font-medium">{tab.label}</span>
          <span className="ml-2 hidden text-xs opacity-70 sm:inline">{tab.hint}</span>
        </button>
      ))}
    </div>
  );
}
