export function formatNumber(value: number | null, digits = 2): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("th-TH", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatVolume(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString("th-TH");
}

export function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("th-TH", { hour12: false });
  } catch {
    return iso;
  }
}

export function changeClass(change: number | null): string {
  if (change === null || change === 0) return "text-zinc-400";
  return change > 0 ? "text-emerald-400" : "text-rose-400";
}
