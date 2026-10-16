"use client";

import React from "react";
import type { ClassResponse } from "@/types/class";

interface ClassCardProps {
  classInfo: ClassResponse;
  studentCount: number;
  isSelected: boolean;
  onSelect: () => void;
  onAssignTeacher: () => void;
  onRemoveTeacher: () => void;
}

export function ClassCard({
  classInfo,
  studentCount,
  isSelected,
  onSelect,
  onAssignTeacher,
  onRemoveTeacher,
}: ClassCardProps) {
  // Xác định giao diện màu sắc theo từng khối lớp (bám sát UI_DESIGN_GUIDELINES.md §7.6.2)
  const isMam = classInfo.name.includes("Mầm");
  const isChoi = classInfo.name.includes("Chồi");

  const theme = isMam
    ? {
      badgeBg: "bg-[#E8F8F1]",
      badgeText: "text-[#1A624C]",
      badgeBorder: "border-[#A7E5D2]/60",
      accentBg: "bg-[#55B38F]",
      borderHover: "hover:border-[#55B38F]/50",
      icon: "🌱",
      ageLabel: "3 – 4 Tuổi",
      ageRangeFormula: "36 ≤ tuổi < 48 tháng",
      tooltipText: "Bao gồm trẻ từ đủ 36 tháng đến dưới 48 tháng tuổi. Tròn 48 tháng thuộc Lớp Chồi.",
    }
    : isChoi
      ? {
        badgeBg: "bg-[#EAF7FC]",
        badgeText: "text-[#17627D]",
        badgeBorder: "border-[#D5E3F2]",
        accentBg: "bg-[#71C8E4]",
        borderHover: "hover:border-[#71C8E4]/50",
        icon: "🌿",
        ageLabel: "4 – 5 Tuổi",
        ageRangeFormula: "48 ≤ tuổi < 60 tháng",
        tooltipText: "Bao gồm trẻ từ đủ 48 tháng đến dưới 60 tháng tuổi. Tròn 60 tháng thuộc Lớp Lá.",
      }
      : {
        badgeBg: "bg-[#FBE8E2]",
        badgeText: "text-[#8A4F42]",
        badgeBorder: "border-[#FAC4CD]/60",
        accentBg: "bg-[#E8916E]",
        borderHover: "hover:border-[#E8916E]/50",
        icon: "🍃",
        ageLabel: "5 – 6 Tuổi",
        ageRangeFormula: "60 ≤ tuổi < 72 tháng",
        tooltipText: "Bao gồm trẻ từ đủ 60 tháng đến dưới 72 tháng tuổi. Trẻ đủ 72 tháng thuộc diện ra trường.",
      };

  const hasTeacher = Boolean(classInfo.homeroomTeacher);

  return (
    <div
      className={`relative p-5 rounded-3xl bg-[#FEFEFE] border transition-all duration-200 flex flex-col justify-between shadow-[0_2px_8px_rgba(30,60,50,0.03)] hover:shadow-[0_8px_24px_rgba(30,60,50,0.06)] hover:-translate-y-0.5 ${isSelected
        ? "border-brand ring-2 ring-brand/20 shadow-sm"
        : `border-[#ECEDEC] ${theme.borderHover}`
        }`}
    >
      <div className="space-y-4">
        {/* Header: Nhóm tuổi & Sĩ số */}
        <div className="flex items-start justify-between gap-2">
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder}`}
          >
            <span>{theme.icon}</span>
            <span>{theme.ageLabel}</span>
          </span>

          <div className="text-right shrink-0">
            <span className="text-sm font-bold text-foreground">{studentCount}</span>
            <span className="text-xs text-muted"> trẻ</span>
          </div>
        </div>

        {/* Tên Lớp & Quy tắc độ tuổi gọn gàng kèm Tooltip */}
        <div>
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-foreground">{classInfo.name}</h3>
            {/* Cảnh báo chưa đủ cấu hình nếu chưa có GVCN */}
            {!hasTeacher && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full shrink-0">
                <span>Chưa có GVCN</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-xs text-muted font-medium">
              {theme.ageRangeFormula}
            </span>
            {/* Tooltip giải thích quy tắc nửa mở [min, max) */}
            <div className="relative group inline-block">
              <button
                type="button"
                tabIndex={0}
                aria-label={`Giải thích quy tắc độ tuổi ${classInfo.name}`}
                className="text-muted hover:text-foreground text-[11px] font-bold cursor-help w-4 h-4 rounded-full inline-flex items-center justify-center bg-[#F3F4F3] hover:bg-[#E5E7EB] transition-colors"
              >
                ⓘ
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex group-focus-within:flex flex-col w-60 p-2.5 rounded-xl bg-foreground text-background text-[11px] leading-relaxed shadow-lg z-30 pointer-events-none animate-in fade-in duration-150">
                <span className="font-bold mb-0.5 text-[#C6E495]">Quy tắc nửa mở:</span>
                <span>{theme.tooltipText}</span>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
              </div>
            </div>
          </div>
        </div>

        {/* Khối Giáo viên Chủ nhiệm (GVCN) */}
        <div className="pt-2 border-t border-[#F3F4F3]">
          <div
            className={`flex items-center justify-between p-2.5 rounded-2xl border transition-colors ${hasTeacher
              ? "bg-[#FAFBF7] border-[#ECEDEC]"
              : "bg-amber-50/40 border-amber-200/60"
              }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${hasTeacher
                  ? "bg-brand-subtle text-brand border border-brand/20"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
                  }`}
              >
                {hasTeacher
                  ? classInfo.homeroomTeacher!.fullName.charAt(0).toUpperCase()
                  : "👩‍🏫"}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-muted uppercase font-bold tracking-wider block">
                  Giáo viên chủ nhiệm
                </span>
                <span className="text-xs font-bold text-foreground truncate block mt-0.5">
                  {hasTeacher ? (
                    classInfo.homeroomTeacher!.fullName
                  ) : (
                    <span className="text-amber-800 font-semibold">Chưa phân công</span>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              {hasTeacher ? (
                <>
                  <button
                    type="button"
                    onClick={onAssignTeacher}
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold text-brand hover:bg-brand-subtle border border-transparent hover:border-brand-subtle transition-all cursor-pointer"
                    title="Đổi giáo viên chủ nhiệm"
                  >
                    Đổi
                  </button>
                  <button
                    type="button"
                    onClick={onRemoveTeacher}
                    className="p-1 rounded-full text-muted hover:text-danger hover:bg-danger-bg transition-all cursor-pointer"
                    title="Gỡ giáo viên chủ nhiệm"
                    aria-label={`Gỡ giáo viên chủ nhiệm của ${classInfo.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.75}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onAssignTeacher}
                  className="px-3 py-1.5 rounded-full text-[11px] font-bold bg-[#E8916E] hover:bg-[#D96B43] text-white shadow-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <span>Phân công</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nút lọc xem danh sách */}
      <div className="pt-4 mt-3 border-t border-[#F3F4F3]/80">
        <button
          type="button"
          onClick={onSelect}
          className={`w-full py-2 px-3 rounded-full text-xs font-semibold border transition-all text-center flex items-center justify-center gap-1.5 ${isSelected
            ? "bg-brand text-white border-brand shadow-xs"
            : "bg-[#F8F8F9] text-[#606363] border-[#ECEDEC] hover:bg-brand-subtle hover:text-brand hover:border-brand-subtle"
            }`}
        >
          <span>Xem danh sách trẻ ({studentCount})</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
