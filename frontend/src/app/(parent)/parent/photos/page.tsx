"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/AppHeader";
import { Select } from "@/components/ui/Select";

const activityPhotos = [
  { id: 1, title: "Giờ học tạo hình xé dán", date: "10/06/2025" },
  { id: 2, title: "Hoạt động vận động ngoài trời", date: "07/06/2025" },
  { id: 3, title: "Bé học chăm sóc cây xanh", date: "05/06/2025" },
  { id: 4, title: "Giờ sinh hoạt âm nhạc", date: "02/06/2025" },
];

export default function PhotosPage() {
  const [selectedMonth, setSelectedMonth] = useState("06");

  return (
    <>
      <PageHeader
        title="Ảnh hoạt động của lớp"
        description="Xem các khoảnh khắc học tập và vui chơi của con tại trường"
      />

      {/* Bộ lọc tháng di chuyển xuống ngay trên grid ảnh */}
      <div className="flex items-center justify-end mb-4">
        <div className="w-44">
          <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
            <option value="06">Tháng 06/2025</option>
            <option value="05">Tháng 05/2025</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {activityPhotos.map((p) => (
          <div key={p.id} className="bg-white rounded-xl border border-[#E8E8EC] overflow-hidden shadow-xs hover:border-[#42B591] transition-all">
            <div className="aspect-4/3 bg-[#F3F2F7] flex items-center justify-center text-[#6A677B] text-xs font-semibold">
              Ảnh hoạt động lớp
            </div>
            <div className="p-3.5">
              <p className="text-sm font-bold text-[#16141F] truncate">{p.title}</p>
              <p className="text-xs text-[#6A677B] mt-1">{p.date}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}