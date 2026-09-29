"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/AppHeader";
import { Select } from "@/components/ui/Select";

interface DailyMenu {
  day: string;
  dayShort: string;
  date: string;
  breakfast: { time: string; dish: string };
  lunch: { time: string; dish: string };
  snack: { time: string; dish: string };
}

const weekMenuData: DailyMenu[] = [
  {
    day: "Thứ Hai",
    dayShort: "T2",
    date: "10/06",
    breakfast: { time: "07:30", dish: "Cháo sườn bắp non" },
    lunch: { time: "11:00", dish: "Cơm thịt kho trứng + Canh bí đỏ thịt bằm" },
    snack: { time: "14:30", dish: "Sữa chua Vinamilk & chuối tiêu" },
  },
  {
    day: "Thứ Ba",
    dayShort: "T3",
    date: "11/06",
    breakfast: { time: "07:30", dish: "Phở bò nạc Hà Nội" },
    lunch: { time: "11:00", dish: "Cơm cá sốt cà chua + Canh cải cúc thịt nạc" },
    snack: { time: "14:30", dish: "Chè đậu xanh hạt sen nước cốt dừa" },
  },
  {
    day: "Thứ Tư",
    dayShort: "T4",
    date: "12/06",
    breakfast: { time: "07:30", dish: "Bún thịt băm cà chua" },
    lunch: { time: "11:00", dish: "Cơm gà xào nấm đông cô + Canh rau ngót tôm" },
    snack: { time: "14:30", dish: "Sữa tươi TH True Milk & bánh flan" },
  },
  {
    day: "Thứ Năm",
    dayShort: "T5",
    date: "13/06",
    breakfast: { time: "07:30", dish: "Mì xào rau củ thịt nạc" },
    lunch: { time: "11:00", dish: "Cơm sườn non rim dứa + Canh cua mồng tơi" },
    snack: { time: "14:30", dish: "Bánh bao mini nhân thịt nấm" },
  },
  {
    day: "Thứ Sáu",
    dayShort: "T6",
    date: "14/06",
    breakfast: { time: "07:30", dish: "Cháo cá hồi đậu xanh" },
    lunch: { time: "11:00", dish: "Cơm bò xào ngũ sắc + Canh bí xanh tôm" },
    snack: { time: "14:30", dish: "Yaourt phô mai & dưa hấu tráng miệng" },
  },
];

export default function ParentMenuPage() {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"day" | "week">("day");

  const currentDay = weekMenuData[selectedDayIdx];

  return (
    <>
      <PageHeader
        title="Thực đơn tuần của bé"
        description="Khẩu phần ăn 3 bữa dinh dưỡng trong tuần của lớp bé"
      />

      {/* Bộ lọc tuần và chế độ xem di chuyển xuống dưới PageHeader, ngay trên nội dung thực đơn */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="w-full sm:w-56">
          <Select defaultValue="w24">
            <option value="w24">Tuần 24 (10/06 - 14/06)</option>
            <option value="w25">Tuần 25 (17/06 - 21/06)</option>
          </Select>
        </div>

        <div className="hidden sm:inline-flex bg-[#F3F2F7] p-1 rounded-lg border border-[#E8E8EC] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode("day")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === "day"
                ? "bg-white text-[#16141F] shadow-xs"
                : "text-[#6A677B] hover:text-[#16141F]"
            }`}
          >
            Xem theo ngày
          </button>
          <button
            type="button"
            onClick={() => setViewMode("week")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === "week"
                ? "bg-white text-[#16141F] shadow-xs"
                : "text-[#6A677B] hover:text-[#16141F]"
            }`}
          >
            Xem cả tuần
          </button>
        </div>
      </div>

      {/* CHẾ ĐỘ 1: XEM THEO NGÀY (Tối ưu 100% cho điện thoại) */}
      {(viewMode === "day" || true) && (
        <div className={viewMode === "week" ? "sm:hidden" : ""}>
          {/* Day Navigation Bar */}
          <div className="bg-white rounded-xl border border-[#E8E8EC] p-2 shadow-xs mb-5">
            <div className="grid grid-cols-5 gap-1.5">
              {weekMenuData.map((d, idx) => {
                const isActive = selectedDayIdx === idx;
                return (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => setSelectedDayIdx(idx)}
                    className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-lg transition-all text-center ${
                      isActive
                        ? "bg-[#42B591] text-white shadow-xs font-bold"
                        : "hover:bg-[#F0FAF6] text-[#16141F]"
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-bold">{d.dayShort}</span>
                    <span
                      className={`text-[10px] sm:text-xs mt-0.5 ${
                        isActive ? "text-white/80 font-medium" : "text-[#6A677B]"
                      }`}
                    >
                      {d.date}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Day Header */}
          <div className="flex items-center justify-between mb-4 px-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#42B591]" />
              <h2 className="text-base sm:text-lg font-bold text-[#16141F]">
                {currentDay.day}, Ngày {currentDay.date}/2025
              </h2>
            </div>
            <span className="text-xs font-medium text-[#6A677B]">Đầy đủ 3 bữa</span>
          </div>

          {/* 3 Meal Cards */}
          <div className="space-y-3.5 mb-6">
            <div className="bg-white rounded-xl border border-[#E8E8EC] p-4 sm:p-5 shadow-xs flex items-start gap-3.5 hover:border-[#42B591] transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#F0FAF6] border border-[#C4EDE0] text-[#247A60] flex items-center justify-center text-lg shrink-0">
                🥣
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-[#247A60] uppercase tracking-wider">
                    Bữa sáng
                  </span>
                  <span className="text-xs font-semibold text-[#6A677B] bg-[#F3F2F7] px-2 py-0.5 rounded">
                    {currentDay.breakfast.time}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-[#16141F] leading-snug">
                  {currentDay.breakfast.dish}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E8EC] p-4 sm:p-5 shadow-xs flex items-start gap-3.5 hover:border-[#42B591] transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#F0FAF6] border border-[#C4EDE0] text-[#247A60] flex items-center justify-center text-lg shrink-0">
                🍱
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-[#247A60] uppercase tracking-wider">
                    Bữa trưa
                  </span>
                  <span className="text-xs font-semibold text-[#6A677B] bg-[#F3F2F7] px-2 py-0.5 rounded">
                    {currentDay.lunch.time}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-[#16141F] leading-snug">
                  {currentDay.lunch.dish}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-[#E8E8EC] p-4 sm:p-5 shadow-xs flex items-start gap-3.5 hover:border-[#42B591] transition-all">
              <div className="w-10 h-10 rounded-lg bg-[#F0FAF6] border border-[#C4EDE0] text-[#247A60] flex items-center justify-center text-lg shrink-0">
                🥛
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-[#247A60] uppercase tracking-wider">
                    Bữa xế chiều
                  </span>
                  <span className="text-xs font-semibold text-[#6A677B] bg-[#F3F2F7] px-2 py-0.5 rounded">
                    {currentDay.snack.time}
                  </span>
                </div>
                <p className="text-sm sm:text-base font-semibold text-[#16141F] leading-snug">
                  {currentDay.snack.dish}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CHẾ ĐỘ 2: XEM TOÀN BỘ CẢ TUẦN DẠNG CỘT CARD (Desktop/Tablet) */}
      {viewMode === "week" && (
        <div className="hidden sm:grid grid-cols-5 gap-3.5 mb-6">
          {weekMenuData.map((d) => (
            <div
              key={d.day}
              className="bg-white rounded-xl border border-[#E8E8EC] p-3.5 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="border-b border-[#F3F2F7] pb-2.5 mb-3 text-center">
                  <p className="text-sm font-bold text-[#16141F]">{d.day}</p>
                  <p className="text-[11px] font-semibold text-[#247A60]">{d.date}</p>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-[#247A60] uppercase tracking-wider block mb-0.5">
                      Sáng ({d.breakfast.time})
                    </span>
                    <p className="font-semibold text-[#16141F] leading-snug">{d.breakfast.dish}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#247A60] uppercase tracking-wider block mb-0.5">
                      Trưa ({d.lunch.time})
                    </span>
                    <p className="font-semibold text-[#16141F] leading-snug">{d.lunch.dish}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-[#247A60] uppercase tracking-wider block mb-0.5">
                      Xế ({d.snack.time})
                    </span>
                    <p className="font-semibold text-[#16141F] leading-snug">{d.snack.dish}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}