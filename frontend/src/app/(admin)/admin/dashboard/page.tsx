"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useChildrenStatistics } from "@/hooks/useDashboard";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatusMessage } from "@/components/ui/StatusMessage";

const emptySubscribe = () => () => {};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const displayName = user?.fullName?.trim() ? user.fullName : "Quản trị viên";

  const {
    data: stats,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useChildrenStatistics();

  // Chuẩn React 19: dùng useSyncExternalStore để phân định client/server nhất quán, không gây cascading render
  const isClient = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  // Xác định thời điểm và lời chào động (chỉ tính toán chi tiết sau khi client đã mount)
  const now = React.useMemo(() => new Date(), []);
  const currentHour = now.getHours();
  const greeting = isClient
    ? currentHour < 12
      ? "Chào buổi sáng"
      : currentHour < 18
        ? "Chào buổi chiều"
        : "Chào buổi tối"
    : "Xin chào";

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const schoolYear =
    currentMonth >= 9
      ? `${currentYear} – ${currentYear + 1}`
      : `${currentYear - 1} – ${currentYear}`;

  const assignedRatio =
    stats && stats.totalStudents > 0
      ? Math.round((stats.assignedStudents / stats.totalStudents) * 100)
      : 0;

  const hasUnassignedChildren = (stats?.unassignedStudents ?? 0) > 0;

  // Sắp xếp danh sách lớp ổn định theo minAgeMonths tăng dần để bảo đảm gán theme màu và icon luôn nhất quán
  const sortedClasses = (stats?.classes ?? []).slice().sort(
    (a, b) => (a.minAgeMonths ?? 0) - (b.minAgeMonths ?? 0)
  );

  // Cấu hình theme visual cho các khối lớp theo thứ tự độ tuổi tăng dần (Mầm, Chồi, Lá)
  const classThemes = [
    {
      badgeBg: "bg-brand-subtle",
      badgeText: "text-brand-text",
      badgeBorder: "border-brand-border",
      barColor: "bg-brand",
      icon: "🌱",
    },
    {
      badgeBg: "bg-success-bg",
      badgeText: "text-success",
      badgeBorder: "border-success-border",
      barColor: "bg-success",
      icon: "🌿",
    },
    {
      badgeBg: "bg-warning-bg",
      badgeText: "text-warning",
      badgeBorder: "border-warning-border",
      barColor: "bg-warning",
      icon: "🍃",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header chuẩn đồng bộ với các trang Admin khác */}
      <PageHeader
        title="Tổng quan"
        description="Tổng quan tình hình học sinh và cơ cấu phân bổ các khối lớp học"
      >
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand hover:bg-brand-hover text-white shadow-2xs transition-all"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            <span>Tạo tài khoản</span>
          </Link>
          <Link
            href="/admin/classes"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-card hover:bg-background text-foreground border border-border shadow-2xs transition-all"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Xếp lớp học</span>
          </Link>
        </div>
      </PageHeader>

      {/* 2. Welcome Banner mềm mại */}
      <div className="rounded-2xl bg-card border border-border p-4 sm:p-5 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              suppressHydrationWarning
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-subtle text-brand-text border border-brand-border shrink-0 whitespace-nowrap"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              Năm học {schoolYear}
            </span>
            <span className="text-xs text-muted font-medium flex items-center gap-1.5 flex-wrap">
              {isClient ? (
                <span>
                  {now.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </span>
              ) : null}
              {isClient && stats && dataUpdatedAt ? (
                <>
                  <span>•</span>
                  <span className="text-[11px] text-muted">
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

          <h2
            suppressHydrationWarning
            className="text-xl sm:text-2xl font-bold text-foreground tracking-tight pt-1"
          >
            {greeting}, {displayName}! ☀️
          </h2>
          <p className="text-xs text-muted">
            Theo dõi sĩ số học sinh và tiến độ phân bổ vào các khối lớp mầm non.
          </p>
        </div>
      </div>

      {/* 3. Loading / Error / Data View */}
      {isLoading ? (
        <div className="p-12 text-center">
          <StatusMessage status="loading" message="Đang tải dữ liệu tổng quan..." />
        </div>
      ) : isError ? (
        <div className="p-8 text-center space-y-4 rounded-2xl bg-card border border-border">
          <div className="p-4 rounded-xl bg-danger-bg border border-danger-border text-danger text-xs font-medium inline-block max-w-lg">
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
      ) : stats ? (
        <div className="space-y-6">
          {/* 4. Trung tâm Cảnh báo Nhiệm vụ */}
          {hasUnassignedChildren ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-warning-bg border border-warning-border text-foreground shadow-2xs space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-warning">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>Nhiệm vụ cần xử lý ngay</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-xl bg-card border border-warning-border text-xs">
                <div className="flex items-center gap-2 text-foreground font-medium">
                  <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                  <span>
                    Còn{" "}
                    <strong className="text-warning font-bold">
                      {stats.unassignedStudents} trẻ
                    </strong>{" "}
                    chưa được xếp vào lớp học.
                  </span>
                </div>
                <Link
                  href="/admin/classes"
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold text-brand bg-brand-subtle hover:bg-brand/15 border border-brand-border transition-all self-start sm:self-auto shrink-0"
                >
                  Xếp lớp ngay →
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2.5 p-3.5 px-4 rounded-2xl bg-brand-subtle border border-brand-border text-brand-text text-xs font-semibold shadow-2xs">
              <span className="text-base">✨</span>
              <span>
                <strong>Tình trạng vận hành:</strong>{" "}
                {stats.totalStudents > 0
                  ? "100% học sinh đã được phân bổ vào các khối lớp học."
                  : "Hệ thống đã sẵn sàng tiếp nhận và phân bổ học sinh vào các lớp học."}
              </span>
            </div>
          )}

          {/* 5. Bộ 3 Thẻ KPI Thống kê Số lượng Trẻ (Thuộc phạm vi FR-DASH-02, BR-DASHBOARD-02) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {/* KPI 1: Mint Pastel - Sĩ số học sinh toàn trường */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-brand-subtle text-brand flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </svg>
                </div>
                {stats.totalStudents === 0 ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-background text-muted border border-border">
                    Chưa có học sinh
                  </span>
                ) : stats.unassignedStudents === 0 ? (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand-text border border-brand-border">
                    ✓ 100% đã xếp lớp
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-warning-bg text-warning border border-warning-border">
                    ⚠ {stats.unassignedStudents} chờ xếp
                  </span>
                )}
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Sĩ số học sinh toàn trường
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">
                    {stats.totalStudents}
                  </span>
                  <span className="text-xs text-muted">học sinh</span>
                </div>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                <span>
                  {stats.assignedStudents} đã xếp lớp • {stats.unassignedStudents} chờ xếp
                </span>
              </p>
            </div>

            {/* KPI 2: Warm Pastel - Tỷ lệ trẻ đã xếp lớp */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-warning-bg text-warning flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-warning-bg text-warning border border-warning-border">
                  {stats.assignedStudents}/{stats.totalStudents} học sinh
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Tỷ lệ trẻ đã xếp lớp
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">
                    {assignedRatio}%
                  </span>
                  <span className="text-xs text-muted">
                    {stats.totalStudents > 0 ? "hoàn thành" : "chưa có học sinh"}
                  </span>
                </div>
              </div>
              {/* Thanh tiến trình mini */}
              <div className="space-y-1 pt-1 border-t border-border">
                <div className="w-full h-1.5 rounded-full bg-background overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning transition-all duration-500"
                    style={{ width: `${assignedRatio}%` }}
                  />
                </div>
              </div>
            </div>

            {/* KPI 3: Peach Pastel - Học sinh chờ phân lớp */}
            <div className="p-5 rounded-2xl bg-card border border-border shadow-2xs space-y-3.5 hover:-translate-y-0.5 transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-danger-bg text-danger flex items-center justify-center">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <span
                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                    stats.unassignedStudents === 0
                      ? "bg-brand-subtle text-brand-text border-brand-border"
                      : "bg-danger-bg text-danger border-danger-border"
                  }`}
                >
                  {stats.unassignedStudents === 0 ? "✓ Hoàn tất" : "Cần xếp lớp"}
                </span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted">
                  Học sinh chờ xếp lớp
                </p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-extrabold text-foreground">
                    {stats.unassignedStudents}
                  </span>
                  <span className="text-xs text-muted">học sinh</span>
                </div>
              </div>
              <p className="text-[11px] text-muted flex items-center gap-1.5 pt-1 border-t border-border">
                <span className="w-1.5 h-1.5 rounded-full bg-danger" />
                <span>Phân bổ vào {stats.totalClasses} khối lớp cố định</span>
              </p>
            </div>
          </div>

          {/* 6. Chi tiết Phân bổ Các Khối Lớp Học (FR-DASH-02, AC-DASH-02, BR-DASHBOARD-02) */}
          <div className="p-5 sm:p-6 rounded-2xl bg-card border border-border shadow-2xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Phân bổ học sinh theo từng lớp học
                </h3>
                <p className="text-xs text-muted mt-0.5">
                  Thống kê số lượng học sinh của {stats.totalClasses} khối lớp mầm non cố định
                </p>
              </div>

              <Link
                href="/admin/classes"
                className="px-4 py-2 rounded-full text-xs font-semibold text-brand hover:bg-brand-subtle border border-brand-border hover:border-brand transition-all self-start sm:self-auto"
              >
                Quản lý xếp lớp →
              </Link>
            </div>

            {/* Grid Card Lớp chi tiết (chọn theme và độ tuổi theo dữ liệu backend) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {sortedClasses.map((cls, index) => {
                const theme = classThemes[index % classThemes.length];
                const ageLabel =
                  cls.minAgeMonths != null && cls.maxAgeMonths != null
                    ? `${cls.minAgeMonths} ≤ tuổi < ${cls.maxAgeMonths} tháng`
                    : "Theo độ tuổi quy định";

                const percentage =
                  stats.totalStudents > 0
                    ? Math.round((cls.studentCount / stats.totalStudents) * 100)
                    : 0;

                return (
                  <div
                    key={cls.classId}
                    className="p-5 rounded-xl bg-background/50 border border-border shadow-2xs space-y-4 hover:border-border-hover transition-all"
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
                        <span className="text-xs text-muted"> học sinh</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-muted font-medium block">
                        Độ tuổi: {ageLabel}
                      </span>

                      {/* Thanh phân bổ tỷ trọng phần trăm */}
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[11px] text-muted">
                          <span>Tỷ trọng học sinh toàn trường</span>
                          <span className="font-bold text-foreground">{percentage}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                          <div
                            className={`h-full rounded-full ${theme.barColor} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
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
