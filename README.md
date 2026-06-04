# SETPulse — รายงานหุ้น SET / mai (SaaS ส่วนตัว)

เว็บแอป SaaS สำหรับดูและรายงานราคาหุ้นตลาด **SET** และ **mai** แบบ:

- **ณ เวลานั้น** (real-time จาก SET SMART Marketplace)
- **ดีเลย์ 10 วินาที** (delay feed หรือ buffer จำลองในโหมด demo)

## เริ่มต้น

```bash
cd web
cp .env.example .env.local
npm install
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000) — เข้าแดชบอร์ดได้ทันที ไม่ต้องล็อกอิน

## ข้อมูลจริงจาก SET

1. สมัคร API ที่ [SET SMART Marketplace](https://www.set.or.th/en/services/connectivity-and-data/data/smart-marketplace)
2. ใส่ `SET_API_KEY` ใน `web/.env.local`
3. รีสตาร์ท `npm run dev`

ไม่มี API key ระบบจะใช้ **ข้อมูลจำลอง** เพื่อทดสอบ UI

## สคริปต์

| คำสั่ง | ความหมาย |
|--------|----------|
| `npm run dev` | รัน dev server |
| `npm run build` | build production |
| `npm run lint` | ESLint |
| `npm start` | รัน production |

## โครงสร้าง

- `web/` — แอป Next.js 15 (App Router, Tailwind)
- แดชบอร์ด, Watchlist, ส่งออกรายงาน CSV

## หมายเหตุทางกฎหมาย

ข้อมูลตลาดหลักทรัพย์เป็นทรัพย์สินของ SET — ต้องปฏิบัติตามเงื่อนไขการใช้งานของ SMART Marketplace ก่อนใช้งานจริง
