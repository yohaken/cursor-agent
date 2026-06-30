"""Streamlit dashboard: durian price & production comparison across years."""

from __future__ import annotations

import json
from pathlib import Path

import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import streamlit as st

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "durian-dashboard.json"
VARIETIES = ["หมอนทอง", "ชะนี", "ก้านยาว", "พวงมณี", "กระดุม", "สาริกา", "อื่นๆ"]


@st.cache_data(ttl=3600)
def load_data() -> dict:
    if not DATA_PATH.exists():
        return {"years": {}}
    return json.loads(DATA_PATH.read_text(encoding="utf-8"))


def daily_df(data: dict) -> pd.DataFrame:
    rows = []
    for db_year, y in sorted(data.get("years", {}).items(), key=lambda x: int(x[0])):
        for d in y.get("combined_daily", []):
            for variety in VARIETIES:
                price_a = d.get("prices", {}).get(variety, {}).get("A")
                rows.append(
                    {
                        "db_year": int(db_year),
                        "be_year": int(db_year) + 543,
                        "date_iso": d.get("date_iso"),
                        "season_day": d.get("season_day"),
                        "season_week": d.get("season_week_aligned"),
                        "total_volume": d.get("total_volume", 0),
                        "east_volume": d.get("east_volume", 0),
                        "south_volume": d.get("south_volume", 0),
                        "variety": variety,
                        "price_a": price_a,
                    }
                )
    df = pd.DataFrame(rows)
    if not df.empty:
        df["date_iso"] = pd.to_datetime(df["date_iso"])
    return df


def summary_df(data: dict) -> pd.DataFrame:
    rows = []
    for db_year, y in sorted(data.get("years", {}).items(), key=lambda x: int(x[0])):
        s = y.get("combined_summary", {})
        rows.append(
            {
                "db_year": int(db_year),
                "be_year": int(db_year) + 543,
                "estimate_tons": s.get("estimate_tons"),
                "harvested_tons": s.get("harvested_tons"),
                "harvest_pct": s.get("harvest_pct"),
                "season_value_baht": s.get("season_value_baht"),
            }
        )
    return pd.DataFrame(rows)


def weekly_agg(df: pd.DataFrame, variety: str, grade: str = "A") -> pd.DataFrame:
    sub = df[(df["variety"] == variety) & df["price_a"].notna()].copy()
    if sub.empty:
        return sub
    agg = (
        sub.groupby(["be_year", "season_week"], as_index=False)
        .agg(
            price=("price_a", "mean"),
            volume=("total_volume", "sum"),
            days=("date_iso", "count"),
        )
        .sort_values(["be_year", "season_week"])
    )
    return agg


def fig_price_lines(weekly: pd.DataFrame, title: str) -> go.Figure:
    fig = px.line(
        weekly,
        x="season_week",
        y="price",
        color="be_year",
        markers=True,
        labels={"season_week": "สัปดาห์ที่ของฤดู", "price": "ราคาเฉลี่ย (บาท/กก.)", "be_year": "ปี พ.ศ."},
        title=title,
        color_discrete_sequence=px.colors.qualitative.Set2,
    )
    fig.update_layout(hovermode="x unified", legend_title_text="ปี พ.ศ.", height=480)
    return fig


def fig_volume_bars(weekly_vol: pd.DataFrame, title: str) -> go.Figure:
    fig = px.bar(
        weekly_vol,
        x="season_week",
        y="volume",
        color="be_year",
        barmode="group",
        labels={"season_week": "สัปดาห์ที่ของฤดู", "volume": "ปริมาณผลผลิต (ตัน)", "be_year": "ปี พ.ศ."},
        title=title,
        color_discrete_sequence=px.colors.qualitative.Pastel,
    )
    fig.update_layout(height=480, legend_title_text="ปี พ.ศ.")
    return fig


def fig_dual_axis(weekly: pd.DataFrame, be_year: int) -> go.Figure:
    sub = weekly[weekly["be_year"] == be_year]
    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_trace(
        go.Bar(x=sub["season_week"], y=sub["volume"], name="ปริมาณ (ตัน)", marker_color="#6baed6"),
        secondary_y=False,
    )
    fig.add_trace(
        go.Scatter(
            x=sub["season_week"],
            y=sub["price"],
            name="ราคา (บาท/กก.)",
            mode="lines+markers",
            line=dict(color="#e6550d", width=2),
        ),
        secondary_y=True,
    )
    fig.update_xaxes(title_text="สัปดาห์ที่ของฤดู")
    fig.update_yaxes(title_text="ปริมาณผลผลิต (ตัน)", secondary_y=False)
    fig.update_yaxes(title_text="ราคาเฉลี่ย (บาท/กก.)", secondary_y=True)
    fig.update_layout(title=f"ราคา vs ปริมาณ — ปี พ.ศ. {be_year}", height=480)
    return fig


def fig_heatmap_month(df: pd.DataFrame, variety: str) -> go.Figure:
    sub = df[(df["variety"] == variety) & df["price_a"].notna()].copy()
    if sub.empty:
        return go.Figure()
    sub["month"] = sub["date_iso"].dt.month
    thai_months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."]
    pivot = sub.groupby(["be_year", "month"])["price_a"].mean().reset_index()
    matrix = pivot.pivot(index="be_year", columns="month", values="price_a")
    fig = px.imshow(
        matrix,
        labels=dict(x="เดือน", y="ปี พ.ศ.", color="ราคา (บาท/กก.)"),
        x=[thai_months[m - 1] for m in matrix.columns],
        y=[f"พ.ศ. {y}" for y in matrix.index],
        title=f"Heatmap ราคาเฉลี่ยรายเดือน — {variety}",
        aspect="auto",
        color_continuous_scale="YlOrRd",
    )
    fig.update_layout(height=420)
    return fig


def fig_annual_summary(summary: pd.DataFrame) -> go.Figure:
    fig = make_subplots(specs=[[{"secondary_y": True}]])
    fig.add_trace(
        go.Bar(
            x=[f"พ.ศ. {y}" for y in summary["be_year"]],
            y=summary["harvested_tons"],
            name="เก็บเกี่ยวแล้ว (ตัน)",
            marker_color="#74c476",
        ),
        secondary_y=False,
    )
    fig.add_trace(
        go.Scatter(
            x=[f"พ.ศ. {y}" for y in summary["be_year"]],
            y=summary["estimate_tons"],
            name="ประมาณการ (ตัน)",
            mode="lines+markers",
            line=dict(color="#3182bd", dash="dash"),
        ),
        secondary_y=False,
    )
    fig.update_yaxes(title_text="ปริมาณ (ตัน)", secondary_y=False)
    fig.update_layout(title="ปริมาณผลผลิตทุเรียนรวมทั้งประเทศ (ภาคตะวันออก + ภาคใต้)", height=420)
    return fig


def main() -> None:
    st.set_page_config(
        page_title="ทุเรียน Dashboard",
        page_icon="🥭",
        layout="wide",
        initial_sidebar_state="expanded",
    )

    st.title("🥭 Dashboard ทุเรียน — เปรียบเทียบราคาและปริมาณย้อนหลัง")
    st.caption(
        "ข้อมูลรวมภาคตะวันออก + ภาคใต้ จาก "
        "[ระบบรายงานสถานการณ์ผลไม้ กรมส่งเสริมการเกษตร](https://simplefruit.doae.go.th/dashboard/index)"
    )

    data = load_data()
    if not data.get("years"):
        st.error("ยังไม่มีข้อมูล — รัน `python -m durian_dashboard.scraper` ก่อน")
        st.stop()

    df = daily_df(data)
    summary = summary_df(data)

    with st.sidebar:
        st.header("ตัวกรอง")
        variety = st.selectbox("พันธุ์", VARIETIES, index=0)
        available_years = sorted(df["be_year"].unique())
        selected_years = st.multiselect(
            "ปี พ.ศ. ที่แสดง",
            available_years,
            default=available_years,
            format_func=lambda y: f"พ.ศ. {y}",
        )
        dual_year = st.selectbox(
            "ปีสำหรับกราฟ Dual-axis",
            available_years,
            index=len(available_years) - 1,
            format_func=lambda y: f"พ.ศ. {y}",
        )
        st.divider()
        st.markdown("**หมายเหตุ**")
        st.markdown(
            "- ราคา = ค่าเฉลี่ยถ่วงน้ำหนักตามปริมาณรายวัน\n"
            "- แกน X สัปดาห์ฤดู = นับจากวันแรกที่มีผลผลิต\n"
            "- ปีล่าสุดอาจยังไม่ครบฤดูเก็บเกี่ยว"
        )
        if data.get("scraped_at"):
            st.caption(f"อัปเดตข้อมูล: {data['scraped_at'][:19]} UTC")

    df = df[df["be_year"].isin(selected_years)]

    # KPI row
    latest = summary.iloc[-1]
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("ปีล่าสุด", f"พ.ศ. {int(latest['be_year'])}")
    c2.metric("ประมาณการรวม", f"{latest['estimate_tons']:,.0f} ตัน")
    c3.metric("เก็บเกี่ยวแล้ว", f"{latest['harvested_tons']:,.0f} ตัน")
    c4.metric("ความคืบหน้า", f"{latest['harvest_pct'] or 0:.1f}%")

    weekly = weekly_agg(df, variety)
    weekly_vol = (
        df[df["variety"] == variety]
        .groupby(["be_year", "season_week"], as_index=False)["total_volume"]
        .sum()
        .rename(columns={"total_volume": "volume"})
    )

    tab1, tab2, tab3, tab4 = st.tabs(
        ["📈 เปรียบเทียบหลายปี", "📊 ราคา vs ปริมาณ", "🗓️ Heatmap รายเดือน", "📋 สรุปรายปี"]
    )

    with tab1:
        col_l, col_r = st.columns(2)
        with col_l:
            st.plotly_chart(
                fig_price_lines(weekly, f"ราคา {variety} เกรด A — เส้นเปรียบเทียบหลายปี"),
                use_container_width=True,
            )
        with col_r:
            st.plotly_chart(
                fig_volume_bars(weekly_vol, f"ปริมาณผลผลิตรวม — เปรียบเทียบหลายปี"),
                use_container_width=True,
            )

    with tab2:
        st.plotly_chart(fig_dual_axis(weekly, dual_year), use_container_width=True)
        st.info("เมื่อปริมาณผลผลิตพุ่งสูง มักเห็นราคาปรับลงในช่วง Peak — สะท้อนอุปทานในตลาด")

    with tab3:
        st.plotly_chart(fig_heatmap_month(df, variety), use_container_width=True)

    with tab4:
        st.plotly_chart(fig_annual_summary(summary), use_container_width=True)
        display = summary.copy()
        display["be_year"] = display["be_year"].apply(lambda y: f"พ.ศ. {y}")
        display["season_value_baht"] = display["season_value_baht"].apply(
            lambda x: f"{x:,.0f}" if pd.notna(x) else "-"
        )
        display.columns = [
            "ปี ค.ศ.",
            "ปี พ.ศ.",
            "ประมาณการ (ตัน)",
            "เก็บเกี่ยวแล้ว (ตัน)",
            "% ความคืบหน้า",
            "มูลค่าผลผลิต (บาท)",
        ]
        st.dataframe(display, use_container_width=True, hide_index=True)


if __name__ == "__main__":
    main()
