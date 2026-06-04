"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState, Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("demo@setpulse.local");
  const [password, setPassword] = useState("demo12345");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "เข้าสู่ระบบไม่สำเร็จ");
      return;
    }
    const next = params.get("next") || "/";
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070b12] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-950/90 p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.2em] text-cyan-400/80">SET · mai</p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-100">SETPulse</h1>
        <p className="mt-2 text-sm text-zinc-500">
          รายงานราคาหุ้นแบบ ณ เวลานั้น หรือดีเลย์ 10 วินาที สำหรับตลาด SET และ mai
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <label className="block text-sm text-zinc-400">
            อีเมล
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-zinc-100 outline-none ring-cyan-400/40 focus:ring"
              required
            />
          </label>
          <label className="block text-sm text-zinc-400">
            รหัสผ่าน
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-zinc-100 outline-none ring-cyan-400/40 focus:ring"
              required
            />
          </label>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cyan-500 px-4 py-2.5 font-medium text-zinc-950 hover:bg-cyan-400 disabled:opacity-60"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>

        <p className="mt-6 text-xs leading-relaxed text-zinc-500">
          บัญชี demo เริ่มต้น: <code className="text-zinc-300">demo@setpulse.local</code> /{" "}
          <code className="text-zinc-300">demo12345</code>
          <br />
          ใส่ <code className="text-zinc-300">SET_API_KEY</code> ใน environment เพื่อดึงข้อมูลจริงจาก SET
          SMART Marketplace
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#070b12]" />}>
      <LoginForm />
    </Suspense>
  );
}
