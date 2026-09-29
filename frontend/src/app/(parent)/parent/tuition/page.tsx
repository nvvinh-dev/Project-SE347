"use client";

import { PageHeader } from "@/components/layout/AppHeader";
import { StatusPill } from "@/components/ui/StatusPill";

const invoiceHistory = [
  { id: "HD-2025-06-01", month: "Tháng 06/2025", amount: "3.200.000đ", status: "paid", label: "Đã thanh toán", paidDate: "05/06/2025" },
  { id: "HD-2025-05-01", month: "Tháng 05/2025", amount: "3.200.000đ", status: "paid", label: "Đã thanh toán", paidDate: "04/05/2025" },
  { id: "HD-2025-04-01", month: "Tháng 04/2025", amount: "3.200.000đ", status: "paid", label: "Đã thanh toán", paidDate: "03/04/2025" },
];

export default function ParentTuitionPage() {
  return (
    <>
      <PageHeader
        title="Hóa đơn học phí"
        description="Tra cứu tình trạng đóng học phí của con theo từng tháng"
      />

      {/* Notice according to D21 */}
      <div className="bg-[#F0FAF6] border border-[#C4EDE0] rounded-xl p-4 sm:p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-[#16141F]">Quy định nộp học phí</h2>
          <p className="text-xs sm:text-sm font-medium text-[#4A4759] mt-0.5">
            Phụ huynh nộp học phí trực tiếp cho bộ phận Kế toán nhà trường. Sau khi thu tiền, Kế toán sẽ cập nhật trạng thái "Đã thanh toán" trên hệ thống.
          </p>
        </div>

      </div>

      {/* Main Invoices Table */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-[#F9F9FB] border-b border-[#E8E8EC]">
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Mã hóa đơn</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Kỳ học phí</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Số tiền</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Ngày nộp tiền</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EC]">
              {invoiceHistory.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#F3F2F7]/50 transition-colors">
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-bold text-[#247A60]">{inv.id}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-semibold text-[#16141F]">{inv.month}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-sm font-bold text-[#16141F]">{inv.amount}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-medium text-[#6A677B]">{inv.paidDate}</td>
                  <td className="px-4 sm:px-5 py-3.5">
                    <StatusPill variant={inv.status === "paid" ? "success" : "warning"} dot>
                      {inv.label}
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