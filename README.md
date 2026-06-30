# รายชื่อหุ้น MAI สำหรับ TradingView

ไฟล์สำเร็จรูปสำหรับนำเข้ารายชื่อหุ้นทั้งหมดในตลาด **mai** (Market for Alternative Investment) เข้า **TradingView Watchlist**

## ข้อมูลอ้างอิง

- **แหล่งข้อมูล:** [รายชื่อบริษัทจดทะเบียน SET](https://www.set.or.th/dat/eod/listedcompany/static/listedCompanies_en_US.xls) (ตลาดหลักทรัพย์แห่งประเทศไทย)
- **จำนวนหุ้น MAI:** 229 ตัว (อัปเดตล่าสุดตาม metadata)
- **รูปแบบสัญลักษณ์ TradingView:** `SET:SYMBOL` (เช่น `SET:AIRA`, `SET:PSGC`)

## ไฟล์ที่พร้อมใช้งาน

| ไฟล์ | คำอธิบาย |
|------|----------|
| [`data/mai-tradingview-import.txt`](data/mai-tradingview-import.txt) | **ไฟล์หลักสำหรับนำเข้า** — รูปแบบ comma-separated พร้อม prefix `SET:` |
| [`data/mai-tradingview-import.csv`](data/mai-tradingview-import.csv) | ไฟล์ CSV สำหรับนำเข้า (คอลัมน์ Symbol, Description) |
| [`data/mai-stocks-en.csv`](data/mai-stocks-en.csv) | รายชื่อเต็ม พร้อมชื่อบริษัท (EN/TH), อุตสาหกรรม, ภาคธุรกิจ |
| [`data/mai-stocks-metadata.json`](data/mai-stocks-metadata.json) | ข้อมูล metadata และวันที่อัปเดต |

## วิธีนำเข้า TradingView

1. เปิด TradingView แล้วไปที่ **Watchlist** (แถบด้านขวา)
2. คลิกชื่อ Watchlist ที่ต้องการ (หรือสร้างใหม่)
3. เลือก **นำเข้ารายการ…** (Import list / Upload list)
4. เลือกไฟล์ `data/mai-tradingview-import.txt`
5. ยืนยัน — หุ้น MAI ทั้ง 229 ตัวจะถูกเพิ่มเข้า Watchlist

> หมายเหตุ: ฟีเจอร์นำเข้า Watchlist ต้องใช้แพ็กเกจ Pro ขึ้นไป หรือช่วงทดลองใช้

## อัปเดตข้อมูล

```bash
python scripts/generate_mai_watchlist.py
```

สคริปต์จะดึงข้อมูลล่าสุดจาก SET (ผ่าน JSON mirror ที่ sync จากไฟล์ Excel ทางการ) แล้วสร้างไฟล์ใหม่ในโฟลเดอร์ `data/`

## แจ้งเตือนข่าว AiO ผ่าน Telegram

ติดตามข่าวจาก [aio.panphol.com/news](https://aio.panphol.com/news) แล้วส่งหัวข้อใหม่เข้า Telegram ทุก 1 ชั่วโมง (ไม่ส่งซ้ำ)

### ตั้งค่า (ครั้งเดียว)

1. คัดลอก `.env.example` เป็น `.env` แล้วใส่ค่า:
   - `TELEGRAM_BOT_TOKEN` — จาก [@BotFather](https://t.me/BotFather)
   - `TELEGRAM_CHAT_ID` — รหัสแชทผู้รับ
2. ติดตั้ง dependencies:

```bash
pip install -r requirements.txt
```

3. รันครั้งแรกเพื่อบันทึกข่าววันนี้เป็นฐานข้อมูล (ไม่ส่งย้อนหลัง):

```bash
export $(grep -v '^#' .env | xargs)
python scripts/monitor_aio_news.py --bootstrap
```

4. สำหรับ GitHub Actions ให้เพิ่ม Secrets ใน repo:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`

Workflow อยู่ที่ `.github/workflows/aio-news-monitor.yml` — รันอัตโนมัติทุกชั่วโมง

### รันด้วยตนเอง

```bash
python scripts/monitor_aio_news.py
```

---

## Dashboard ทุเรียน (ราคา & ปริมาณย้อนหลัง)

เว็บแอปเปรียบเทียบราคาและปริมาณทุเรียนรวม **ภาคตะวันออก + ภาคใต้** จาก [ระบบรายงานสถานการณ์ผลไม้ กรมส่งเสริมการเกษตร](https://simplefruit.doae.go.th/dashboard/index)

### ฟีเจอร์

- กราฟเส้นเปรียบเทียบราคาหลายปี (แกน X = สัปดาห์ของฤดู)
- กราฟแท่งปริมาณผลผลิตรวม
- Dual-axis ราคา vs ปริมาณ
- Heatmap ราคารายเดือน
- สรุปปริมาณรายปี พ.ศ. 2564–2569

### รัน Dashboard

```bash
pip install -r requirements.txt
python -m durian_dashboard          # ดึงข้อมูลล่าสุด (ครั้งแรก)
bash scripts/run_durian_dashboard.sh
```

เปิดเบราว์เซอร์ที่ `http://localhost:8501`

### อัปเดตข้อมูล

```bash
python -m durian_dashboard
```

ข้อมูลถูกบันทึกที่ `data/durian-dashboard.json`
