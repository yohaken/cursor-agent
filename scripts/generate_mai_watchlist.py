#!/usr/bin/env python3
"""Generate TradingView import files for MAI (Market for Alternative Investment) stocks.

Data is sourced from the official SET listed companies Excel file:
https://www.set.or.th/dat/eod/listedcompany/static/listedCompanies_en_US.xls

The JSON mirror (updated daily) is used because SET's website blocks direct downloads.
"""

from __future__ import annotations

import csv
import json
from datetime import datetime, timezone
from pathlib import Path

import httpx

SET_SOURCE = "https://www.set.or.th/dat/eod/listedcompany/static/listedCompanies_en_US.xls"
MAI_EN_URL = "https://raw.githubusercontent.com/lumduan/thai-securities-data/main/thai_securities_market_mai_en.json"
MAI_TH_URL = "https://raw.githubusercontent.com/lumduan/thai-securities-data/main/thai_securities_market_mai_th.json"
META_URL = "https://raw.githubusercontent.com/lumduan/thai-securities-data/main/metadata_en.json"
OUTPUT_DIR = Path(__file__).resolve().parent.parent / "data"


def fetch_json(client: httpx.Client, url: str) -> list | dict:
    response = client.get(url)
    response.raise_for_status()
    return response.json()


def generate(output_dir: Path = OUTPUT_DIR) -> int:
    output_dir.mkdir(parents=True, exist_ok=True)

    with httpx.Client(timeout=30) as client:
        mai_en = sorted(fetch_json(client, MAI_EN_URL), key=lambda x: x["symbol"])
        mai_th = fetch_json(client, MAI_TH_URL)
        meta = fetch_json(client, META_URL)

    mai_th_map = {s["symbol"]: s for s in mai_th}
    tv_symbols = [f"SET:{s['symbol']}" for s in mai_en]

    (output_dir / "mai-tradingview-import.txt").write_text(
        ",".join(tv_symbols), encoding="utf-8"
    )

    with (output_dir / "mai-tradingview-import.csv").open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.writer(f)
        writer.writerow(["Symbol", "Description"])
        for s in mai_en:
            writer.writerow([f"SET:{s['symbol']}", s.get("name", "")])

    with (output_dir / "mai-stocks-en.csv").open("w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["tradingview_symbol", "symbol", "name_en", "name_th", "market", "industry", "sector"],
        )
        writer.writeheader()
        for s in mai_en:
            th = mai_th_map.get(s["symbol"], {})
            writer.writerow(
                {
                    "tradingview_symbol": f"SET:{s['symbol']}",
                    "symbol": s["symbol"],
                    "name_en": s.get("name", ""),
                    "name_th": th.get("name", ""),
                    "market": s.get("market", "mai"),
                    "industry": s.get("industry", ""),
                    "sector": s.get("sector", ""),
                }
            )

    (output_dir / "mai-stocks-metadata.json").write_text(
        json.dumps(
            {
                "market": "mai",
                "market_name": "Market for Alternative Investment (mai)",
                "total_stocks": len(mai_en),
                "last_updated": meta["last_updated"],
                "data_source": SET_SOURCE,
                "tradingview_exchange_prefix": "SET",
                "generated_at": datetime.now(timezone.utc).isoformat(),
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    return len(mai_en)


if __name__ == "__main__":
    count = generate()
    print(f"Generated {count} MAI stocks in {OUTPUT_DIR}")
