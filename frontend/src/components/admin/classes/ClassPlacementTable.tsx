"use client";

import React, { useState, useMemo } from "react";
import { Pagination } from "@/components/ui/Pagination";
import { calculateAgeInMonths, formatDate, formatAgeFriendly } from "@/lib/classAge";
import type { ClassPlacementResponse } from "@/types/class";

interface ClassPlacementTableProps {
  placements: ClassPlacementResponse[];
  selectedClassFilter: string;
  onFilterChange: (filter: string) => void;
  onOpenAssignModal: (placement: ClassPlacementResponse) => void;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 10;

export function ClassPlacementTable({
  placements,
  selectedClassFilter,
  onFilterChange,
  onOpenAssignModal,
  isLoading = false,
}: ClassPlacementTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // Đếm số lượng trẻ theo từng phân loại lớp
  const counts = useMemo(() => {
    let unassigned = 0;
    let mam = 0;
    let choi = 0;
    let la = 0;

    for (const p of placements) {
      if (!p.classId) unassigned++;
      else if (p.className?.includes("Mầm")) mam++;
      else if (p.className?.includes("Chồi")) choi++;
      else if (p.className?.includes("Lá")) la++;
    }

    return {
      all: placements.length,
      unassigned,
      mam,
      choi,
      la,
    };
  }, [placements]);

  // Bộ lọc theo tab và từ khóa tìm kiếm
  const filteredPlacements = useMemo(() => {
    return placements.filter((p) => {
      // Lọc theo lớp
      let matchClass = true;
      if (selectedClassFilter === "UNASSIGNED") {
        matchClass = p.classId === null;
      } else if (selectedClassFilter === "Lớp Mầm") {
        matchClass = p.className?.includes("Mầm") ?? false;
      } else if (selectedClassFilter === "Lớp Chồi") {
        matchClass = p.className?.includes("Chồi") ?? false;
      } else if (selectedClassFilter === "Lớp Lá") {
        matchClass = p.className?.includes("Lá") ?? false;
      }

      // Lọc theo từ khóa tìm kiếm
      const matchSearch = searchTerm.trim() === "" ||
        p.fullName.toLowerCase().includes(searchTerm.trim().toLowerCase());

      return matchClass && matchSearch;
    });
  }, [placements, selectedClassFilter, searchTerm]);

  // Phân trang
  const paginatedPlacements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPlacements.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPlacements, currentPage]);

  const filterTabs = [
    { label: "Tất cả", count: counts.all, value: "ALL", dotColor: null },
    { label: "Chờ xếp lớp", count: counts.unassigned, value: "UNASSIGNED", dotColor: "bg-amber-500" },
    { label: "Lớp Mầm", count: counts.mam, value: "Lớp Mầm", dotColor: "bg-[#55B38F]" },
    { label: "Lớp Chồi", count: counts.choi, value: "Lớp Chồi", dotColor: "bg-[#71C8E4]" },
    { label: "Lớp Lá", count: counts.la, value: "Lớp Lá", dotColor: "bg-[#E8916E]" },
  ];

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-5">
      {/* Header Danh sách & Bộ lọc */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#F3F4F3] pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground">Danh sách trẻ</h3>
        </div>

        {/* Search + Filter Tabs */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Tìm theo tên bé..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full h-9 pl-9 pr-3 rounded-full bg-[#F8F8F9] border border-[#ECEDEC] text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
            />
            <svg
              className="w-4 h-4 text-muted absolute left-3 top-2.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Tabs bộ lọc */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {filterTabs.map((tab) => {
              const isActive = selectedClassFilter === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => {
                    onFilterChange(tab.value);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${isActive
                    ? "bg-brand text-white shadow-xs"
                    : "bg-[#F8F8F9] text-[#606363] hover:bg-[#ECEDEC] hover:text-foreground"
                    }`}
                >
                  {tab.dotColor && (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${isActive ? "bg-white" : tab.dotColor
                        }`}
                    />
                  )}
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${isActive
                        ? "bg-white/20 text-white"
                        : "bg-[#ECECEC] text-[#606363]"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bảng Dữ liệu Trẻ */}
      <div className="overflow-x-auto rounded-2xl border border-[#ECEDEC]">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#FAFBF7] border-b border-[#ECEDEC] text-muted uppercase font-bold tracking-wider">
            <tr>
              <th className="py-3 px-4">Họ và tên trẻ</th>
              <th className="py-3 px-4">Ngày sinh & Độ tuổi</th>
              <th className="py-3 px-4 text-center">Lớp hiện tại</th>
              <th className="py-3 px-4 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F3F4F3]">
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-black/5 shrink-0" />
                      <div className="h-4 w-32 bg-black/5 rounded" />
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <div className="h-4 w-28 bg-black/5 rounded" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="h-5 w-20 bg-black/5 rounded-full mx-auto" />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <div className="h-7 w-20 bg-black/5 rounded-full mx-auto" />
                  </td>
                </tr>
              ))
            ) : paginatedPlacements.length > 0 ? (
              paginatedPlacements.map((child) => {
                const ageInMonths = calculateAgeInMonths(child.dateOfBirth);
                const isMam = child.className?.includes("Mầm");
                const isChoi = child.className?.includes("Chồi");
                const isLa = child.className?.includes("Lá");

                const classBadgeStyle = isMam
                  ? "bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/60"
                  : isChoi
                    ? "bg-[#EAF7FC] text-[#17627D] border border-[#D5E3F2]"
                    : isLa
                      ? "bg-[#FBE8E2] text-[#8A4F42] border border-[#FAC4CD]/60"
                      : "bg-amber-50 text-amber-800 border border-amber-200/80";

                return (
                  <tr key={child.childId} className="hover:bg-[#F8F8F9]/80 transition-colors">
                    {/* Cột 1: Họ và tên trẻ (kèm Avatar ký tự đầu) */}
                    <td className="py-3.5 px-4 font-bold text-foreground text-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-subtle text-brand flex items-center justify-center font-bold text-xs shrink-0">
                          {child.fullName.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{child.fullName}</span>
                      </div>
                    </td>

                    {/* Cột 2: Ngày sinh & Độ tuổi */}
                    <td className="py-3.5 px-4 text-[#606363]">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{formatDate(child.dateOfBirth)}</span>
                        <span className="text-[11px] text-muted">{formatAgeFriendly(ageInMonths)}</span>
                      </div>
                    </td>

                    {/* Cột 3: Lớp hiện tại */}
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${classBadgeStyle}`}>
                        {child.className ? (
                          <>
                            <span>{isMam ? "🌱" : isChoi ? "🌿" : "🍃"}</span>
                            <span>{child.className}</span>
                          </>
                        ) : (
                          <>
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            <span>Chưa xếp lớp</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Cột 4: Thao tác */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenAssignModal(child)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${child.classId
                          ? "bg-[#F8F8F9] hover:bg-brand-subtle text-brand border-[#ECEDEC] hover:border-brand-subtle"
                          : "bg-brand text-white border-brand hover:bg-brand-hover shadow-xs"
                          }`}
                      >
                        {child.classId ? "Chuyển lớp" : "Xếp lớp"}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="py-12 text-center text-muted">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <span className="text-2xl">🌱</span>
                    <span className="text-xs font-medium">
                      {searchTerm.trim()
                        ? `Không tìm thấy trẻ nào khớp với từ khóa "${searchTerm}".`
                        : "Không có trẻ nào trong danh sách này."}
                    </span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Phân trang */}
      {!isLoading && filteredPlacements.length > ITEMS_PER_PAGE && (
        <div className="pt-2">
          <Pagination
            page={currentPage}
            pageSize={ITEMS_PER_PAGE}
            totalCount={filteredPlacements.length}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
