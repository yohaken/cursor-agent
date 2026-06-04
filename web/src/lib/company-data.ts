import type { CompanyProfile, MarketCode } from "./types";
import { getMockStocks } from "./mock-engine";

type CompanyRecord = CompanyProfile & {
  mdaText: string;
};

const COMPANIES: CompanyRecord[] = [
  {
    symbol: "PTT",
    name: "ปตท.",
    market: "SET",
    sector: "พลังงาน",
    businessDescription:
      "ผู้นำธุรกิจพลังงานแบบครบวงจรของประเทศไทย ครอบคลุมการสำรวจและผลิตปิโตรเลียม ก๊าซธรรมชาติ กลั่น ปิโตรเคมี การค้าปลีกน้ำมัน และพลังงานใหม่",
    website: "https://www.pttplc.com",
    latestQuarter: "Q1/2568",
    mdaText:
      "ฝ่ายจัดการระบุว่ารายได้รวมเติบโตจากราคาเฉลี่ยผลิตภัณฑ์ปิโตรเลียมและปริมาณการขายในตลาดโลกที่ฟื้นตัว กลุ่มปิโตรเคมีมีมาร์จิ้นดีขึ้นจากสเปรด ธุรกิจก๊าซธรรมชาติมีความต้องการในประเทศสูง บริษัทเน้นลงทุนพลังงานสะอาดและลดคาร์บอนตามแผน ESG ความเสี่ยงหลักคือความผันผวนของราคาน้ำมันโลกและอัตราแลกเปลี่ยน",
  },
  {
    symbol: "KBANK",
    name: "กสิกรไทย",
    market: "SET",
    sector: "ธนาคาร",
    businessDescription:
      "ธนาคารพาณิชย์ขนาดใหญ่ ให้บริการสินเชื่อ เงินฝาก บริการลูกค้าบุคคลและธุรกิจ รวมถึงดิจิทัลแบงก์กิ้ง",
    latestQuarter: "Q1/2568",
    mdaText:
      "กำไรสุทธิเติบโตจากดอกรับที่เพิ่มขึ้นและต้นทุนเงินกู้ที่ควบคุมได้ สินเชื่อขยายตัวในภาคธุรกิจและสินเชื่อบุคคล คุณภาพสินทรัพย์อยู่ในเกณฑ์ดี NPL ต่ำกว่าเกณฑ์กำกับ ธนาคารเร่งลงทุนเทคโนโลยีและความปลอดภัยไซเบอร์ ความเสี่ยงคือภาวะเศรษฐกิจชะลอตัวและผลกระทบจากหนี้เสีย",
  },
  {
    symbol: "HUMAN",
    name: "ฮิวแมนิก้า",
    market: "mai",
    sector: "บริการสุขภาพ",
    businessDescription:
      "ผู้ให้บริการด้านทรัพยากรบุคคลและสุขภาพองค์กร รวมถึงการจัดหางานและโซลูชันสวัสดิการพนักงาน",
    latestQuarter: "Q1/2568",
    mdaText:
      "รายได้เติบโตจากลูกค้าองค์กรรายใหม่และการขยายบริการสุขภาพ ต้นทุนดำเนินงานเพิ่ตามการลงทุนแพลตฟอร์มดิจิทัล บริษัทมุ่งขยายตลาดต่างจังหวัดและพันธมิตรโรงพยาบาล ความเสี่ยงคือการแข่งขันด้านราคาและการหมุนเวียนพนักงาน",
  },
];

const GENERIC_MDA =
  "ฝ่ายจัดการสรุปว่าผลประกอบการไตรมาสนี้สะท้อนแนวโน้มอุตสาหกรรมและความต้องการในประเทศ รายได้หลักมาจากธุรกิจหลักของบริษัท ต้นทุนวัตถุดิบและค่าใช้จ่ายดำเนินงานอยู่ภายใต้การควบคุม บริษัทยังคงลงทุนเพื่อเพิ่มประสิทธิภาพและความสามารถในการแข่งขัน ปัจจัยเสี่ยงได้แก่ความผันผวนของเศรษฐกิจ อัตราแลกเปลี่ยน และกฎระเบียบที่เกี่ยวข้อง";

function inferSector(market: MarketCode): string {
  return market === "mai" ? "หุ้นน่าลงทุน (mai)" : "หุ้น SET";
}

export function getCompanyProfile(symbol: string): CompanyProfile | null {
  const sym = symbol.toUpperCase();
  const mock = getMockStocks([sym]).find((q) => q.symbol === sym);
  if (!mock) return null;

  const found = COMPANIES.find((c) => c.symbol === sym);
  if (found) {
    const { mdaText: _, ...profile } = found;
    return { ...profile, name: mock.name, market: mock.market };
  }

  return {
    symbol: sym,
    name: mock.name,
    market: mock.market,
    sector: inferSector(mock.market),
    businessDescription: `บริษัท ${mock.name} จดทะเบียนในตลาด${mock.market} ดำเนินธุรกิจตามอุตสาหกรรมที่เกี่ยวข้องกับหลักทรัพย์ ${sym} โดยมุ่งสร้างรายได้จากการดำเนินงานหลักและบริหารต้นทุนอย่างมีประสิทธิภาพ`,
    latestQuarter: "Q1/2568",
  };
}

export function getCompanyMdaText(symbol: string, name: string, market: MarketCode): string {
  const sym = symbol.toUpperCase();
  const found = COMPANIES.find((c) => c.symbol === sym);
  if (found) return found.mdaText;
  return `${GENERIC_MDA} (หลักทรัพย์ ${sym} — ${name}, ตลาด ${market})`;
}
