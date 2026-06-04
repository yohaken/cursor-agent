/** สรุปข้อความฝ่ายจัดการแบบ rule-based สำหรับ demo (ไม่ใช้ LLM ภายนอก) */
export function summarizeMda(rawText: string, symbol: string, quarter: string): {
  summary: string;
  highlights: string[];
} {
  const sentences = rawText
    .split(/[.。]\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);

  const highlights = sentences.slice(0, 4).map((s) => (s.endsWith(".") ? s : `${s}.`));

  const summary = [
    `สรุปรายงานฝ่ายจัดการ ${symbol} งวด ${quarter}:`,
    highlights.join(" "),
    "โดยรวมบริษัทยังมุ่งควบคุมต้นทุนและบริหารความเสี่ยงจากปัจจัยภายนอกอย่างต่อเนื่อง",
  ].join("\n\n");

  return { summary, highlights };
}
