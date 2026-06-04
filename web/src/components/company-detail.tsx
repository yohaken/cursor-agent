"use client";

import Link from "next/link";
import { useState } from "react";
import type { CompanyProfile, MdaSummaryResult } from "@/lib/types";

type Props = {
  profile: CompanyProfile;
};

export function CompanyDetail({ profile }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MdaSummaryResult | null>(null);
  const [error, setError] = useState("");

  async function downloadAndSummarize() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/company/${profile.symbol}/mda-summary`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "ไม่สามารถสรุปรายงานได้");
        return;
      }
      setResult(data as MdaSummaryResult);
    } catch {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setLoading(false);
    }
  }

  function downloadRaw() {
    if (!result) return;
    const blob = new Blob([result.rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${profile.symbol}-mda-${result.quarter}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={profile.market === "mai" ? "/mai" : "/"} className="text-sm text-cyan-400 hover:underline">
          ← กลับรายชื่อ{profile.market === "mai" ? " mai" : " SET"}
        </Link>
        <h2 className="mt-3 text-3xl font-bold">
          {profile.symbol}{" "}
          <span className="text-lg font-normal text-zinc-400">{profile.name}</span>
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          ตลาด {profile.market} · {profile.sector} · งวดล่าสุด {profile.latestQuarter}
        </p>
      </div>

      <section className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        <h3 className="text-lg font-semibold text-zinc-100">ลักษณะการประกอบธุรกิจ</h3>
        <p className="mt-3 leading-relaxed text-zinc-300">{profile.businessDescription}</p>
        {profile.website && (
          <a
            href={profile.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block text-sm text-cyan-400 hover:underline"
          >
            เว็บไซต์บริษัท →
          </a>
        )}
      </section>

      <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
        <h3 className="text-lg font-semibold text-amber-100">รายงานฝ่ายจัดการ (MD&amp;A)</h3>
        <p className="mt-2 text-sm text-zinc-400">
          ดาวน์โหลดข้อความฝ่ายจัดการไตรมาสล่าสุด ({profile.latestQuarter}) แล้วให้ระบบสรุปวิเคราะห์ให้ทันที
        </p>
        <button
          type="button"
          onClick={downloadAndSummarize}
          disabled={loading}
          className="mt-4 rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-medium text-zinc-950 hover:bg-amber-400 disabled:opacity-60"
        >
          {loading ? "กำลังดาวน์โหลดและสรุป..." : "ดาวน์โหลดและสรุปรายงานฝ่ายจัดการ"}
        </button>
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
      </section>

      {result && (
        <section className="space-y-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-cyan-100">
              สรุปวิเคราะห์ {result.quarter}
            </h3>
            <button
              type="button"
              onClick={downloadRaw}
              className="rounded-xl border border-white/10 px-3 py-2 text-sm text-zinc-300 hover:bg-white/5"
            >
              ดาวน์โหลดต้นฉบับ (.txt)
            </button>
          </div>
          <p className="whitespace-pre-wrap leading-relaxed text-zinc-200">{result.summary}</p>
          <ul className="list-disc space-y-2 pl-5 text-sm text-zinc-400">
            {result.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
          <p className="text-xs text-zinc-600">
            ดาวน์โหลดเมื่อ {new Date(result.downloadedAt).toLocaleString("th-TH")} · โหมดสรุปอัตโนมัติ (demo)
          </p>
        </section>
      )}
    </div>
  );
}
