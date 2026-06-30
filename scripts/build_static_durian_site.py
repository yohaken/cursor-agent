"""Build static HTML dashboard for GitHub Pages (no server required)."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "durian-dashboard.json"
OUT_DIR = Path(__file__).resolve().parent.parent / "docs" / "durian"
VARIETIES = ["หมอนทอง", "ชะนี", "ก้านยาว", "พวงมณี", "กระดุม", "สาริกา", "อื่นๆ"]
APP_TITLE = "ทุเรียน Dashboard — กรมส่งเสริมการเกษตร"
EXCEL_RAW = "https://github.com/yohaken/cursor-agent/raw/main/data/durian-dashboard-report.xlsx"


def _daily_df(data: dict) -> pd.DataFrame:
    rows = []
    for db_year, y in sorted(data.get("years", {}).items(), key=lambda x: int(x[0])):
        for d in y.get("combined_daily", []):
            rows.append(
                {
                    "be_year": int(db_year) + 543,
                    "season_week": d.get("season_week_aligned"),
                    "date_iso": d.get("date_iso"),
                    "total_volume": d.get("total_volume", 0),
                    "price_monthong_a": d.get("prices", {}).get("หมอนทอง", {}).get("A"),
                }
            )
    df = pd.DataFrame(rows)
    if not df.empty:
        df["date_iso"] = pd.to_datetime(df["date_iso"])
    return df


def _summary_df(data: dict) -> pd.DataFrame:
    rows = []
    for db_year, y in sorted(data.get("years", {}).items(), key=lambda x: int(x[0])):
        if not y.get("combined_daily"):
            continue
        s = y["combined_summary"]
        rows.append(
            {
                "be_year": int(db_year) + 543,
                "estimate_tons": s.get("estimate_tons"),
                "harvested_tons": s.get("harvested_tons"),
                "harvest_pct": s.get("harvest_pct"),
            }
        )
    return pd.DataFrame(rows)


def build_html(data: dict) -> str:
    df = _daily_df(data)
    summary = _summary_df(data)
    latest = summary.iloc[-1] if not summary.empty else None
    scraped = (data.get("scraped_at") or "")[:19]

    weekly = (
        df[df["price_monthong_a"].notna()]
        .groupby(["be_year", "season_week"], as_index=False)
        .agg(price=("price_monthong_a", "mean"), volume=("total_volume", "sum"))
    )
    weekly_vol = df.groupby(["be_year", "season_week"], as_index=False)["total_volume"].sum()

    fig_price = px.line(
        weekly,
        x="season_week",
        y="price",
        color="be_year",
        markers=True,
        title="ราคาหมอนทอง เกรด A — เปรียบเทียบหลายปี (บาท/กก.)",
        labels={"season_week": "สัปดาห์ของฤดู", "price": "ราคาเฉลี่ย", "be_year": "ปี พ.ศ."},
    )
    fig_price.update_layout(height=460, legend_title_text="ปี พ.ศ.")

    fig_vol = px.bar(
        weekly_vol,
        x="season_week",
        y="total_volume",
        color="be_year",
        barmode="group",
        title="ปริมาณผลผลิตรวมทั้งประเทศ (ตัน)",
        labels={"season_week": "สัปดาห์ของฤดู", "total_volume": "ตัน", "be_year": "ปี พ.ศ."},
    )
    fig_vol.update_layout(height=460, legend_title_text="ปี พ.ศ.")

    if not summary.empty:
        fig_annual = make_subplots(specs=[[{"secondary_y": False}]])
        fig_annual.add_trace(
            go.Bar(
                x=[f"พ.ศ. {y}" for y in summary["be_year"]],
                y=summary["harvested_tons"],
                name="เก็บเกี่ยวแล้ว",
                marker_color="#74c476",
            )
        )
        fig_annual.add_trace(
            go.Scatter(
                x=[f"พ.ศ. {y}" for y in summary["be_year"]],
                y=summary["estimate_tons"],
                name="ประมาณการ",
                mode="lines+markers",
                line=dict(color="#3182bd", dash="dash"),
            )
        )
        fig_annual.update_layout(title="ปริมาณผลผลิตรายปี", height=420)
    else:
        fig_annual = go.Figure()

    sub = df[df["price_monthong_a"].notna()].copy()
    if not sub.empty:
        sub["month"] = sub["date_iso"].dt.month
        thai_months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
        pivot = sub.groupby(["be_year", "month"])["price_monthong_a"].mean().reset_index()
        matrix = pivot.pivot(index="be_year", columns="month", values="price_monthong_a")
        fig_heat = px.imshow(
            matrix,
            labels=dict(x="เดือน", y="ปี พ.ศ.", color="ราคา"),
            x=[thai_months[m - 1] for m in matrix.columns],
            y=[f"พ.ศ. {y}" for y in matrix.index],
            title="Heatmap ราคาหมอนทอง เกรด A รายเดือน",
            color_continuous_scale="YlOrRd",
            aspect="auto",
        )
        fig_heat.update_layout(height=420)
    else:
        fig_heat = go.Figure()

    kpi_html = ""
    if latest is not None:
        kpi_html = f"""
        <div class="kpis">
          <div class="kpi"><div class="label">ปีล่าสุด</div><div class="value">พ.ศ. {int(latest['be_year'])}</div></div>
          <div class="kpi"><div class="label">ประมาณการรวม</div><div class="value">{latest['estimate_tons']:,.0f} ตัน</div></div>
          <div class="kpi"><div class="label">เก็บเกี่ยวแล้ว</div><div class="value">{latest['harvested_tons']:,.0f} ตัน</div></div>
          <div class="kpi"><div class="label">ความคืบหน้า</div><div class="value">{latest['harvest_pct'] or 0:.1f}%</div></div>
        </div>
        """

    charts = "\n".join(
        fig.to_html(full_html=False, include_plotlyjs=False)
        for fig in (fig_price, fig_vol, fig_annual, fig_heat)
    )

    summary_rows = ""
    for _, row in summary.iterrows():
        summary_rows += f"<tr><td>พ.ศ. {int(row['be_year'])}</td><td>{row['estimate_tons']:,.0f}</td><td>{row['harvested_tons']:,.0f}</td><td>{row['harvest_pct']:.1f}%</td></tr>"

    return f"""<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{APP_TITLE}</title>
  <script src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
  <style>
    body {{ font-family: 'Noto Sans Thai', sans-serif; margin: 0; background: #f6f8fa; color: #1f2328; }}
    header {{ background: linear-gradient(135deg,#1b5e20,#2e7d32); color: #fff; padding: 24px 20px; }}
    header h1 {{ margin: 0 0 8px; font-size: 1.6rem; }}
    header p {{ margin: 0; opacity: .9; }}
    .wrap {{ max-width: 1200px; margin: 0 auto; padding: 20px; }}
    .kpis {{ display: grid; grid-template-columns: repeat(auto-fit,minmax(180px,1fr)); gap: 12px; margin: 20px 0; }}
    .kpi {{ background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }}
    .kpi .label {{ font-size: .85rem; color: #656d76; }}
    .kpi .value {{ font-size: 1.35rem; font-weight: 700; margin-top: 6px; }}
    .actions {{ margin: 16px 0 24px; }}
    .btn {{ display: inline-block; background: #2e7d32; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; margin-right: 8px; }}
    .btn.secondary {{ background: #fff; color: #2e7d32; border: 1px solid #2e7d32; }}
    .card {{ background: #fff; border-radius: 12px; padding: 8px; margin-bottom: 20px; box-shadow: 0 1px 4px rgba(0,0,0,.08); }}
    table {{ width: 100%; border-collapse: collapse; background: #fff; border-radius: 12px; overflow: hidden; }}
    th, td {{ padding: 10px 12px; border-bottom: 1px solid #eee; text-align: right; }}
    th:first-child, td:first-child {{ text-align: left; }}
    th {{ background: #f0f4f0; }}
    footer {{ color: #656d76; font-size: .85rem; padding: 24px 20px 40px; }}
  </style>
</head>
<body>
  <header>
    <div class="wrap">
      <h1>🥭 {APP_TITLE}</h1>
      <p>ข้อมูลรวมภาคตะวันออก + ภาคใต้ | อัปเดตล่าสุด {scraped} UTC | อัปเดตอัตโนมัติทุกวัน 08:00 น.</p>
    </div>
  </header>
  <div class="wrap">
    {kpi_html}
    <div class="actions">
      <a class="btn" href="{EXCEL_RAW}">ดาวน์โหลด Excel ทั้งหมด</a>
      <a class="btn secondary" href="https://simplefruit.doae.go.th/dashboard/index" target="_blank">แหล่งข้อมูลต้นทาง DOAE</a>
    </div>
    <div class="card">{charts}</div>
    <h2>สรุปรายปี</h2>
    <table>
      <thead><tr><th>ปี</th><th>ประมาณการ (ตัน)</th><th>เก็บเกี่ยวแล้ว (ตัน)</th><th>ความคืบหน้า</th></tr></thead>
      <tbody>{summary_rows}</tbody>
    </table>
  </div>
  <footer class="wrap">
    ราคา = ค่าเฉลี่ยถ่วงน้ำหนักตามปริมาณรายวัน | แกน X สัปดาห์ของฤดู = นับจากวันแรกที่มีผลผลิต
  </footer>
</body>
</html>"""


def main() -> Path:
    if not DATA_PATH.exists():
        raise FileNotFoundError(DATA_PATH)
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    docs_root = OUT_DIR.parent
    (OUT_DIR / "index.html").write_text(build_html(data), encoding="utf-8")
    (docs_root / "index.html").write_text(
        '<!DOCTYPE html><html><head><meta charset="utf-8">'
        '<meta http-equiv="refresh" content="0;url=durian/"></head>'
        '<body><a href="durian/">ทุเรียน Dashboard</a></body></html>',
        encoding="utf-8",
    )
    return OUT_DIR / "index.html"


if __name__ == "__main__":
    out = main()
    print(f"Built: {out}")
