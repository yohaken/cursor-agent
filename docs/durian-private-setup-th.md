# ตั้งค่า Dashboard ทุเรียน (Repo Private)

Repo เป็น **Private** → ใช้ **Streamlit Community Cloud** เป็นหลัก  
(GitHub Pages แบบฟรีใช้ได้เฉพาะ repo Public)

---

## สิ่งที่ได้หลังตั้งค่า

| รายการ | รายละเอียด |
|--------|------------|
| URL ถาวร | `https://ชื่อที่ตั้ง.streamlit.app` |
| Repo | ยังเป็น Private ได้ |
| อัปเดตข้อมูล | อัตโนมัติทุกวัน 08:00 น. (GitHub Actions) |
| Excel | ดาวน์โหลดจากปุ่มใน Dashboard |

> **หมายเหตุ:** โค้ดใน GitHub เป็นส่วนตัว แต่ **ลิงก์ Streamlit เปิดให้ใครที่มี URL เข้าได้** (เหมือนแชร์ลิงก์) ถ้าต้องการล็อกรหัสผ่าน ต้องใช้ Streamlit Authentication (แพ็กเกจเสียเงิน) หรือ deploy บน VPS ของตัวเอง

---

## ขั้นตอน (ทำครั้งเดียว ~5 นาที)

### 1. เปิด Streamlit Cloud

1. ไปที่ https://share.streamlit.io  
2. กด **Sign in** → Login ด้วย **GitHub** (บัญชี `yohaken`)  
3. อนุญาตให้ Streamlit เข้าถึง repo (ครั้งแรก GitHub จะถามสิทธิ์)

### 2. สร้างแอป

1. กด **Create app** / **New app**  
2. กรอก:

| ช่อง | ค่า |
|------|-----|
| Repository | `yohaken/cursor-agent` |
| Branch | `main` |
| Main file path | `streamlit_app.py` |
| App URL (ชื่อ) | เช่น `durian-dashboard-th` |

3. กด **Deploy**

### 3. รอ deploy เสร็จ (1–3 นาที)

ได้ลิงก์ถาวร เช่น:

```
https://durian-dashboard-th.streamlit.app
```

ส่งลิงก์นี้ให้ผู้ใช้เปิดดูได้เลย

---

## อัปเดตข้อมูลอัตโนมัติ

Workflow **Durian Dashboard Daily Update** รันทุกวัน **08:00 น.** (เวลาไทย):

- ดึงข้อมูลจาก DOAE  
- อัปเดต `data/durian-dashboard.json` + Excel  
- Push เข้า `main`  
- Streamlit Cloud **deploy ใหม่อัตโนมัติ** เมื่อเห็น push

ทดสอบทันที (ไม่ต้องรอพรุ่งนี้):

1. GitHub → **Actions**  
2. เลือก **Durian Dashboard Daily Update**  
3. **Run workflow**

---

## ดาวน์โหลด Excel

**ใน Dashboard:** แถบซ้าย → ปุ่ม **ดาวน์โหลดรายงาน Excel**

**จาก GitHub (ต้อง login GitHub):**  
`cursor-agent` → `data/durian-dashboard-report.xlsx` → Download

---

## ไม่ต้องพึ่ง Cursor

หลังตั้ง Streamlit Cloud แล้ว:

- ลิงก์ใช้ได้ถาวร  
- อัปเดตรายวันผ่าน GitHub Actions  
- **ไม่ต้องสมัคร Cursor** เพื่อให้ระบบทำงาน

---

## ปัญหาที่พบบ่อย

**Deploy ล้มเหลว — Module not found**  
→ ตรวจว่า `requirements.txt` มี `streamlit`, `pandas`, `plotly`, `httpx`, `beautifulsoup4`, `openpyxl`

**เปิดแอปแล้วว่าง / ไม่มีข้อมูล**  
→ รัน Actions **Durian Dashboard Daily Update** ครั้งหนึ่ง หรือรอ deploy ใหม่หลัง push

**GitHub Pages 404**  
→ ปกติสำหรับ repo Private — ใช้ Streamlit แทน ไม่ต้องตั้ง Pages

**อยากเปิด Public ทีหลัง**  
→ เปลี่ยน visibility เป็น Public แล้วเปิด GitHub Pages จาก branch `gh-pages` ได้
