"use client";

import { PageHeader } from "@/components/layout/AppHeader";
import { StatusPill } from "@/components/ui/StatusPill";

const notifications = [
  { id: 1, title: "Thông báo lịch nghỉ lễ Giỗ Tổ Hùng Vương", date: "15/04/2025", sender: "Ban Giám Hiệu", content: "Nhà trường thông báo toàn thể học sinh nghỉ học vào ngày 10/03 Âm lịch. Các con đi học lại bình thường vào ngày tiếp theo.", unread: false },
  { id: 2, title: "Lịch họp phụ huynh định kỳ Học kỳ II", date: "10/05/2025", sender: "Cô Nguyễn Thị Mai", content: "Kính mời phụ huynh tham dự buổi họp tổng kết học kỳ vào lúc 08:30 sáng Thứ Bảy (20/05) tại phòng học lớp Chồi A.", unread: true },
];

export default function ParentNotificationsPage() {
  return (
    <>
      <PageHeader
        title="Thông báo"
        description="Các thông báo học tập và hoạt động từ nhà trường"
      />

      <div className="space-y-3.5">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`bg-white rounded-xl border p-4 sm:p-5 shadow-xs transition-all ${
              n.unread ? "border-[#42B591] border-l-4 border-l-[#42B591]" : "border-[#E8E8EC]"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h2 className="text-sm sm:text-base font-bold text-[#16141F]">{n.title}</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-[#6A677B]">{n.date}</span>
                {n.unread ? (
                  <StatusPill variant="brand" dot>Mới</StatusPill>
                ) : (
                  <StatusPill variant="neutral">Đã xem</StatusPill>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm font-medium text-[#4A4759] leading-relaxed mb-3">
              {n.content}
            </p>

            <div className="text-xs font-semibold text-[#6A677B] pt-2.5 border-t border-[#F3F2F7]">
              Người gửi: <span className="text-[#16141F]">{n.sender}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}