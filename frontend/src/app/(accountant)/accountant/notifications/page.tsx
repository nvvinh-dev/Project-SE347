"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/AppHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const noticesHistory = [
  { id: 1, title: "Thông báo nghỉ lễ Giỗ Tổ Hùng Vương", content: "Nhà trường thông báo toàn thể học sinh nghỉ học vào ngày 10/03 Âm lịch. Các con đi học lại bình thường vào ngày tiếp theo.", date: "15/04/2025" },
  { id: 2, title: "Thông báo nghỉ học do bão số 2", content: "Thực hiện chỉ đạo của Sở GD&ĐT, trường cho học sinh nghỉ học ngày 20/09 để phòng tránh bão.", date: "19/09/2024" },
];

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  return (
    <>
      <PageHeader
        title="Thông báo nghỉ học"
        description="Soạn và phát thông báo nghỉ học đến toàn thể phụ huynh"
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form soạn thông báo */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-[#E8E8EC] p-5 sm:p-6 shadow-xs">
          <h2 className="text-base font-bold text-[#16141F] mb-4">Soạn thông báo mới</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#16141F] mb-1.5">Tiêu đề thông báo</label>
              <Input
                placeholder="Ví dụ: Thông báo nghỉ lễ 30/4 và 1/5..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#16141F]">Nội dung thông báo (Tối đa 500 ký tự)</label>
                <span className={`text-xs font-medium ${content.length > 500 ? "text-[#E5484D] font-bold" : "text-[#6A677B]"}`}>
                  {content.length}/500
                </span>
              </div>
              <textarea
                rows={4}
                maxLength={500}
                placeholder="Nhập nội dung thông báo gửi đến phụ huynh..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-[#E8E8EC] text-sm text-[#16141F] placeholder:text-[#6A677B] focus:outline-none focus:border-[#42B591] focus:ring-1 focus:ring-[#42B591] transition-all resize-none"
              />
              <p className="text-[11px] text-[#6A677B] mt-1">
                ⚠️ Thông báo sau khi gửi sẽ không thể thu hồi hoặc chỉnh sửa.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <Button disabled={!title.trim() || !content.trim() || content.length > 500}>
                Phát thông báo
              </Button>
            </div>
          </div>
        </div>

        {/* Lịch sử thông báo */}
        <div className="lg:col-span-6 space-y-4">
          <h2 className="text-base font-bold text-[#16141F]">Thông báo đã phát hành</h2>
          
          {noticesHistory.map((n) => (
            <div key={n.id} className="bg-white rounded-xl border border-[#E8E8EC] p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <h3 className="text-sm font-bold text-[#16141F]">{n.title}</h3>
                <span className="text-xs font-semibold text-[#6A677B] shrink-0">{n.date}</span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-[#4A4759] leading-relaxed">
                {n.content}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}