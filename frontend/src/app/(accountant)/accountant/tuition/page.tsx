"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/AppHeader";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";

const invoiceList = [
  { id: "HD-2025-06-01", childName: "Nguyễn Gia Hưng", class: "Chồi A", month: "06/2025", amount: "3.200.000đ", method: "Chuyển khoản (VCB-8924)", paidAt: "05/06/2025", status: "paid", statusLabel: "Đã thanh toán" },
  { id: "HD-2025-06-02", childName: "Trần Bảo Ngọc", class: "Mầm 1", month: "06/2025", amount: "3.200.000đ", method: "Tiền mặt", paidAt: "04/06/2025", status: "paid", statusLabel: "Đã thanh toán" },
  { id: "HD-2025-06-03", childName: "Lê Minh Tuấn", class: "Mầm 2", month: "06/2025", amount: "3.200.000đ", method: "—", paidAt: "—", status: "unpaid", statusLabel: "Chưa thanh toán" },
  { id: "HD-2025-06-04", childName: "Phạm Thảo Vy", class: "Lá B", month: "06/2025", amount: "3.200.000đ", method: "Chuyển khoản (TCB-1102)", paidAt: "03/06/2025", status: "paid", statusLabel: "Đã thanh toán" },
  { id: "HD-2025-06-05", childName: "Hoàng Gia Bảo", class: "Chồi B", month: "06/2025", amount: "3.200.000đ", method: "—", paidAt: "—", status: "unpaid", statusLabel: "Chưa thanh toán" },
];

export default function TuitionPage() {
  const [filterStatus, setFilterStatus] = useState("all");

  const filtered = invoiceList.filter((inv) => {
    if (filterStatus === "all") return true;
    return inv.status === filterStatus;
  });

  return (
    <>
      <PageHeader
        title="Học phí & Hóa đơn"
        description="Quản lý biểu phí chung và ghi nhận nộp học phí của trẻ"
      />

      {/* Bộ lọc di chuyển xuống dưới banner, nằm ngay trên main table */}
      <div className="flex items-center justify-end gap-2.5 mb-4">
        <div className="w-36">
          <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả trạng thái</option>
            <option value="paid">Đã thanh toán</option>
            <option value="unpaid">Chưa thanh toán</option>
          </Select>
        </div>
        <div className="w-36">
          <Select defaultValue="06">
            <option value="06">Tháng 06/2025</option>
            <option value="05">Tháng 05/2025</option>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-[#F9F9FB] border-b border-[#E8E8EC]">
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Mã hóa đơn</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Họ và tên trẻ</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Lớp</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Kỳ học</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Số tiền</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Hình thức / Ngày thu</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EC]">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F3F2F7]/50 transition-colors">
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-bold text-[#247A60]">{inv.id}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-sm font-semibold text-[#16141F]">{inv.childName}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-semibold text-[#6A677B]">{inv.class}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-medium text-[#16141F]">{inv.month}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-sm font-bold text-[#16141F]">{inv.amount}</td>
                  <td className="px-4 sm:px-5 py-3.5">
                    <p className="text-xs font-medium text-[#16141F]">{inv.method}</p>
                    {inv.paidAt !== "—" && <p className="text-[11px] text-[#6A677B]">{inv.paidAt}</p>}
                  </td>
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