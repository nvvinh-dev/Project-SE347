"use client";

import { PageHeader } from "@/components/layout/AppHeader";
import { StatusPill } from "@/components/ui/StatusPill";

const healthHistory = [
  { date: "10/06/2025", mood: "Vui vẻ", temp: "36.6°C", note: "Bé chơi ngoan, ăn hết suất" },
  { date: "07/06/2025", mood: "Bình thường", temp: "36.8°C", note: "Tham gia đủ các hoạt động" },
  { date: "06/06/2025", mood: "Hơi mệt", temp: "37.2°C", note: "Có dấu hiệu sổ mũi nhẹ, đã uống nước ấm" },
];

export default function HealthPage() {
  return (
    <>
      <PageHeader
        title="Sức khỏe & Sự cố của con"
        description="Theo dõi tình trạng sức khỏe và ghi nhận sự cố của bé tại trường"
      />

      {/* Health Notes Banner (Required by FR-HEALTH-05) */}
      <div className="bg-[#F0FAF6] border border-[#C4EDE0] rounded-xl p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#247A60] uppercase tracking-wider">Lưu ý sức khỏe của trẻ</span>
          <span className="text-xs font-medium text-[#6A677B]">Từ sổ Y tế trường</span>
        </div>
        <p className="text-sm font-semibold text-[#16141F]">
          Bé không có tiền sử dị ứng thực phẩm. Thể trạng bình thường.
        </p>
        <p className="text-xs font-medium text-[#E5484D] mt-2 pt-2 border-t border-[#C4EDE0]">
          ⚠️ Lưu ý: Nếu thông tin sức khỏe của bé bị sai hoặc thiếu, phụ huynh vui lòng thông báo ngay cho Nhân viên Y tế nhà trường.
        </p>
      </div>

      {/* Recent Health Records */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E8E8EC]">
          <h2 className="text-base font-bold text-[#16141F]">Nhật ký theo dõi sức khỏe gần đây</h2>
          <p className="text-xs font-medium text-[#6A677B] mt-0.5">Thông tin do giáo viên chủ nhiệm ghi nhận hàng ngày</p>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[600px] border-collapse">
            <thead>
              <tr className="bg-[#F9F9FB] border-b border-[#E8E8EC]">
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Ngày</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Tâm trạng (Mood)</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Thân nhiệt</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EC]">
              {healthHistory.map((item) => (
                <tr key={item.date} className="hover:bg-[#F3F2F7]/50 transition-colors">
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-bold text-[#16141F]">{item.date}</td>
                  <td className="px-4 sm:px-5 py-3.5">
                    <StatusPill variant={item.mood === "Vui vẻ" ? "success" : item.mood === "Hơi mệt" ? "warning" : "neutral"}>
                      {item.mood}
                    </StatusPill>
                  </td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-bold text-[#16141F]">{item.temp}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-medium text-[#6A677B]">{item.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}