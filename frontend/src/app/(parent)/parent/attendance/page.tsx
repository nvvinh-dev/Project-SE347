"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/AppHeader";
import { Select } from "@/components/ui/Select";
import { StatusPill } from "@/components/ui/StatusPill";

const attendanceList = [
  { date: "10/06/2025", day: "Thứ 2", status: "Present", label: "Có mặt" },
  { date: "07/06/2025", day: "Thứ 6", status: "Present", label: "Có mặt" },
  { date: "06/06/2025", day: "Thứ 5", status: "Present", label: "Có mặt" },
  { date: "05/06/2025", day: "Thứ 4", status: "AbsentExcused", label: "Vắng có phép" },
  { date: "04/06/2025", day: "Thứ 3", status: "Present", label: "Có mặt" },
  { date: "03/06/2025", day: "Thứ 2", status: "Present", label: "Có mặt" },
];

export default function AttendancePage() {
  const [selectedMonth, setSelectedMonth] = useState("06");

  return (
    <>
      <PageHeader
        title="Lịch sử điểm danh"
        description="Theo dõi tình hình đến lớp mỗi ngày của bé Nguyễn Gia Hưng"
      />

      {/* Bộ lọc tháng di chuyển xuống ngay trên main table */}
      <div className="flex items-center justify-end mb-4">
        <div className="w-44">
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="06">Tháng 06/2025</option>
            <option value="05">Tháng 05/2025</option>
          </Select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[500px] border-collapse">
            <thead>
              <tr className="bg-[#F9F9FB] border-b border-[#E8E8EC]">
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Ngày</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Thứ</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Trạng thái điểm danh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EC]">
              {attendanceList.map((item) => (
                <tr key={item.date} className="hover:bg-[#F3F2F7]/50 transition-colors">
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-bold text-[#16141F]">{item.date}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-medium text-[#6A677B]">{item.day}</td>
                  <td className="px-4 sm:px-5 py-3.5">
                    <StatusPill
                      variant={
                        item.status === "Present"
                          ? "success"
                          : item.status === "AbsentExcused"
                          ? "warning"
                          : "danger"
                      }
                      dot
                    >
                      {item.label}
                    </StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}