"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useDashboardOverview } from "@/hooks/useDashboard";
import { StatusMessage } from "@/components/ui/StatusMessage";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() ? user.fullName : "Quản trị viên";

  const {
    data: overview,
    isLoading,
    isError,
    error,
    refetch,
  } = useDashboardOverview();

  // Tính toán số liệu phân bổ 3 lớp
  const mamClass = overview?.classes.find((c) => c.className.includes("Mầm"));
  const choiClass = overview?.classes.find((c) => c.className.includes("Chồi"));
  const laClass = overview?.classes.find((c) => c.className.includes("Lá"));

  const assignedRatio =
    overview && overview.totalStudents > 0
      ? Math.round((overview.assignedStudents / overview.totalStudents) * 100)
      : 0;

  return (
    <div className="space-y-6 sm:space-y-7 animate-in fade-in duration-300">
      {/* 1. Hero Welcome Area (Soft Educational Workspace - UI Guidelines §7.7) */}
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
              Năm học 2026 – 2027
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Chào buổi sáng, {displayName}! ☀️
            </h2>

            <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
              Chúc thầy cô và các bé một ngày học tập, vui chơi an toàn và tràn ngập niềm vui. Dưới đây là các chỉ số vận hành tổng quan trong ngày của nhà trường.
            </p>
          </div>

          {/* Quick Actions (Phím tắt nghiệp vụ đưa tới Quản lý tài khoản & Xếp lớp) */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-brand hover:bg-brand-hover active:bg-brand-active text-white shadow-sm shadow-brand/20 transition-all hover:scale-[1.02]"
            >
              <span>Quản lý tài khoản</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/admin/classes"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-semibold bg-card hover:bg-[#F8F8F9] text-foreground border border-border shadow-2xs transition-all hover:scale-[1.02]"
            >
              <span>Xếp lớp học</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Loading / Error / Data View */}
      {isLoading ? (
        <div className="p-12 text-center">
          <StatusMessage status="loading" message="Đang tải dữ liệu tổng quan..." />
        </div>
      ) : isError ? (
        <div className="p-8 text-center space-y-4 rounded-3xl bg-card border border-border">
          <div className="p-4 rounded-2xl bg-danger-bg border border-danger-border text-danger text-xs font-medium inline-block max-w-lg">
            <p className="font-bold">Không thể tải dữ liệu dashboard</p>
            <p className="mt-1">{error?.message ?? "Đã xảy ra lỗi khi kết nối máy chủ."}</p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => refetch()}
              className="px-4 py-2 rounded-full text-xs font-semibold bg-background hover:bg-card border border-border text-foreground transition-all cursor-pointer"
            >
              Thử tải lại
            </button>
          </div>
        </div>
      ) : overview ? (
        <div className="space-y-6 sm:space-y-7">
          {/* 3. KPI Summary Cards (4 Cards Grid theo chuẩn UI Guidelines §7.7) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* KPI Card 1: Mint Pastel - Sĩ số học sinh toàn trường (FR-DASH-02) */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#E8F8F1] text-brand flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/40">
                  {assignedRatio}% đã vào lớp
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Sĩ số học sinh toàn trường
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">{overview.totalStudents}</span>
                  <span className="text-xs text-muted">trẻ đang học</span>
                </div>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                <span>{overview.assignedStudents} đã xếp lớp • {overview.unassignedStudents} chờ xếp</span>
              </p>
            </div>

            {/* KPI Card 2: Peach Pastel - Cơ cấu 3 khối lớp (FR-DASH-02, thay thế thẻ Y tế) */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#FBE8E2] text-[#E8916E] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FBE8E2] text-[#8A4F42] border border-[#FAC4CD]/50">
                  3 khối cố định
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Cơ cấu lớp học
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">{overview.totalClasses}</span>
                  <span className="text-xs text-muted">lớp (Mầm, Chồi, Lá)</span>
                </div>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8916E]" />
                <span>Mầm: {mamClass?.studentCount ?? 0} • Chồi: {choiClass?.studentCount ?? 0} • Lá: {laClass?.studentCount ?? 0}</span>
              </p>
            </div>

            {/* KPI Card 3: Baby Blue Pastel - Đội ngũ nhân sự (FR-DASH-01) */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#EAF7FC] text-[#71C8E4] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FC] text-[#17627D] border border-[#D5E3F2]">
                  {overview.classesWithTeacherCount}/3 lớp có GVCN
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Nhân sự nhà trường
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">{overview.activeStaffCount}</span>
                  <span className="text-xs text-muted">nhân sự hoạt động</span>
                </div>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#71C8E4]" />
                <span>BGH, Giáo viên, Kế toán, Y tế</span>
              </p>
            </div>

            {/* KPI Card 4: Warm Yellow Pastel - Điểm danh & Học phí (Sẵn sàng cho Thẻ 7 & Thẻ 8) */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-2xl bg-[#FFF9E6] text-[#E0A800] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF9E6] text-[#8C6D00] border border-[#FBE083]/50">
                  Kỳ hiện tại
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Điểm danh & Học phí
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">Tháng 10</span>
                  <span className="text-xs text-muted">/ 2026</span>
                </div>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E0A800]" />
                <span>Chuẩn bị kết nối Thẻ 7 & Thẻ 8</span>
              </p>
            </div>
          </div>

          {/* 4. Chi tiết Phân bổ 3 Khối Lớp Học (FR-DASH-02, AC-DASH-02) */}
          <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[#F3F4F3] pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Phân bổ trẻ theo từng lớp học
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Thống kê số lượng trẻ và giáo viên chủ nhiệm của 3 khối lớp cố định
                </p>
              </div>

              <Link
                href="/admin/classes"
                className="px-4 py-2 rounded-full text-xs font-semibold text-brand hover:bg-brand-subtle border border-brand/30 hover:border-brand transition-all self-start sm:self-auto"
              >
                Quản lý xếp lớp →
              </Link>
            </div>

            {/* Grid 3 Card Lớp chi tiết */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {overview.classes.map((cls) => {
                const isMam = cls.className.includes("Mầm");
                const isChoi = cls.className.includes("Chồi");

                const theme = isMam
                  ? {
                      badgeBg: "bg-[#E8F8F1]",
                      badgeText: "text-[#1A624C]",
                      badgeBorder: "border-[#A7E5D2]/60",
                      barColor: "bg-[#55B38F]",
                      icon: "🌱",
                      ageFormula: "36 ≤ tuổi < 48 tháng",
                    }
                  : isChoi
                    ? {
                        badgeBg: "bg-[#EAF7FC]",
                        badgeText: "text-[#17627D]",
                        badgeBorder: "border-[#D5E3F2]",
                        barColor: "bg-[#71C8E4]",
                        icon: "🌿",
                        ageFormula: "48 ≤ tuổi < 60 tháng",
                      }
                    : {
                        badgeBg: "bg-[#FBE8E2]",
                        badgeText: "text-[#8A4F42]",
                        badgeBorder: "border-[#FAC4CD]/60",
                        barColor: "bg-[#E8916E]",
                        icon: "🍃",
                        ageFormula: "60 ≤ tuổi < 72 tháng",
                      };

                const percentage =
                  overview.totalStudents > 0
                    ? Math.round((cls.studentCount / overview.totalStudents) * 100)
                    : 0;

                return (
                  <div
                    key={cls.classId}
                    className="p-5 rounded-2xl bg-[#FEFEFE] border border-border shadow-2xs space-y-4 hover:border-border/80 transition-all"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
                      >
                        <span>{theme.icon}</span>
                        <span>{cls.className}</span>
                      </span>

                      <div className="text-right">
                        <span className="text-sm font-bold text-foreground">
                          {cls.studentCount}
                        </span>
                        <span className="text-xs text-muted"> trẻ</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted font-medium block">
                        Độ tuổi: {theme.ageFormula}
                      </span>

                      {/* Thanh phân bổ tỷ lệ phần trăm */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[11px] text-muted">
                          <span>Chiếm tỷ lệ</span>
                          <span className="font-bold text-foreground">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#F3F4F3] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${theme.barColor} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Giáo viên chủ nhiệm */}
                    <div className="pt-3 border-t border-[#F3F4F3] flex items-center justify-between text-xs">
                      <span className="text-muted">GV Chủ nhiệm:</span>
                      <span className="font-bold text-foreground">
                        {cls.homeroomTeacherName ? (
                          cls.homeroomTeacherName
                        ) : (
                          <span className="text-amber-800 font-semibold text-[11px]">
                            Chưa phân công
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
