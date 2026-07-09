# วิธีได้ URL คงที่ + อัปเดตข้อมูลทุเรียนอัตโนมัติทุกวัน

## ภาพรวม

```
┌─────────────────────┐     ทุกวัน 08:00 น.      ┌──────────────────────┐
│  GitHub Actions     │ ───────────────────────► │  data/*.json / .xlsx │
│  (ดึงข้อมูล DOAE)    │      commit อัตโนมัติ      │  ใน repo             │
└─────────────────────┘                          └──────────┬───────────┘
                                                            │
                                                            ▼
                                               ┌──────────────────────┐
                                               │  Streamlit Cloud     │
                                               │  URL ถาวร            │
                                               │  your-app.streamlit.app
                                               └──────────────────────┘
```

**สิ่งที่ได้**
- URL คงที่ เช่น `https://durian-dashboard.streamlit.app`
- ข้อมูลอัปเดตเองทุกวัน (ไม่ต้องรันสคริปต์เอง)
- ดาวน์โหลด Excel จากหน้าเว็บได้

---

## ขั้นตอนที่ 1: Merge โค้ดเข้า branch `main`

1. Merge Pull Request ของ durian dashboard เข้า `main`
2. ตรวจว่ามีไฟล์เหล่านี้ใน repo:
   - `streamlit_app.py`
   - `durian_dashboard/`
   - `.github/workflows/durian-dashboard-update.yml`
   - `requirements.txt`

---

## ขั้นตอนที่ 2: เปิดใช้ GitHub Actions (อัปเดตรายวัน)

Workflow ชื่อ **Durian Dashboard Daily Update** จะรันอัตโนมัติ:

- **เวลา:** 08:00 น. ตามเวลาไทย ทุกวัน
- **ทำอะไร:** ดึงข้อมูลจาก DOAE → บันทึก JSON + Excel → commit กลับ repo

### ทดสอบครั้งแรก (ไม่ต้องรอถึงพรุ่งนี้)

1. ไปที่ GitHub repo → แท็บ **Actions**
2. เลือก **Durian Dashboard Daily Update**
3. กด **Run workflow** → **Run workflow**

### ตรวจว่าสำเร็จ

- ใน Actions เห็นเครื่องหมายถูกสีเขียว
- มี commit ใหม่ชื่อ `chore: update durian dashboard data`

> **หมายเหตุ:** repo ต้องเป็น **public** หรือมี GitHub plan ที่รองรับ scheduled workflows ใน private repo

---

## ขั้นตอนที่ 3: Deploy บน Streamlit Community Cloud (URL ถาวร — ฟรี)

### 3.1 สมัครและเชื่อม GitHub

1. เปิด [https://share.streamlit.io](https://share.streamlit.io)
2. Login ด้วย GitHub
3. กด **New app**

### 3.2 ตั้งค่าแอป

| ช่อง | ค่า |
|------|-----|
| Repository | `yohaken/cursor-agent` (หรือ repo ของคุณ) |
| Branch | `main` |
| Main file path | `streamlit_app.py` |

กด **Deploy**

### 3.3 ได้ URL ถาวร

รูปแบบ URL:

```
https://<ชื่อที่ตั้ง>.streamlit.app
```

เช่น `https://durian-th.streamlit.app` — ลิงก์นี้**ไม่หมดอายุ**ตราบใดที่แอปยัง deploy อยู่

### 3.4 ให้ข้อมูลอัปเดตบนหน้าเว็บ

Streamlit Cloud จะ **redeploy อัตโนมัติ** เมื่อมี push ใหม่เข้า branch `main`

ลำดับทุกวัน:
1. GitHub Actions ดึงข้อมูล → commit
2. Streamlit Cloud เห็น push ใหม่ → deploy ใหม่ (ประมาณ 1–3 นาที)
3. เปิด URL เดิม → เห็นข้อมูลวันล่าสุด

---

## ทางเลือกอื่น (ถ้าไม่ใช้ Streamlit Cloud)

| แพลตฟอร์ม | URL ถาวร | อัปเดตรายวัน | ความยาก |
|-----------|----------|--------------|---------|
| **Streamlit Cloud** | ✅ ฟรี | ผ่าน GitHub Actions | ง่ายที่สุด |
| **Render.com** | ✅ subdomain.render.com | Cron Job (อาจมีค่าใช้จ่าย) | ปานกลาง |
| **VPS ของตัวเอง** | ✅ โดเมนตัวเอง | `cron` + systemd | ยากขึ้น |
| **Railway / Fly.io** | ✅ | Scheduled task | ปานกลาง |

---

## VPS / Server ของตัวเอง (โดเมนคงที่เต็มรูปแบบ)

เหมาะถ้าต้องการ URL แบบ `https://durian.yourdomain.com`

```bash
# 1. clone repo
git clone https://github.com/yohaken/cursor-agent.git
cd cursor-agent
pip install -r requirements.txt

# 2. cron อัปเดตทุกวัน 08:00
crontab -e
# เพิ่มบรรทัด:
0 8 * * * cd /path/to/cursor-agent && python3 -m durian_dashboard && python3 -m durian_dashboard.export_excel

# 3. รัน Streamlit ตลอดเวลา (systemd)
# /etc/systemd/system/durian-dashboard.service
[Service]
ExecStart=/usr/bin/streamlit run streamlit_app.py --server.port 8501 --server.address 127.0.0.1
WorkingDirectory=/path/to/cursor-agent

# 4. Nginx reverse proxy + Let's Encrypt SSL
# proxy_pass http://127.0.0.1:8501;
```

---

## สรุปสั้นๆ

| ต้องการ | ทำอย่างไร |
|---------|-----------|
| **URL คงที่ (พร้อมใช้)** | https://yohaken.github.io/cursor-agent/durian/ |
| อัปเดตทุกวันอัตโนมัติ | เปิดใช้แล้ว — GitHub Actions 08:00 น. |
| ดาวน์โหลด Excel | https://github.com/yohaken/cursor-agent/raw/main/data/durian-dashboard-report.xlsx |
| Streamlit (ตัวกรองเพิ่ม) | Deploy ที่ share.streamlit.io → `streamlit_app.py` |

**ไม่ต้องตั้งชื่อเอง** — ใช้ลิงก์ GitHub Pages ด้านบนได้ทันที
