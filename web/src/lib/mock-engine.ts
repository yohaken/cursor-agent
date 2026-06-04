import type { IndexQuote, MarketCode, StockQuote } from "./types";

type MockState = {
  stocks: Map<string, StockQuote>;
  indices: Map<string, IndexQuote>;
};

const SEED_STOCKS: Array<{
  symbol: string;
  name: string;
  market: MarketCode;
  base: number;
  marketCap: number;
}> = [
  { symbol: "PTT", name: "ปตท.", market: "SET", base: 34.5, marketCap: 980_000_000_000 },
  { symbol: "AOT", name: "ท่าอากาศยานไทย", market: "SET", base: 68.25, marketCap: 970_000_000_000 },
  { symbol: "CPALL", name: "ซีพี ออลล์", market: "SET", base: 58.0, marketCap: 520_000_000_000 },
  { symbol: "ADVANC", name: "แอดวานซ์", market: "SET", base: 298.0, marketCap: 890_000_000_000 },
  { symbol: "KBANK", name: "กสิกรไทย", market: "SET", base: 142.5, marketCap: 850_000_000_000 },
  { symbol: "DELTA", name: "เดลต้า", market: "SET", base: 62.0, marketCap: 720_000_000_000 },
  { symbol: "SCB", name: "ไทยพาณิชย์", market: "SET", base: 112.0, marketCap: 680_000_000_000 },
  { symbol: "GULF", name: "กัลฟ์ เอ็นเนอร์จี", market: "SET", base: 48.5, marketCap: 650_000_000_000 },
  { symbol: "BDMS", name: "กรุงเทพดุสิต", market: "SET", base: 26.5, marketCap: 610_000_000_000 },
  { symbol: "CP", name: "เจริญโภคภัณฑ์", market: "SET", base: 28.0, marketCap: 580_000_000_000 },
  { symbol: "BBL", name: "กรุงเทพ", market: "SET", base: 138.0, marketCap: 560_000_000_000 },
  { symbol: "TRUE", name: "ทรู คอร์ปอเรชั่น", market: "SET", base: 8.2, marketCap: 540_000_000_000 },
  { symbol: "SCC", name: "ปูนซิเมนต์ไทย", market: "SET", base: 412.0, marketCap: 510_000_000_000 },
  { symbol: "MINT", name: "ไมเนอร์", market: "SET", base: 28.75, marketCap: 480_000_000_000 },
  { symbol: "INTUCH", name: "อินทัช", market: "SET", base: 52.0, marketCap: 450_000_000_000 },
  { symbol: "CRC", name: "เซ็นทรัล รีเทล", market: "SET", base: 18.5, marketCap: 420_000_000_000 },
  { symbol: "HMPRO", name: "โฮม โปร", market: "SET", base: 12.8, marketCap: 390_000_000_000 },
  { symbol: "IVL", name: "อินโดรามา", market: "SET", base: 24.2, marketCap: 360_000_000_000 },
  { symbol: "BANPU", name: "บ้านปู", market: "SET", base: 7.85, marketCap: 330_000_000_000 },
  { symbol: "PTTEP", name: "ปตท.สผ.", market: "SET", base: 142.0, marketCap: 310_000_000_000 },
  { symbol: "TU", name: "ไทยยูเนี่ยน", market: "SET", base: 15.2, marketCap: 280_000_000_000 },
  { symbol: "OR", name: "ปตท.น้ำมัน", market: "SET", base: 16.4, marketCap: 250_000_000_000 },
  { symbol: "HUMAN", name: "ฮิวแมนิก้า", market: "mai", base: 12.4, marketCap: 18_500_000_000 },
  { symbol: "PROEN", name: "พราวน์ เอ็นจิเนียริ่ง", market: "mai", base: 8.75, marketCap: 16_200_000_000 },
  { symbol: "ITEL", name: "อินเตอร์ เน็ต", market: "mai", base: 4.2, marketCap: 14_800_000_000 },
  { symbol: "JASIF", name: "จัสมิน อิฟ", market: "mai", base: 6.85, marketCap: 13_500_000_000 },
  { symbol: "ASAP", name: "เอเซี่ยน ไฟเบอร์", market: "mai", base: 3.8, marketCap: 12_400_000_000 },
  { symbol: "SISB", name: "เอสไอเอสบี", market: "mai", base: 22.5, marketCap: 11_900_000_000 },
  { symbol: "DITTO", name: "ดิทโต้", market: "mai", base: 5.6, marketCap: 11_200_000_000 },
  { symbol: "AJA", name: "เอเจ เอ็กซ์ปอร์ต", market: "mai", base: 2.9, marketCap: 10_500_000_000 },
  { symbol: "WINNER", name: "วินเนอร์ กรุ๊ป", market: "mai", base: 7.2, marketCap: 9_800_000_000 },
  { symbol: "SPCG", name: "เอสพีซีจี", market: "mai", base: 4.5, marketCap: 9_200_000_000 },
  { symbol: "TACC", name: "ทีเอซี คอนซัลตันต์", market: "mai", base: 6.1, marketCap: 8_700_000_000 },
  { symbol: "BCH", name: "กรุงเทพ แชนเนล", market: "mai", base: 11.3, marketCap: 8_200_000_000 },
  { symbol: "FANCY", name: "แฟนซี รีสอร์ท", market: "mai", base: 1.85, marketCap: 7_600_000_000 },
  { symbol: "SMT", name: "ซัมมิท โมบิล", market: "mai", base: 3.2, marketCap: 7_100_000_000 },
  { symbol: "LPN", name: "แอล.พี.เอ็น.", market: "mai", base: 1.42, marketCap: 6_800_000_000 },
  { symbol: "AJ", name: "เอแอนด์เจ", market: "mai", base: 8.9, marketCap: 6_400_000_000 },
  { symbol: "TQR", name: "ทีคิวอาร์", market: "mai", base: 2.1, marketCap: 5_900_000_000 },
  { symbol: "CMAN", name: "ซีแมน", market: "mai", base: 4.8, marketCap: 5_500_000_000 },
  { symbol: "TIGER", name: "ไทเกอร์ โมบิลิตี้", market: "mai", base: 3.6, marketCap: 5_100_000_000 },
  { symbol: "BROOK", name: "บรูค อิเล็ค", market: "mai", base: 9.4, marketCap: 4_800_000_000 },
  { symbol: "NEX", name: "เน็กซ์ โพ인ต์", market: "mai", base: 1.95, marketCap: 4_400_000_000 },
  { symbol: "KCM", name: "เคซีเอ็ม", market: "mai", base: 2.4, marketCap: 4_000_000_000 },
  { symbol: "XO", name: "เอ็กซ์โอ", market: "mai", base: 1.55, marketCap: 3_600_000_000 },
];

const SEED_INDICES = [
  { symbol: "SET", name: "ดัชนี SET", market: "SET" as MarketCode, base: 1425.32 },
  { symbol: "SET50", name: "ดัชนี SET50", market: "SET" as MarketCode, base: 1024.18 },
  { symbol: "mai", name: "ดัชนี mai", market: "mai" as MarketCode, base: 412.55 },
];

function getState(): MockState {
  const g = globalThis as typeof globalThis & { __setPulseMock?: MockState };
  if (!g.__setPulseMock) {
    const now = new Date().toISOString();
    const stocks = new Map<string, StockQuote>();
    for (const s of SEED_STOCKS) {
      stocks.set(s.symbol, {
        symbol: s.symbol,
        name: s.name,
        market: s.market,
        last: s.base,
        change: 0,
        changePercent: 0,
        volume: 1_200_000,
        value: s.base * 1_200_000,
        marketCap: s.marketCap,
        bid: s.base - 0.02,
        offer: s.base + 0.02,
        high: s.base + 0.5,
        low: s.base - 0.5,
        prior: s.base,
        asOf: now,
      });
    }
    const indices = new Map<string, IndexQuote>();
    for (const i of SEED_INDICES) {
      indices.set(i.symbol, {
        symbol: i.symbol,
        name: i.name,
        market: i.market,
        last: i.base,
        change: 0,
        changePercent: 0,
        asOf: now,
      });
    }
    g.__setPulseMock = { stocks, indices };
  }
  return g.__setPulseMock;
}

function tickPrice(price: number): number {
  const delta = (Math.random() - 0.5) * 0.08;
  return Math.max(0.01, Math.round((price + delta) * 100) / 100);
}

export function advanceMockMarket(): void {
  const state = getState();
  const now = new Date().toISOString();

  for (const quote of state.stocks.values()) {
    const prior = quote.last ?? quote.prior ?? 1;
    const last = tickPrice(prior);
    const change = Math.round((last - prior) * 100) / 100;
    const changePercent = prior ? Math.round((change / prior) * 10000) / 100 : 0;
    const volumeDelta = Math.floor(Math.random() * 80_000);
    quote.last = last;
    quote.change = change;
    quote.changePercent = changePercent;
    quote.volume += volumeDelta;
    quote.value += volumeDelta * last;
    quote.marketCap = Math.round(quote.marketCap * (1 + (Math.random() - 0.5) * 0.0002));
    quote.bid = Math.round((last - 0.02) * 100) / 100;
    quote.offer = Math.round((last + 0.02) * 100) / 100;
    quote.high = Math.max(quote.high ?? last, last);
    quote.low = Math.min(quote.low ?? last, last);
    quote.asOf = now;
  }

  for (const idx of state.indices.values()) {
    const prior = idx.last ?? 1;
    const last = Math.round(tickPrice(prior) * 100) / 100;
    const change = Math.round((last - prior) * 100) / 100;
    idx.last = last;
    idx.change = change;
    idx.changePercent = prior ? Math.round((change / prior) * 10000) / 100 : 0;
    idx.asOf = now;
  }
}

export function getMockStocks(symbols?: string[], market?: string): StockQuote[] {
  advanceMockMarket();
  const state = getState();
  let list = [...state.stocks.values()];
  if (market) {
    const markets = market.split(",").map((m) => m.trim().toLowerCase());
    list = list.filter((q) => markets.includes(q.market.toLowerCase()));
  }
  if (symbols?.length) {
    const set = new Set(symbols.map((s) => s.toUpperCase()));
    list = list.filter((q) => set.has(q.symbol));
  }
  return list.sort((a, b) => a.symbol.localeCompare(b.symbol));
}

export function getMockIndices(): IndexQuote[] {
  advanceMockMarket();
  return [...getState().indices.values()];
}
