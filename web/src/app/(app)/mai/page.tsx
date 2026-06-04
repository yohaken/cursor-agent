import { MarketBoard } from "@/components/market-board";

export default function MaiMarketPage() {
  return (
    <MarketBoard
      market="mai"
      title="ตลาด mai — Top 20 มูลค่าตลาด"
      subtitle="รายชื่อหุ้น mai เท่านั้น เรียงตามมูลค่าตลาดสูงสุด คลิกชื่อหลักทรัพย์เพื่อดูข้อมูลบริษัท"
    />
  );
}
