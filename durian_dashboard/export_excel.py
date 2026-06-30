"""Export durian dashboard JSON dataset to Excel workbook."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd

from durian_dashboard.scraper import VARIETIES

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "durian-dashboard.json"
DEFAULT_OUTPUT = Path(__file__).resolve().parent.parent / "data" / "durian-dashboard-report.xlsx"

EAST_GRADES = ("A", "ตกไซส์")
SOUTH_GRADES = ("A", "B")
COMBINED_GRADES = ("A", "ตกไซส์", "B")


def _price_columns(prices: dict, prefix: str = "") -> dict[str, float | None]:
    out: dict[str, float | None] = {}
    for variety in VARIETIES:
        for grade in COMBINED_GRADES:
            key = f"{prefix}{variety}_{grade}" if prefix else f"{variety}_{grade}"
            out[key] = prices.get(variety, {}).get(grade)
    return out


def _flatten_combined_daily(rows: list[dict]) -> pd.DataFrame:
    records = []
    for row in rows:
        rec = {
            "ปี_คศ": row.get("db_year"),
            "ปี_พศ": row.get("be_year"),
            "วันที่": row.get("date_iso"),
            "วันที่_ไทย": row.get("date_th"),
            "สัปดาห์_ต้นทาง": row.get("season_week"),
            "สัปดาห์_ฤดู": row.get("season_week_aligned"),
            "วันที่_ของฤดู": row.get("season_day"),
            "ปริมาณ_ภาคตะวันออก_ตัน": row.get("east_volume"),
            "ปริมาณ_ภาคใต้_ตัน": row.get("south_volume"),
            "ปริมาณรวม_ตัน": row.get("total_volume"),
        }
        rec.update(_price_columns(row.get("prices", {}), prefix="ราคา_"))
        records.append(rec)
    return pd.DataFrame(records)


def _flatten_region_daily(rows: list[dict], region_label: str) -> pd.DataFrame:
    grade_a, grade_b = ("A", "ตกไซส์") if region_label == "ภาคตะวันออก" else ("A", "B")
    records = []
    for row in rows:
        rec = {
            "ภูมิภาค": region_label,
            "ปี_คศ": row.get("db_year"),
            "ปี_พศ": row.get("be_year"),
            "วันที่": row.get("date_iso"),
            "วันที่_ไทย": row.get("date_th"),
            "สัปดาห์": row.get("season_week"),
            "ปริมาณ_ตัน": row.get("volume_tons"),
            f"สัดส่วนเกรด_{grade_a}_pct": row.get("grade_pct", {}).get(grade_a),
            f"สัดส่วนเกรด_{grade_b}_pct": row.get("grade_pct", {}).get(grade_b),
        }
        for variety in VARIETIES:
            p = row.get("prices", {}).get(variety, {})
            rec[f"ราคา_{variety}_{grade_a}"] = p.get(grade_a)
            rec[f"ราคา_{variety}_{grade_b}"] = p.get(grade_b)
        records.append(rec)
    return pd.DataFrame(records)


def _summary_rows(data: dict) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    combined, east, south = [], [], []
    for db_year, year in sorted(data.get("years", {}).items(), key=lambda x: int(x[0])):
        if not year.get("combined_daily"):
            continue
        cs = year.get("combined_summary", {})
        combined.append(
            {
                "ปี_คศ": int(db_year),
                "ปี_พศ": year.get("be_year"),
                "ประมาณการ_ตัน": cs.get("estimate_tons"),
                "เก็บเกี่ยวแล้ว_ตัน": cs.get("harvested_tons"),
                "ความคืบหน้า_pct": cs.get("harvest_pct"),
                "มูลค่าผลผลิต_บาท": cs.get("season_value_baht"),
                "จำนวนวันมีข้อมูล": len(year.get("combined_daily", [])),
            }
        )
        for rname, rlabel in (("east", "ภาคตะวันออก"), ("south", "ภาคใต้")):
            rs = year["regions"][rname]["summary"]
            row = {
                "ภูมิภาค": rlabel,
                "ปี_คศ": int(db_year),
                "ปี_พศ": year.get("be_year"),
                "ประมาณการ_ตัน": rs.get("estimate_tons"),
                "เก็บเกี่ยวแล้ว_ตัน": rs.get("harvested_tons"),
                "ความคืบหน้า_pct": rs.get("harvest_pct"),
                "มูลค่าผลผลิต_บาท": rs.get("season_value_baht"),
                "จำนวนวันมีข้อมูล": len(year["regions"][rname].get("daily_table", [])),
            }
            (east if rname == "east" else south).append(row)
    return pd.DataFrame(combined), pd.DataFrame(east), pd.DataFrame(south)


def _weekly_combined(daily: pd.DataFrame) -> pd.DataFrame:
    if daily.empty:
        return daily
    price_cols = [c for c in daily.columns if c.startswith("ราคา_หมอนทอง")]
    agg: dict[str, str | tuple] = {
        "ปริมาณรวม_ตัน": "sum",
        "ปริมาณ_ภาคตะวันออก_ตัน": "sum",
        "ปริมาณ_ภาคใต้_ตัน": "sum",
        "วันที่": "count",
    }
    for col in price_cols:
        agg[col] = "mean"
    weekly = (
        daily.groupby(["ปี_พศ", "สัปดาห์_ฤดู"], as_index=False)
        .agg(agg)
        .rename(columns={"วันที่": "จำนวนวัน"})
        .sort_values(["ปี_พศ", "สัปดาห์_ฤดู"])
    )
    return weekly


def export_excel(
    data_path: Path = DATA_PATH,
    output_path: Path = DEFAULT_OUTPUT,
) -> Path:
    if not data_path.exists():
        raise FileNotFoundError(f"Data not found: {data_path}. Run: python -m durian_dashboard")

    data = json.loads(data_path.read_text(encoding="utf-8"))
    summary_all, summary_east, summary_south = _summary_rows(data)

    combined_daily_parts = []
    east_daily_parts = []
    south_daily_parts = []

    for db_year, year in sorted(data.get("years", {}).items(), key=lambda x: int(x[0])):
        if year.get("combined_daily"):
            combined_daily_parts.append(_flatten_combined_daily(year["combined_daily"]))
        east_rows = year["regions"]["east"].get("daily_table", [])
        south_rows = year["regions"]["south"].get("daily_table", [])
        if east_rows:
            east_daily_parts.append(_flatten_region_daily(east_rows, "ภาคตะวันออก"))
        if south_rows:
            south_daily_parts.append(_flatten_region_daily(south_rows, "ภาคใต้"))

    combined_daily = pd.concat(combined_daily_parts, ignore_index=True) if combined_daily_parts else pd.DataFrame()
    east_daily = pd.concat(east_daily_parts, ignore_index=True) if east_daily_parts else pd.DataFrame()
    south_daily = pd.concat(south_daily_parts, ignore_index=True) if south_daily_parts else pd.DataFrame()
    weekly = _weekly_combined(combined_daily)

    meta = pd.DataFrame(
        [
            {"รายการ": "แหล่งข้อมูล", "ค่า": data.get("source", "")},
            {"รายการ": "ดึงข้อมูลเมื่อ", "ค่า": data.get("scraped_at", "")},
            {"รายการ": "พันธุ์ที่มี", "ค่า": ", ".join(VARIETIES)},
            {"รายการ": "หมายเหตุราคารวม", "ค่า": "ค่าเฉลี่ยถ่วงน้ำหนักตามปริมาณรายวัน (ภาคตะวันออก+ใต้)"},
            {"รายการ": "ส่งออกเมื่อ", "ค่า": pd.Timestamp.now().isoformat(timespec="seconds")},
        ]
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with pd.ExcelWriter(output_path, engine="openpyxl") as writer:
        meta.to_excel(writer, sheet_name="ข้อมูลทั่วไป", index=False)
        summary_all.to_excel(writer, sheet_name="สรุปรายปี_รวม", index=False)
        summary_east.to_excel(writer, sheet_name="สรุปรายปี_ตะวันออก", index=False)
        summary_south.to_excel(writer, sheet_name="สรุปรายปี_ใต้", index=False)
        combined_daily.to_excel(writer, sheet_name="รายวัน_รวมทั้งประเทศ", index=False)
        east_daily.to_excel(writer, sheet_name="รายวัน_ภาคตะวันออก", index=False)
        south_daily.to_excel(writer, sheet_name="รายวัน_ภาคใต้", index=False)
        weekly.to_excel(writer, sheet_name="รายสัปดาห์_รวม", index=False)

        for sheet in writer.sheets.values():
            for col in sheet.columns:
                max_len = 0
                col_letter = col[0].column_letter
                for cell in col:
                    if cell.value is not None:
                        max_len = max(max_len, len(str(cell.value)))
                sheet.column_dimensions[col_letter].width = min(max_len + 2, 40)

    return output_path


if __name__ == "__main__":
    out = export_excel()
    print(f"Exported: {out}")
