"use client";

import { useState } from "react";
import { PageHeader } from "@/components/layout/AppHeader";
import { SearchInput } from "@/components/ui/SearchInput";
import { Select } from "@/components/ui/Select";

const studentList = [
  { id: "TR-001", name: "Nguyễn Gia Hưng", dob: "15/03/2021", enrollDate: "05/09/2024", className: "Chồi A", guardianName: "Nguyễn Văn Hùng", guardianEmail: "hung.nguyen@gmail.com" },
  { id: "TR-002", name: "Trần Bảo Ngọc", dob: "22/07/2022", enrollDate: "05/09/2024", className: "Mầm 1", guardianName: "Trần Văn Minh", guardianEmail: "minh.tran@gmail.com" },
  { id: "TR-003", name: "Lê Minh Tuấn", dob: "10/11/2022", enrollDate: "01/10/2024", className: "Mầm 2", guardianName: "Lê Thị Mai", guardianEmail: "mai.le@gmail.com" },
  { id: "TR-004", name: "Phạm Thảo Vy", dob: "08/02/2020", enrollDate: "05/09/2023", className: "Lá B", guardianName: "Phạm Đức Long", guardianEmail: "long.pham@gmail.com" },
  { id: "TR-005", name: "Hoàng Gia Bảo", dob: "14/09/2021", enrollDate: "15/11/2024", className: "Chồi B", guardianName: "Hoàng Văn Sơn", guardianEmail: "son.hoang@gmail.com" },
];

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [filterClass, setFilterClass] = useState("all");

  const filtered = studentList.filter((s) => {
    const matchQuery = s.name.toLowerCase().includes(q.toLowerCase()) ||
                       s.guardianName.toLowerCase().includes(q.toLowerCase()) ||
                       s.id.toLowerCase().includes(q.toLowerCase());
    const matchClass = filterClass === "all" || s.className === filterClass;
    return matchQuery && matchClass;
  });

  return (
    <>
      <PageHeader
        title="Hồ sơ trẻ"
        description="Quản lý thông tin họ tên, ngày sinh, ngày nhập học và phụ huynh liên kết"
      />

      {/* Tìm kiếm và Bộ lọc di chuyển xuống ngay trên main table */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
        <div className="w-full sm:w-72">
          <SearchInput
            placeholder="Tìm tên trẻ, mã số, phụ huynh..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onClear={() => setQ("")}
            className="w-full"
          />
        </div>
        <div className="w-full sm:w-40">
          <Select value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
            <option value="all">Tất cả các lớp</option>
            <option value="Mầm 1">Lớp Mầm 1</option>
            <option value="Mầm 2">Lớp Mầm 2</option>
            <option value="Chồi A">Lớp Chồi A</option>
            <option value="Chồi B">Lớp Chồi B</option>
            <option value="Lá B">Lớp Lá B</option>
          </Select>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-[#E8E8EC] shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-[#F9F9FB] border-b border-[#E8E8EC]">
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Mã trẻ</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Họ và tên</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Lớp</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Ngày sinh</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Ngày nhập học</th>
                <th className="text-xs font-bold text-[#16141F] uppercase tracking-wider px-4 sm:px-5 py-3.5">Phụ huynh liên kết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EC]">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-[#F3F2F7]/50 transition-colors">
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-bold text-[#247A60]">{s.id}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-sm font-semibold text-[#16141F]">{s.name}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-bold text-[#6A677B]">{s.className}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-medium text-[#16141F]">{s.dob}</td>
                  <td className="px-4 sm:px-5 py-3.5 text-xs font-medium text-[#6A677B]">{s.enrollDate}</td>
                  <td className="px-4 sm:px-5 py-3.5">
                    <p className="text-xs font-bold text-[#16141F]">{s.guardianName}</p>
                    <p className="text-[11px] text-[#6A677B]">{s.guardianEmail}</p>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 sm:px-5 py-8 text-center text-sm font-medium text-[#6A677B]">
                    Không tìm thấy hồ sơ trẻ phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}