"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "แดชบอร์ด" },
  { href: "/watchlist", label: "Watchlist" },
  { href: "/reports", label: "รายงาน" },
];

export function AppShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#070b12] text-zinc-100">
      <header className="border-b border-white/10 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-400/80">SET · mai</p>
            <h1 className="text-xl font-bold">SETPulse</h1>
            <p className="text-xs text-zinc-500">รายงานราคาหุ้น SaaS ส่วนตัว</p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-xl px-3 py-2 text-sm transition ${
                  pathname === item.href
                    ? "bg-cyan-500/15 text-cyan-200"
                    : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-zinc-500 sm:inline">{email}</span>
            <button
              type="button"
              onClick={logout}
              className="rounded-xl border border-white/10 px-3 py-2 text-zinc-300 hover:bg-white/5"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
