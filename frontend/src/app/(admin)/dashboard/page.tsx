"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() ? user.fullName : "Nguyễn Văn Vinh";

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* 1. Hero Welcome Area (Soft Educational Workspace) */}
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#FAFBF7] via-[#F4F9F6] to-[#F5FAFC] border border-[#ECEDEC] p-6 sm:p-7 shadow-[0_2px_12px_rgba(30,60,50,0.03)]">
        {/* Soft Organic Decorative Shapes */}
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full bg-[#E8F8F1]/50 pointer-events-none" />
        <div className="absolute bottom-0 right-48 -mb-6 w-20 h-20 rounded-full bg-[#FFF9E6]/60 pointer-events-none" />
        <div className="absolute top-8 right-24 w-6 h-6 rounded-full bg-[#FBE8E2]/60 pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-4">
          <div>
            {/* Soft Pastel Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/50 mb-3 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#55B38F]" />
              2026 – 2027
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#121314] tracking-tight">
              Chào buổi sáng, {displayName}! ☀️
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-[#606363] leading-relaxed">
              Chúc thầy cô và các bé một ngày học tập, vui chơi an toàn và tràn ngập niềm vui. Dưới đây là các chỉ số vận hành tổng quan trong ngày của nhà trường.
            </p>
          </div>

          {/* Quick Actions (Pill Controls đặt ngay dưới mô tả) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/users"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#55B38F] hover:bg-[#1A624C] text-white shadow-sm shadow-[#55B38F]/20 transition-all hover:scale-[1.02]"
            >
              <span>Quản lý tài khoản</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/classes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-[#FEFEFE] hover:bg-[#F8F8F9] text-[#121314] border border-[#ECEDEC] shadow-2xs transition-all hover:scale-[1.02]"
            >
              <span>Xếp lớp học</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. KPI Summary Cards (Nghiệp vụ Mầm non Hành động & Dữ liệu Thực tế) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* KPI Card 1: Mint Pastel - Sĩ số học sinh toàn trường */}
        <div className="p-5 rounded-3xl bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-[#E8F8F1] text-[#55B38F] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/40">
              62.2% sức chứa
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9FA2A1]">
              Sĩ số học sinh toàn trường
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-[#121314]">28</span>
              <span className="text-xs text-[#9FA2A1]">/ 45 trẻ tối đa</span>
            </div>
          </div>
          <p className="text-[11px] text-[#606363] flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#55B38F]" />
            Mới nhập học: +2 bé • Nghỉ học: 0
          </p>
        </div>

        {/* KPI Card 2: Baby Blue Pastel - Điểm danh sáng nay */}
        <div className="p-5 rounded-3xl bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-[#EAF7FC] text-[#71C8E4] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/40">
              100% có mặt
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9FA2A1]">
              Điểm danh sáng nay
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-[#121314]">28</span>
              <span className="text-xs text-[#9FA2A1]">/ 28 trẻ có mặt</span>
            </div>
          </div>
          <p className="text-[11px] text-[#606363] flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#55B38F]" />
            3/3 lớp đã điểm danh (Lớp Chồi: Bảo mẫu hỗ trợ)
          </p>
        </div>

        {/* KPI Card 3: Peach / Coral Pastel - Y tế & Suất ăn hôm nay (Thay thế thẻ cơ cấu lớp) */}
        <div className="p-5 rounded-3xl bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-[#FBE8E2] text-[#E8916E] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FBE8E2] text-[#8A4F42] border border-[#FAC4CD]/50">
              Đã chốt bếp
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9FA2A1]">
              Y tế & Suất ăn hôm nay
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-[#121314]">28</span>
              <span className="text-xs text-[#9FA2A1]">/ 28 suất báo ăn</span>
            </div>
          </div>
          <p className="text-[11px] text-[#606363] flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E8916E]" />
            Y tế: 1 bé uống thuốc • 1 bé theo dõi
          </p>
        </div>

        {/* KPI Card 4: Warm Yellow / Cream Pastel - Học phí & Dòng tiền thực thu */}
        <div className="p-5 rounded-3xl bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
          <div className="flex items-center justify-between">
            <div className="w-11 h-11 rounded-2xl bg-[#FFF9E6] text-[#E0A800] flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF9E6] text-[#7A5B00] border border-[#FFF3DD]">
              Đã thu 94.1%
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#9FA2A1]">
              Học phí tháng này (Đã thu)
            </p>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-[#121314]">118 tr ₫</span>
              <span className="text-xs text-[#9FA2A1]">/ 125,4 tr dự thu</span>
            </div>
          </div>
          <p className="text-[11px] text-[#606363] flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E0A800]" />
            Đã thu: 25/28 bé (118 tr) • Tồn đọng: 3 bé (7,4 tr)
          </p>
        </div>
      </div>

      {/* 3. Actionable Tasks + School Operations (Biến Dashboard thành nơi biết việc cần làm) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Column (2 spans): Việc cần xử lý hôm nay (Actionable Tasks) */}
        <div className="lg:col-span-2 p-6 sm:p-7 rounded-[26px] bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-5">
          <div className="flex items-center justify-between border-b border-[#F3F4F3] pb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-[#E8916E] animate-pulse" />
              <h3 className="text-base font-bold text-[#121314]">
                Việc cần xử lý hôm nay
              </h3>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#FFF0F2] text-[#E8916E] border border-[#FAC4CD]/60">
              2 việc cần ưu tiên
            </span>
          </div>

          {/* Actionable Tasks List */}
          <div className="space-y-3">
            {/* Task 1: Chưa phân công GVCN chính thức */}
            <div className="p-4 rounded-2xl bg-[#FFF9F6] border border-[#FAC4CD]/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FFF0EB] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FBE8E2] text-[#E8916E] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  ⚠️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#121314]">Chưa phân công GVCN chính thức cho Lớp Chồi</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FBE8E2] text-[#8A4F42]">
                      Cần xử lý
                    </span>
                  </div>
                  <p className="text-xs text-[#606363] mt-0.5">
                    Lớp hiện do Bảo mẫu (Cô Đặng Kim Chi) tạm thời nhận lớp và đã điểm danh đón 9 trẻ an toàn. BGH cần sớm phân công GVCN chính thức phụ trách chuyên môn.
                  </p>
                </div>
              </div>
              <Link
                href="/classes"
                className="self-end sm:self-center px-4 py-1.5 rounded-full text-xs font-semibold bg-[#E8916E] text-white hover:bg-[#D96B43] transition-all shadow-2xs whitespace-nowrap"
              >
                Phân công GV ngay →
              </Link>
            </div>

            {/* Task 2: Học phí chưa thu */}
            <div className="p-4 rounded-2xl bg-[#FAFBF7] border border-[#ECEDEC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F4F9F6] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#FFF9E6] text-[#E0A800] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  💰
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#121314]">2 Khoản học phí tháng 09 còn tồn đọng</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#FFF9E6] text-[#7A5B00]">
                      7.400.000 ₫
                    </span>
                  </div>
                  <p className="text-xs text-[#606363] mt-0.5">
                    Hóa đơn của Bé Tuệ Nhi (Lớp Mầm) và Bé Minh Khôi (Lớp Lá) chưa ghi nhận thanh toán.
                  </p>
                </div>
              </div>
              <span className="self-end sm:self-center px-3.5 py-1.5 rounded-full text-xs font-semibold bg-[#F3F4F3] text-[#606363] cursor-default whitespace-nowrap">
                Kế toán phụ trách
              </span>
            </div>

            {/* Task 3: Điểm danh buổi sáng của 3 lớp đã hoàn thành */}
            <div className="p-4 rounded-2xl bg-[#FAFBF7] border border-[#ECEDEC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#F4F9F6] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#EAF7FC] text-[#71C8E4] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                  📋
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-[#121314]">3 / 3 Khối lớp đã hoàn tất chốt điểm danh đón trẻ</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C]">
                      28 / 28 trẻ có mặt
                    </span>
                  </div>
                  <p className="text-xs text-[#606363] mt-0.5">
                    Tất cả các khối lớp đã hoàn thành đối chiếu người đón và chốt báo suất ăn với bếp đúng quy định trước 08:30.
                  </p>
                </div>
              </div>
              <span className="self-end sm:self-center text-xs font-bold text-[#55B38F] whitespace-nowrap">
                ✓ Hoàn thành
              </span>
            </div>
          </div>
        </div>

        {/* Right Rail: Tình trạng 3 Khối lớp mầm non (Đồng nhất sức chứa 15 trẻ/lớp) */}
        <div className="p-6 sm:p-7 rounded-[26px] bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-4">
          <div className="flex items-center justify-between border-b border-[#F3F4F3] pb-4">
            <div>
              <h3 className="text-base font-bold text-[#121314]">
                3 Khối lớp học
              </h3>
              <p className="text-[11px] text-[#9FA2A1]">Định mức: 15 trẻ / lớp</p>
            </div>
            <Link
              href="/classes"
              className="text-xs font-semibold text-[#55B38F] hover:text-[#1A624C] transition-colors"
            >
              Quản lý lớp →
            </Link>
          </div>

          <div className="space-y-3">
            {/* Lớp Mầm */}
            <div className="p-3.5 rounded-2xl bg-[#F8F8F9] border border-[#ECEDEC] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌱</span>
                  <span className="font-bold text-sm text-[#121314]">Lớp Mầm (3–4 tuổi)</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C]">
                  10 / 15 trẻ
                </span>
              </div>
              <p className="text-xs text-[#606363]">
                GVCN: <strong className="text-[#121314]">Cô Nguyễn Thị Lan</strong>
              </p>
            </div>

            {/* Lớp Chồi */}
            <div className="p-3.5 rounded-2xl bg-[#FFF9F6] border border-[#FAC4CD]/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌿</span>
                  <span className="font-bold text-sm text-[#121314]">Lớp Chồi (4–5 tuổi)</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FBE8E2] text-[#8A4F42]">
                  9 / 15 trẻ
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#E8916E] font-medium">Chưa có GVCN</span>
                <Link href="/classes" className="text-xs font-bold text-[#E8916E] underline hover:text-[#D96B43]">Gán ngay</Link>
              </div>
            </div>

            {/* Lớp Lá */}
            <div className="p-3.5 rounded-2xl bg-[#F8F8F9] border border-[#ECEDEC] space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm">🌸</span>
                  <span className="font-bold text-sm text-[#121314]">Lớp Lá (5–6 tuổi)</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C]">
                  9 / 15 trẻ
                </span>
              </div>
              <p className="text-xs text-[#606363]">
                GVCN: <strong className="text-[#121314]">Cô Trần Thị Mai</strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
