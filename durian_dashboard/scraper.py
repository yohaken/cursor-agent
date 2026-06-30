"""Scrape durian dashboard data from simplefruit.doae.go.th for both regions."""

from __future__ import annotations

import json
import re
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://simplefruit.doae.go.th/dashboard/index"
REGIONS = {
    4: {"name": "east", "label": "ภาคตะวันออก"},
    8: {"name": "south", "label": "ภาคใต้"},
}
YEARS = list(range(2020, 2027))  # db_year 2020-2026 => พ.ศ. 2563-2569
VARIETIES = ["หมอนทอง", "ชะนี", "ก้านยาว", "พวงมณี", "กระดุม", "สาริกา", "อื่นๆ"]
GRADE_LABELS = {4: ("A", "ตกไซส์"), 8: ("A", "B")}


@dataclass
class DailyRecord:
    region_id: int
    region: str
    be_year: int
    db_year: int
    season_week: int | None
    date_th: str
    date_iso: str | None
    volume_tons: float
    prices: dict[str, dict[str, float | None]]
    grade_pct: dict[str, float | None]


@dataclass
class YearSummary:
    db_year: int
    be_year: int
    estimate_tons: float
    harvested_tons: float
    harvest_pct: float
    season_value_baht: float | None


def _parse_number(text: str) -> float | None:
    text = text.strip().replace(",", "")
    if not text or text == "-":
        return None
    try:
        return float(text)
    except ValueError:
        return None


def _thai_date_to_iso(date_th: str) -> str | None:
    months = {
        "ม.ค.": 1,
        "ก.พ.": 2,
        "มี.ค.": 3,
        "เม.ย.": 4,
        "พ.ค.": 5,
        "มิ.ย.": 6,
        "ก.ค.": 7,
        "ส.ค.": 8,
        "ก.ย.": 9,
        "ต.ค.": 10,
        "พ.ย.": 11,
        "ธ.ค.": 12,
    }
    m = re.match(r"(\d+)\s+(\S+)\s+(\d+)", date_th.strip())
    if not m:
        return None
    day = int(m.group(1))
    mon = months.get(m.group(2))
    if not mon:
        return None
    be = int(m.group(3))
    ce = be - 543
    try:
        return datetime(ce, mon, day).date().isoformat()
    except ValueError:
        return None


def _extract_cards(soup: BeautifulSoup) -> dict[str, float]:
    labels = {
        "ประมาณการผลผลิต": "estimate_tons",
        "เก็บเกี่ยวไปแล้ว": "harvested_tons",
        "ร้อยละ": "harvest_pct",
    }
    out: dict[str, float] = {}
    for card in soup.select(".card"):
        text = card.get_text(" ", strip=True)
        for th_label, key in labels.items():
            if th_label in text:
                m = re.search(r"([\d,]+\.?\d*)", text.replace(th_label, ""))
                if m:
                    out[key] = float(m.group(1).replace(",", ""))
    value_card = soup.find("div", class_="bg-info")
    if value_card:
        m = re.search(r"([\d,]+)", value_card.get_text())
        if m:
            out["season_value_baht"] = float(m.group(1).replace(",", ""))
    return out


def _extract_chart_series(html: str, chart_id: str = "w1") -> list[dict[str, Any]]:
    pattern = rf"new Highcharts\.chart\('{chart_id}',\s*(\{{.*?\}})\);\s*(?:Highcharts|$)"
    m = re.search(pattern, html, re.S)
    if not m:
        return []
    try:
        payload = json.loads(m.group(1))
        return payload.get("series", [{}])[0].get("data", [])
    except json.JSONDecodeError:
        return []


def _chart_to_daily(chart_data: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for pt in chart_data:
        ts = pt.get("x")
        if ts is None:
            continue
        dt = datetime.fromtimestamp(ts / 1000, tz=timezone.utc).date().isoformat()
        rows.append({"date_iso": dt, "volume_tons": float(pt.get("y", 0))})
    return rows


def _parse_daily_table(soup: BeautifulSoup, region_id: int, db_year: int) -> list[DailyRecord]:
    be_year = db_year + 543
    grade_a, grade_b = GRADE_LABELS[region_id]
    region = REGIONS[region_id]["name"]
    table = soup.find("table", class_="table-bordered-dark")
    if not table:
        return []

    tbody = table.find("tbody")
    if not tbody:
        return []

    records: list[DailyRecord] = []
    current_week: int | None = None

    for tr in tbody.find_all("tr", recursive=False):
        classes = tr.get("class", [])
        if any("row-peak" in c for c in classes):
            continue
        if tr.find("div", class_="chart-box"):
            continue

        tds = tr.find_all("td", recursive=False)
        if len(tds) < 5:
            continue

        texts = []
        for td in tds:
            span = td.find("span", title=True)
            texts.append((span.get_text(strip=True) if span else td.get_text(strip=True)).strip())

        idx = 0
        if texts[0].isdigit():
            current_week = int(texts[0])
            idx = 1

        if idx >= len(texts):
            continue
        date_th = texts[idx]
        if not re.search(r"\d+\s+\S+\s+\d+", date_th):
            continue

        volume = _parse_number(texts[idx + 1])
        if volume is None:
            continue

        price_texts = texts[idx + 2 : idx + 16]
        prices: dict[str, dict[str, float | None]] = {}
        for v_idx, variety in enumerate(VARIETIES):
            a = _parse_number(price_texts[v_idx * 2]) if v_idx * 2 < len(price_texts) else None
            b = _parse_number(price_texts[v_idx * 2 + 1]) if v_idx * 2 + 1 < len(price_texts) else None
            prices[variety] = {grade_a: a, grade_b: b}

        grade_texts = texts[idx + 16 : idx + 18]
        grade_pct = {
            grade_a: _parse_number(grade_texts[0]) if len(grade_texts) > 0 else None,
            grade_b: _parse_number(grade_texts[1]) if len(grade_texts) > 1 else None,
        }

        records.append(
            DailyRecord(
                region_id=region_id,
                region=region,
                be_year=be_year,
                db_year=db_year,
                season_week=current_week,
                date_th=date_th,
                date_iso=_thai_date_to_iso(date_th),
                volume_tons=volume,
                prices=prices,
                grade_pct=grade_pct,
            )
        )

    return records


def fetch_region_year(client: httpx.Client, region_id: int, db_year: int) -> dict[str, Any]:
    params = {
        "ReportSummary[db_year]": str(db_year),
        "ReportSummary[ob_plant_id]": str(region_id),
        "ReportSummary[code_province_id]": "",
        "mode": "web",
    }
    resp = client.get(BASE_URL, params=params, timeout=60)
    resp.raise_for_status()
    html = resp.text
    soup = BeautifulSoup(html, "html.parser")

    cards = _extract_cards(soup)
    daily_table = _parse_daily_table(soup, region_id, db_year)
    chart_daily = _chart_to_daily(_extract_chart_series(html, "w1"))

    return {
        "region_id": region_id,
        "region": REGIONS[region_id]["name"],
        "region_label": REGIONS[region_id]["label"],
        "db_year": db_year,
        "be_year": db_year + 543,
        "summary": {
            "estimate_tons": cards.get("estimate_tons"),
            "harvested_tons": cards.get("harvested_tons"),
            "harvest_pct": cards.get("harvest_pct"),
            "season_value_baht": cards.get("season_value_baht"),
        },
        "daily_table": [asdict(r) for r in daily_table],
        "chart_daily": chart_daily,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }


def combine_daily(east_rows: list[dict], south_rows: list[dict], db_year: int) -> list[dict[str, Any]]:
    """Merge both regions by date with volume-weighted average prices."""
    by_date: dict[str, dict[str, Any]] = {}

    def ingest(rows: list[dict], region: str) -> None:
        for row in rows:
            date_iso = row.get("date_iso")
            if not date_iso:
                continue
            entry = by_date.setdefault(
                date_iso,
                {
                    "date_iso": date_iso,
                    "date_th": row.get("date_th"),
                    "db_year": db_year,
                    "be_year": db_year + 543,
                    "east_volume": 0.0,
                    "south_volume": 0.0,
                    "east_prices": {},
                    "south_prices": {},
                    "season_week": row.get("season_week"),
                },
            )
            vol = float(row.get("volume_tons") or 0)
            entry[f"{region}_volume"] = entry.get(f"{region}_volume", 0) + vol
            entry[f"{region}_prices"] = row.get("prices", {})
            if row.get("season_week"):
                entry["season_week"] = row["season_week"]

    ingest(east_rows, "east")
    ingest(south_rows, "south")

    combined = []
    for date_iso in sorted(by_date):
        e = by_date[date_iso]
        total_vol = e["east_volume"] + e["south_volume"]
        prices_combined: dict[str, dict[str, float | None]] = {}
        for variety in VARIETIES:
            prices_combined[variety] = {}
            for grade in ("A", "ตกไซส์", "B"):
                num = 0.0
                den = 0.0
                for region, vol_key, price_key in (
                    ("east", "east_volume", "east_prices"),
                    ("south", "south_volume", "south_prices"),
                ):
                    vol = e[vol_key]
                    if vol <= 0:
                        continue
                    p = e[price_key].get(variety, {}).get(grade)
                    if p is not None:
                        num += vol * p
                        den += vol
                prices_combined[variety][grade] = round(num / den, 2) if den > 0 else None

        combined.append(
            {
                **e,
                "total_volume": round(total_vol, 2),
                "prices": prices_combined,
            }
        )

    # Season alignment: day index from first day with total_volume > 0
    season_start = next((i for i, r in enumerate(combined) if r["total_volume"] > 0), 0)
    for i, row in enumerate(combined):
        row["season_day"] = i - season_start + 1
        row["season_week_aligned"] = (row["season_day"] - 1) // 7 + 1

    return combined


def scrape_all(years: list[int] | None = None, delay: float = 0.4) -> dict[str, Any]:
    years = years or YEARS
    client = httpx.Client(
        headers={"User-Agent": "Mozilla/5.0 (compatible; DurianDashboard/1.0)"},
        follow_redirects=True,
    )
    dataset: dict[str, Any] = {
        "source": BASE_URL,
        "varieties": VARIETIES,
        "regions": REGIONS,
        "years": {},
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }

    try:
        for db_year in years:
            year_data: dict[str, Any] = {"db_year": db_year, "be_year": db_year + 543, "regions": {}}
            for region_id in REGIONS:
                print(f"Fetching {REGIONS[region_id]['label']} BE {db_year + 543}...")
                year_data["regions"][REGIONS[region_id]["name"]] = fetch_region_year(
                    client, region_id, db_year
                )
                time.sleep(delay)

            east_daily = year_data["regions"]["east"]["daily_table"]
            south_daily = year_data["regions"]["south"]["daily_table"]
            year_data["combined_daily"] = combine_daily(east_daily, south_daily, db_year)
            year_data["combined_summary"] = {
                "estimate_tons": sum(
                    (year_data["regions"][r]["summary"].get("estimate_tons") or 0) for r in ("east", "south")
                ),
                "harvested_tons": sum(
                    (year_data["regions"][r]["summary"].get("harvested_tons") or 0) for r in ("east", "south")
                ),
                "season_value_baht": sum(
                    (year_data["regions"][r]["summary"].get("season_value_baht") or 0) for r in ("east", "south")
                ),
            }
            est = year_data["combined_summary"]["estimate_tons"]
            har = year_data["combined_summary"]["harvested_tons"]
            year_data["combined_summary"]["harvest_pct"] = round(har / est * 100, 2) if est else None
            dataset["years"][str(db_year)] = year_data
    finally:
        client.close()

    return dataset


def save_dataset(data: dict[str, Any], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "data" / "durian-dashboard.json"
    data = scrape_all()
    save_dataset(data, out)
    print(f"Saved {len(data['years'])} years to {out}")
