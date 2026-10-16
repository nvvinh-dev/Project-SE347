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
    dataUpdatedAt,
  } = useDashboardOverview();

  // Tính toán số liệu phân bổ 3 lớp
  const mamClass = overview?.classes.find((c) => c.className.includes("Mầm"));
  const choiClass = overview?.classes.find((c) => c.className.includes("Chồi"));
  const laClass = overview?.classes.find((c) => c.className.includes("Lá"));

  const assignedRatio =
    overview && overview.totalStudents > 0
      ? Math.round((overview.assignedStudents / overview.totalStudents) * 100)
      : 0;

  // Lớp chưa có giáo viên chủ nhiệm
  const classesWithoutTeacher = overview?.classes.filter((c) => !c.homeroomTeacherName) ?? [];
  const hasOperationalIssues = (overview?.unassignedStudents ?? 0) > 0 || classesWithoutTeacher.length > 0;

  return (
    <div className="space-y-5 sm:space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Tinh gọn (Giảm 35-40% chiều cao, tích hợp Quick Actions mượt mà) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#FAFBF7] via-[#F4F9F6] to-[#F5FAFC] border border-[#ECEDEC] p-4 sm:p-5 shadow-[0_2px_10px_rgba(30,60,50,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/50">
                <span className="w-1.5 h-1.5 rounded-full bg-[#55B38F]" />
                Năm học 2026 – 2027
              </span>
              <span className="text-xs text-muted font-medium flex items-center gap-1.5 flex-wrap">
                <span>
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
                {overview && dataUpdatedAt ? (
                  <>
                    <span>•</span>
                    <span className="text-[11px] text-muted-dark">
                      Đồng bộ dữ liệu lúc{" "}
                      {new Date(dataUpdatedAt).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </>
                ) : null}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
              Chào buổi sáng, {displayName}! ☀️
            </h2>
            <p className="text-xs text-muted">
              Tổng quan tình hình học sinh, phân công lớp học và nhân sự vận hành nhà trường.
            </p>
          </div>

          {/* Quick Actions gọn gàng trên Desktop */}
          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-brand hover:bg-brand-hover active:bg-brand-active text-white shadow-2xs transition-all hover:scale-[1.02]"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
              <span>Tạo tài khoản</span>
            </Link>
            <Link
              href="/admin/classes"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-card hover:bg-[#F8F8F9] text-foreground border border-border shadow-2xs transition-all hover:scale-[1.02]"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
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
        <div className="space-y-5 sm:space-y-6">
          {/* 3. Trung tâm Cảnh báo Vận hành (Hành động Admin cần xử lý hôm nay) */}
          {hasOperationalIssues ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FFF9E6] border border-[#FBE083] text-[#8C6D00] shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A05E03]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Nhiệm vụ vận hành cần xử lý ngay</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {overview.unassignedStudents > 0 ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/90 border border-[#FBE083]/70">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>
                        Còn <strong className="text-amber-800 font-bold">{overview.unassignedStudents} trẻ</strong> chưa được xếp vào lớp.
                      </span>
                    </div>
                    <Link
                      href="/admin/classes"
                      className="px-3 py-1 rounded-full text-[11px] font-bold text-brand bg-brand-subtle hover:bg-brand/15 transition-all shrink-0 ml-2"
                    >
                      Xếp lớp ngay →
                    </Link>
                  </div>
                ) : null}

                {classesWithoutTeacher.length > 0 ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/90 border border-[#FBE083]/70">
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span>
                        Có <strong className="text-rose-700 font-bold">{classesWithoutTeacher.length} lớp</strong> chưa có GVCN:{" "}
                        <span className="text-muted">{classesWithoutTeacher.map((c) => c.className).join(", ")}</span>.
                      </span>
                    </div>
                    <Link
                      href="/admin/classes"
                      className="px-3 py-1 rounded-full text-[11px] font-bold text-brand bg-brand-subtle hover:bg-brand/15 transition-all shrink-0 ml-2"
                    >
                      Phân công ngay →
                    </Link>
                  </div>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3.5 px-4 rounded-2xl bg-[#E8F8F1] border border-[#A7E5D2]/60 text-[#1A624C] text-xs font-semibold shadow-2xs">
              <span className="text-base">✨</span>
              <span>
                <strong>Tình trạng vận hành lý tưởng:</strong> 100% học sinh đã được phân lớp và toàn bộ 3 khối lớp đã có giáo viên chủ nhiệm phụ trách.
              </span>
            </div>
          )}

          {/* 4. 4 Thẻ KPI Thực tế & Có Dữ liệu Hành động (Thay thế toàn bộ mock placeholder) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {/* KPI 1: Mint Pastel - Sĩ số học sinh toàn trường */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#E8F8F1] text-brand flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                {overview.unassignedStudents === 0 ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/50">
                    ✓ 100% đã vào lớp
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF9E6] text-amber-800 border border-amber-300">
                    ⚠ {overview.unassignedStudents} chưa xếp
                  </span>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Sĩ số học sinh toàn trường
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">{overview.totalStudents}</span>
                  <span className="text-xs text-muted">trẻ nhập học</span>
                </div>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                <span>{overview.assignedStudents} đã xếp lớp • {overview.unassignedStudents} chờ xếp</span>
              </p>
            </div>

            {/* KPI 2: Warm Pastel - Tỷ lệ hoàn thành xếp lớp */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF9E6] text-[#D48806] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFF9E6] text-[#8C6D00] border border-[#FBE083]/60">
                  {overview.assignedStudents}/{overview.totalStudents} trẻ
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Tỷ lệ trẻ đã xếp lớp
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">{assignedRatio}%</span>
                  <span className="text-xs text-muted">hoàn thành</span>
                </div>
              </div>
              {/* Mini progress bar */}
              <div className="space-y-1 pt-1 border-t border-[#F3F4F3]">
                <div className="w-full h-1.5 rounded-full bg-[#F3F4F3] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#E0A800] transition-all duration-500"
                    style={{ width: `${assignedRatio}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI 3: Peach Pastel - Tình trạng Giáo viên chủ nhiệm */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#FBE8E2] text-[#E8916E] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                  </svg>
                </div>
                {classesWithoutTeacher.length === 0 ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/50">
                    ✓ Đủ 3/3 GVCN
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FBE8E2] text-[#8A4F42] border border-[#FAC4CD]/60">
                    {overview.classesWithTeacherCount}/{overview.totalClasses} lớp đã có GVCN
                  </span>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Phân công chủ nhiệm
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">{overview.classesWithTeacherCount}</span>
                  <span className="text-xs text-muted">/ {overview.totalClasses} lớp có GVCN</span>
                </div>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E8916E]" />
                <span>Mầm: {mamClass?.studentCount ?? 0} • Chồi: {choiClass?.studentCount ?? 0} • Lá: {laClass?.studentCount ?? 0}</span>
              </p>
            </div>

            {/* KPI 4: Baby Blue Pastel - Đội ngũ nhân sự */}
            <div className="p-5 rounded-3xl bg-card border border-border shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF7FC] text-[#71C8E4] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7FC] text-[#17627D] border border-[#D5E3F2]">
                  Đang hoạt động
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Đội ngũ nhân sự
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">{overview.activeStaffCount}</span>
                  <span className="text-xs text-muted">nhân viên & giáo viên</span>
                </div>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-[#F3F4F3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#71C8E4]" />
                <span>BGH, Giáo viên, Kế toán, Y tế</span>
              </p>
            </div>
          </div>

          {/* 5. Chi tiết Phân bổ 3 Khối Lớp Học (FR-DASH-02, AC-DASH-02) */}
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
                          <span>Tỷ trọng học sinh toàn trường</span>
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
