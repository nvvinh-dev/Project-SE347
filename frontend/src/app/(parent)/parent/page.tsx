"use client";

import Link from "next/link";
import { PageHeader } from "@/components/layout/AppHeader";
import { StatusPill } from "@/components/ui/StatusPill";

export default function ParentDashboard() {
  return (
    <>
      <PageHeader
        title="Tổng quan bé yêu"
        description="Theo dõi hoạt động, sức khỏe và thông tin học tập của con tại trường"
      />

      {/* Child Information Card */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] p-4 sm:p-5 shadow-xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-full bg-[#F0FAF6] text-[#247A60] border border-[#C4EDE0] text-base font-bold flex items-center justify-center shrink-0">
            H
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-[#16141F]">Nguyễn Gia Hưng</h2>
              <span className="text-xs font-bold text-[#247A60] bg-[#F0FAF6] px-2 py-0.5 rounded-full border border-[#C4EDE0]">
                Lớp Chồi A
              </span>
            </div>
            <p className="text-xs sm:text-sm font-medium text-[#6A677B] mt-0.5">
              GVCN: Cô Nguyễn Thị Mai · Năm học 2024 - 2025
            </p>
          </div>
        </div>
        <StatusPill variant="success" dot>Đang theo học</StatusPill>
      </div>

      {/* 3 Overview Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-6">
        <div className="bg-white rounded-xl border border-[#E8E8EC] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#6A677B] uppercase tracking-wider">Điểm danh hôm nay</p>
            <p className="text-lg font-bold text-[#30A46C] mt-1.5">Có mặt (Present)</p>
          </div>
          <Link href="/parent/attendance" className="text-xs font-bold text-[#247A60] hover:underline mt-3 pt-3 border-t border-[#F3F2F7]">
            Xem lịch sử điểm danh →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E8EC] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#6A677B] uppercase tracking-wider">Sức khỏe của con</p>
            <p className="text-lg font-bold text-[#16141F] mt-1.5">Bình thường</p>
          </div>
          <Link href="/parent/health" className="text-xs font-bold text-[#247A60] hover:underline mt-3 pt-3 border-t border-[#F3F2F7]">
            Xem sổ theo dõi sức khỏe →
          </Link>
        </div>

        <div className="bg-white rounded-xl border border-[#E8E8EC] p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div>
            <p className="text-xs font-bold text-[#6A677B] uppercase tracking-wider">Học phí tháng này</p>
            <p className="text-lg font-bold text-[#30A46C] mt-1.5">Đã thanh toán</p>
          </div>
          <Link href="/parent/tuition" className="text-xs font-bold text-[#247A60] hover:underline mt-3 pt-3 border-t border-[#F3F2F7]">
            Xem hóa đơn học phí →
          </Link>
        </div>
      </div>
    </>
  );
}