"use client";

import { MarketBoard } from "@/components/market-board";
import { MarketTabBar } from "@/components/market-tab-bar";
import type { MarketCode } from "@/lib/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function DashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const initial: MarketCode = tabParam === "mai" ? "mai" : "SET";
  const [market, setMarket] = useState<MarketCode>(initial);

  useEffect(() => {
    setMarket(tabParam === "mai" ? "mai" : "SET");
  }, [tabParam]);

  const onTabChange = useCallback(
    (next: MarketCode) => {
      setMarket(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "mai") params.set("tab", "mai");
      else params.delete("tab");
      const q = params.toString();
      router.replace(q ? `/?${q}` : "/", { scroll: false });
    },
    [router, searchParams],
  );

  const copy =
    market === "mai"
      ? {
          title: "ตลาด mai",
          subtitle: "รายชื่อหุ้น mai เท่านั้น · Top 20 มูลค่าตลาดสูงสุด",
        }
      : {
          title: "ตลาด SET",
          subtitle: "รายชื่อหุ้น SET เท่านั้น · Top 20 มูลค่าตลาดสูงสุด",
        };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">ภาพรวมตลาดหุ้นไทย</h2>
          <p className="text-sm text-zinc-500">สลับแท็บเพื่อดูแต่ละตลาดในหน้าเดียว · คลิกหลักทรัพย์เพื่อดูข้อมูลบริษัท</p>
        </div>
        <MarketTabBar active={market} onChange={onTabChange} />
      </div>

      <MarketBoard
        key={market}
        market={market}
        title={copy.title}
        subtitle={copy.subtitle}
      />
    </div>
  );
}

export function MarketDashboard() {
  return (
    <Suspense fallback={<p className="text-sm text-zinc-500">กำลังโหลด...</p>}>
      <DashboardInner />
    </Suspense>
  );
}
