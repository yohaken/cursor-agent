from durian_dashboard.scraper import scrape_all, save_dataset
from pathlib import Path

if __name__ == "__main__":
    out = Path(__file__).resolve().parent.parent / "data" / "durian-dashboard.json"
    data = scrape_all()
    save_dataset(data, out)
    print(f"Saved to {out}")
