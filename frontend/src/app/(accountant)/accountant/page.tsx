"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/AppHeader";
import { StatusPill } from "@/components/ui/StatusPill";

const stats = [
  { label: "Tổng số trẻ đang học", value: "124 trẻ", desc: "Theo danh sách 3 khối lớp" },
  { label: "Hóa đơn đã thu", value: "98 hóa đơn", desc: "Đã ghi nhận thanh toán" },
  { label: "Hóa đơn chưa thu", value: "26 hóa đơn", desc: "Cần theo dõi đôn đốc" },
];

const recentInvoices = [
  { id: "HD-2025-06-01", childName: "Nguyễn Gia Hưng", class: "Chồi A", amount: "3.200.000đ", status: "paid", statusLabel: "Đã thanh toán" },
  { id: "HD-2025-06-02", childName: "Trần Bảo Ngọc", class: "Mầm 1", amount: "3.200.000đ", status: "paid", statusLabel: "Đã thanh toán" },
  { id: "HD-2025-06-03", childName: "Lê Minh Tuấn", class: "Mầm 2", amount: "3.200.000đ", status: "unpaid", statusLabel: "Chưa thanh toán" },
  { id: "HD-2025-06-04", childName: "Phạm Thảo Vy", class: "Lá B", amount: "3.200.000đ", status: "paid", statusLabel: "Đã thanh toán" },
  { id: "HD-2025-06-05", childName: "Hoàng Gia Bảo", class: "Chồi B", amount: "3.200.000đ", status: "unpaid", statusLabel: "Chưa thanh toán" },
];

export default function AccountantDashboard() {
  return (
    <>
      <PageHeader
        title="Tổng quan Kế toán"
        description="Theo dõi học phí, hồ sơ trẻ và thực đơn nhà trường"
      />

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-[#E8E8EC] p-4 sm:p-5 shadow-xs">
            <p className="text-xs font-bold text-[#6A677B] uppercase tracking-wider">{s.label}</p>
            <p className="text-xl sm:text-2xl font-bold text-[#16141F] mt-1.5">{s.value}</p>
            <p className="text-xs font-medium text-[#6A677B] mt-1">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Invoices */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E8E8EC] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#16141F]">Hóa đơn học phí gần đây</h2>
            <p className="text-xs font-medium text-[#6A677B] mt-0.5">Danh sách học phí tháng hiện tại</p>
          </div>
          <Link
            href="/accountant/tuition"
            className="text-xs font-bold text-[#247A60] hover:underline self-start sm:self-auto"
          >
            Xem tất cả sổ thu học phí →
          </Link>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[620px] border-collapse">
            <thead>
              <tr className="bg-[#F9F9FB] border-b border-[#E8E8EC]">
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Mã hóa đơn</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Họ và tên trẻ</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Lớp</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Số tiền</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EC]">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F3F2F7]/50 transition-colors">
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-bold text-[#247A60]">{inv.id}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-sm font-semibold text-[#16141F]">{inv.childName}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-semibold text-[#6A677B]">{inv.class}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-sm font-bold text-[#16141F]">{inv.amount}</td>
                  <td className="px-4 sm:px-5 py-3.5">
                    <StatusPill variant={inv.status === "paid" ? "success" : "warning"} dot>
                      {inv.statusLabel}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}