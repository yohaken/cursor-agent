#!/usr/bin/env python3
"""Monitor AiO stock news and send new headlines to Telegram.

Data source: https://aio.panphol.com/news/data
Scope matches the /news landing view: today's news when available, otherwise
the newest first-page items (same fallback as the website).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

import httpx

NEWS_API = "https://aio.panphol.com/news/data"
SEEN_FILE = Path(__file__).resolve().parent.parent / "data" / "aio-news-seen.json"
FIRST_PAGE_SIZE = 30
SOURCE_LABELS = {
    "mitihoon": "Mitihoon",
    "kaohoon": "Kaohoon",
    "hoonsmart": "HoonSmart",
    "settrade": "SETTRADE",
    "set": "SET",
}


def fetch_all_news(client: httpx.Client) -> list[dict]:
    response = client.get(NEWS_API)
    response.raise_for_status()
    payload = response.json()
    if not payload.get("ok"):
        raise RuntimeError("AiO news API returned ok=false")
    return payload["data"]


def get_monitored_news(all_news: list[dict]) -> tuple[list[dict], str]:
    today_news = [item for item in all_news if item.get("days_ago") == 0]
    if today_news:
        return today_news, "today"
    return all_news[:FIRST_PAGE_SIZE], "first_page"


def load_state() -> dict:
    if not SEEN_FILE.exists():
        return {"seen_ids": [], "bootstrapped_at": None, "last_check_at": None}
    return json.loads(SEEN_FILE.read_text(encoding="utf-8"))


def save_state(state: dict) -> None:
    SEEN_FILE.parent.mkdir(parents=True, exist_ok=True)
    SEEN_FILE.write_text(json.dumps(state, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def format_news_message(item: dict) -> str:
    stock = item.get("stock") or ""
    stock_part = f"[{stock}] " if stock else ""
    source = SOURCE_LABELS.get(item.get("source", ""), item.get("source", ""))
    headline = item.get("headline", "").strip()
    when = f"{item.get('full_date', '')} {item.get('time', '')}".strip()
    link = item.get("link", "")
    return (
        f"📰 {stock_part}{headline}\n"
        f"🕐 {when} · {source}\n"
        f"🔗 {link}"
    )


def send_telegram(client: httpx.Client, text: str) -> None:
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    chat_id = os.environ.get("TELEGRAM_CHAT_ID")
    if not token or not chat_id:
        raise RuntimeError("TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required")

    response = client.post(
        f"https://api.telegram.org/bot{token}/sendMessage",
        json={"chat_id": chat_id, "text": text, "disable_web_page_preview": True},
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get("ok"):
        raise RuntimeError(f"Telegram API error: {payload}")


def run(*, bootstrap: bool = False, restart: bool = False, dry_run: bool = False) -> int:
    now = datetime.now(timezone.utc).isoformat()

    with httpx.Client(timeout=30, headers={"User-Agent": "cursor-agent-aio-news-monitor/1.0"}) as client:
        all_news = fetch_all_news(client)
        monitored_news, scope = get_monitored_news(all_news)
        state = load_state()
        seen = set(state.get("seen_ids", []))
        new_items = [item for item in monitored_news if str(item["id"]) not in seen]
        scope_label = "ข่าววันนี้" if scope == "today" else f"หน้าแรก ({FIRST_PAGE_SIZE} รายการล่าสุด)"

        if bootstrap or restart or not state.get("bootstrapped_at"):
            for item in monitored_news:
                seen.add(str(item["id"]))
            state["seen_ids"] = sorted(seen, key=int, reverse=True)
            state["bootstrapped_at"] = state.get("bootstrapped_at") or now
            state["last_check_at"] = now
            state["scope"] = scope
            if not dry_run:
                save_state(state)
                if restart:
                    message = (
                        "🔄 เริ่มทำงานอีกครั้ง\n"
                        f"📋 บันทึก{scope_label} {len(monitored_news)} รายการเป็นฐานข้อมูล\n"
                        "⏰ จะเช็กข่าวใหม่ทุก 1 ชั่วโมง (ไม่ส่งซ้ำ)"
                    )
                else:
                    message = (
                        "✅ เริ่มติดตามข่าว AiO แล้ว\n"
                        f"📋 บันทึก{scope_label} {len(monitored_news)} รายการเป็นฐานข้อมูล (ไม่ส่งซ้ำ)\n"
                        "⏰ จะเช็กข่าวใหม่ทุก 1 ชั่วโมง"
                    )
                send_telegram(client, message)
            action = "Restarted" if restart else "Bootstrapped"
            print(f"{action} {len(monitored_news)} items ({scope_label})")
            return 0

        sent = 0
        for item in reversed(new_items):
            message = format_news_message(item)
            if dry_run:
                print(message)
                print("---")
            else:
                send_telegram(client, message)
            seen.add(str(item["id"]))
            sent += 1

        state["seen_ids"] = sorted(seen, key=int, reverse=True)
        state["last_check_at"] = now
        state["scope"] = scope
        if not dry_run:
            save_state(state)

        print(f"Checked {len(monitored_news)} items ({scope_label}), sent {sent} new notifications")
        return sent


def main() -> None:
    parser = argparse.ArgumentParser(description="Monitor AiO news and notify Telegram")
    parser.add_argument(
        "--bootstrap",
        action="store_true",
        help="Seed current monitored news as already seen and send a startup message",
    )
    parser.add_argument(
        "--restart",
        action="store_true",
        help="Re-seed current monitored news and send a resume message",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print actions without writing state or sending Telegram messages",
    )
    args = parser.parse_args()

    try:
        run(bootstrap=args.bootstrap, restart=args.restart, dry_run=args.dry_run)
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
