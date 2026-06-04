import { redirect } from "next/navigation";

/** รองรับลิงก์เก่า — เปิดแท็บ mai ในหน้าหลัก */
export default function MaiRedirectPage() {
  redirect("/?tab=mai");
}
