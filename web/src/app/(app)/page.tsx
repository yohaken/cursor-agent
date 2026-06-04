import { MarketBoard } from "@/components/market-board";

export default function SetMarketPage() {
  return (
    <MarketBoard
      market="SET"
      title="ตลาด SET — Top 20 มูลค่าตลาด"
      subtitle="รายชื่อหุ้น SET เรียงตามมูลค่าตลาดสูงสุด คลิกชื่อหลักทรัพย์เพื่อดูข้อมูลบริษัท"
    />
  );
}
