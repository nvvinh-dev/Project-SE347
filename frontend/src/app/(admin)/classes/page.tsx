"use client";

import { useState } from "react";
import Link from "next/link";

interface ClassInfo {
  id: string;
  name: string;
  ageGroup: string;
  currentCount: number;
  maxCapacity: number;
  headTeacher: string | null;      // Giáo viên chủ nhiệm (Chuyên môn & Điểm danh)
  assistantTeacher: string | null; // Bảo mẫu / GV Phụ tá (Nề nếp, dinh dưỡng & bán trú)
  badgeType: "mint" | "peach" | "yellow";
  attendanceStatus: {
    status: "completed" | "pending";
    text: string;
  };
}

interface StudentItem {
  id: string;
  fullName: string;
  birthDate: string;
  gender: "Nam" | "Nữ";
  className: string;
  parentName: string;
}

const mockClasses: ClassInfo[] = [
  {
    id: "c-1",
    name: "Lớp Mầm",
    ageGroup: "3 – 4 Tuổi",
    currentCount: 10,
    maxCapacity: 15,
    headTeacher: "Cô Nguyễn Thị Lan",
    assistantTeacher: "Cô Lê Thu Hà",
    badgeType: "mint",
    attendanceStatus: {
      status: "completed",
      text: "Đã điểm danh 10/10 trẻ có mặt (08:15)",
    },
  },
  {
    id: "c-2",
    name: "Lớp Chồi",
    ageGroup: "4 – 5 Tuổi",
    currentCount: 9,
    maxCapacity: 15,
    headTeacher: null, // Chưa phân công GVCN
    assistantTeacher: "Cô Đặng Kim Chi",
    badgeType: "peach",
    attendanceStatus: {
      status: "completed",
      text: "Đã điểm danh 9/9 trẻ có mặt (Bảo mẫu điểm danh thay - 08:20)",
    },
  },
  {
    id: "c-3",
    name: "Lớp Lá",
    ageGroup: "5 – 6 Tuổi",
    currentCount: 9,
    maxCapacity: 15,
    headTeacher: "Cô Trần Thị Mai",
    assistantTeacher: "Cô Nguyễn Thúy Vi",
    badgeType: "yellow",
    attendanceStatus: {
      status: "completed",
      text: "Đã điểm danh 9/9 trẻ có mặt (08:25)",
    },
  },
];

const mockStudents: StudentItem[] = [
  { id: "s-1", fullName: "Nguyễn Tuệ Nhi", birthDate: "12/05/2023", gender: "Nữ", className: "Lớp Mầm", parentName: "Hoàng Văn Tuấn" },
  { id: "s-2", fullName: "Trần Bảo An", birthDate: "20/08/2023", gender: "Nam", className: "Lớp Mầm", parentName: "Trần Quốc Hưng" },
  { id: "s-3", fullName: "Lê Gia Huy", birthDate: "14/02/2022", gender: "Nam", className: "Lớp Chồi", parentName: "Lê Minh Trí" },
  { id: "s-4", fullName: "Phạm Minh Khôi", birthDate: "03/11/2021", gender: "Nam", className: "Lớp Lá", parentName: "Phạm Hồng Phúc" },
  { id: "s-5", fullName: "Vũ Thảo Nguyên", birthDate: "29/09/2021", gender: "Nữ", className: "Lớp Lá", parentName: "Vũ Hải Đăng" },
];

export default function AdminClassesPage() {
  const [selectedClass, setSelectedClass] = useState<string>("ALL");
  const [studentSearch, setStudentSearch] = useState<string>("");

  const classCounts: Record<string, number> = {
    ALL: mockClasses.reduce((acc, c) => acc + c.currentCount, 0),
    "Lớp Mầm": mockClasses.find((c) => c.name === "Lớp Mầm")?.currentCount || 10,
    "Lớp Chồi": mockClasses.find((c) => c.name === "Lớp Chồi")?.currentCount || 9,
    "Lớp Lá": mockClasses.find((c) => c.name === "Lớp Lá")?.currentCount || 9,
  };

  const filteredStudents = mockStudents.filter((s) => {
    const matchesClass = selectedClass === "ALL" || s.className === selectedClass;
    const matchesSearch =
      s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.parentName.toLowerCase().includes(studentSearch.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#121314]">
            Xếp lớp học & Phân công giáo viên
          </h2>
          <p className="text-xs sm:text-sm text-[#606363] mt-1">
            Định mức chuẩn 15 trẻ/lớp • Cơ cấu 2 giáo viên phụ trách (1 GVCN chính + 1 Bảo mẫu bán trú)
          </p>
        </div>
      </div>

      {/* 2. Three Class Cards - Compact & High-density Layout with Mini Progress Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {mockClasses.map((cls) => {
          const fillPercentage = Math.round((cls.currentCount / cls.maxCapacity) * 100);
          return (
            <div
              key={cls.id}
              className="p-5 rounded-3xl bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-3.5 hover:shadow-[0_8px_24px_rgba(30,60,50,0.06)] hover:-translate-y-0.5 transition-all duration-200"
            >
              {/* Header: Độ tuổi + Sĩ số & Mini Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      cls.badgeType === "mint"
                        ? "bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/50"
                        : cls.badgeType === "peach"
                          ? "bg-[#FBE8E2] text-[#8A4F42] border border-[#FAC4CD]/60"
                          : "bg-[#FFF9E6] text-[#7A5B00] border border-[#FFF3DD]"
                    }`}
                  >
                    {cls.ageGroup}
                  </span>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#121314]">
                      {cls.currentCount}
                    </span>
                    <span className="text-[11px] font-medium text-[#9FA2A1]">
                      {" "}/ {cls.maxCapacity} trẻ
                    </span>
                  </div>
                </div>

                {/* Class Title */}
                <div className="pt-0.5">
                  <h3 className="text-lg font-bold text-[#121314]">{cls.name}</h3>
                </div>

                {/* Mini Progress Bar hiển thị tỷ lệ lấp đầy sĩ số */}
                <div className="w-full h-1.5 rounded-full bg-[#F0F2F1] overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cls.badgeType === "mint"
                        ? "bg-[#55B38F]"
                        : cls.badgeType === "peach"
                          ? "bg-[#E8916E]"
                          : "bg-[#F7DE54]"
                    }`}
                    style={{ width: `${fillPercentage}%` }}
                  />
                </div>
              </div>

              {/* Teacher In-Charge Section: Compact Rows */}
              <div className="pt-2 border-t border-[#F3F4F3] space-y-2 text-xs">
                {/* 1. Giáo viên chủ nhiệm */}
                <div className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-[#FAFBF7] border border-[#ECEDEC]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xs">👩‍🏫</span>
                    <span className="text-[10px] text-[#9FA2A1] uppercase font-bold">GVCN:</span>
                    <span className="font-bold text-[#121314] truncate">
                      {cls.headTeacher || <span className="text-[#E8916E] font-medium">Chưa gán</span>}
                    </span>
                  </div>
                  {cls.headTeacher ? (
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-[#55B38F] hover:text-[#1A624C] underline shrink-0 ml-2"
                    >
                      Đổi
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8916E] text-white hover:bg-[#D96B43] shrink-0 ml-2"
                    >
                      Gán ngay
                    </button>
                  )}
                </div>

                {/* 2. Bảo mẫu / Phụ tá */}
                <div className="flex items-center justify-between py-1 px-2.5 rounded-xl bg-[#FAFBF7] border border-[#ECEDEC]">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xs">🥣</span>
                    <span className="text-[10px] text-[#9FA2A1] uppercase font-bold">Bảo mẫu:</span>
                    <span className="font-semibold text-[#121314] truncate">
                      {cls.assistantTeacher}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="text-[11px] font-semibold text-[#55B38F] hover:text-[#1A624C] underline shrink-0 ml-2"
                  >
                    Đổi
                  </button>
                </div>

                {/* Trạng thái điểm danh sáng nay */}
                <div className="p-1.5 rounded-xl text-[11px] font-medium flex items-center gap-1.5 bg-[#E8F8F1] text-[#1A624C]">
                  <span>✓</span>
                  <span className="truncate">{cls.attendanceStatus.text}</span>
                </div>
              </div>

              {/* Action Buttons: Làm rõ nút 'Thêm trẻ' */}
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClass(cls.name)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-semibold border transition-all text-center ${
                    selectedClass === cls.name
                      ? "bg-[#55B38F] text-white border-[#55B38F] shadow-2xs"
                      : "bg-[#F8F8F9] text-[#606363] border-[#ECEDEC] hover:bg-[#E8F8F1] hover:text-[#1A624C]"
                  }`}
                >
                  Xem danh sách ({cls.currentCount})
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FEFEFE] hover:bg-[#E8F8F1] text-[#1A624C] border border-[#ECEDEC] hover:border-[#A7E5D2] transition-all flex items-center gap-1 shrink-0"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  <span>Thêm trẻ</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Students Assignment Table (Danh sách trẻ theo lớp - Có Search & Filter tiện lợi) */}
      <div className="p-6 rounded-3xl bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#F3F4F3] pb-4">
          <div>
            <h3 className="text-base font-bold text-[#121314]">
              Danh sách trẻ xếp vào lớp
            </h3>
            <p className="text-xs text-[#9FA2A1] mt-0.5">
              Họ tên, ngày sinh và lớp học hiện tại trong năm học 2026 – 2027
            </p>
          </div>

          {/* Search + Filter by Class Buttons with Student Counts */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5">
            {/* Search input */}
            <div className="relative w-full sm:w-60">
              <input
                type="text"
                placeholder="Tìm tên bé hoặc phụ huynh..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full h-9 pl-8 pr-3 rounded-full bg-[#F8F8F9] border border-[#ECEDEC] text-xs text-[#121314] focus:outline-none focus:border-[#55B38F] transition-all"
              />
              <svg
                className="w-3.5 h-3.5 text-[#9FA2A1] absolute left-2.5 top-2.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Filter Pills with Counts */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {[
                { label: `Tất cả (${classCounts.ALL})`, value: "ALL" },
                { label: `Lớp Mầm (${classCounts["Lớp Mầm"]})`, value: "Lớp Mầm" },
                { label: `Lớp Chồi (${classCounts["Lớp Chồi"]})`, value: "Lớp Chồi" },
                { label: `Lớp Lá (${classCounts["Lớp Lá"]})`, value: "Lớp Lá" },
              ].map((f) => (
                <button
                  key={f.value}
                  onClick={() => setSelectedClass(f.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedClass === f.value
                      ? "bg-[#55B38F] text-white shadow-2xs"
                      : "bg-[#F8F8F9] text-[#606363] hover:bg-[#ECEDEC]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBF7] border-b border-[#ECEDEC] text-[#9FA2A1] uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Họ và tên trẻ</th>
                <th className="py-3 px-4">Ngày sinh</th>
                <th className="py-3 px-4 text-center">Giới tính</th>
                <th className="py-3 px-4 text-center">Lớp hiện tại</th>
                <th className="py-3 px-4">Phụ huynh liên hệ</th>
                <th className="py-3 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3F4F3]">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-[#F8F8F9]/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#121314] text-sm">
                      {st.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-[#606363]">{st.birthDate}</td>
                    <td className="py-3.5 px-4 text-center text-[#606363]">{st.gender}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${st.className === "Lớp Mầm"
                            ? "bg-[#E8F8F1] text-[#1A624C]"
                            : st.className === "Lớp Chồi"
                              ? "bg-[#EAF7FC] text-[#17627D]"
                              : "bg-[#FFF9E6] text-[#7A5B00]"
                          }`}
                      >
                        {st.className}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#606363]">{st.parentName}</td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F8F8F9] hover:bg-[#E8F8F1] text-[#1A624C] border border-[#ECEDEC] transition-all"
                      >
                        Chuyển lớp
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#9FA2A1]">
                    Không tìm thấy học sinh phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
