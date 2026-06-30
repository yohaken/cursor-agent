#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.local/bin:$PATH"

if [[ ! -f data/durian-dashboard.json ]]; then
  echo "Downloading durian data..."
  python3 -m durian_dashboard
fi

exec streamlit run durian_dashboard/app.py \
  --server.port "${PORT:-8501}" \
  --server.address 0.0.0.0 \
  --server.headless true \
  --browser.gatherUsageStats false
