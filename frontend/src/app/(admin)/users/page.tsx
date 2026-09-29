"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

type UserRole = "Admin" | "Teacher" | "Accountant" | "Medical" | "Parent";

interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: "Admin" | "Teacher" | "Accountant" | "Medical";
  status: "Active" | "Inactive";
  department: string;
  assignedScope: string;
}

interface ParentUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive";
  childrenList: {
    childName: string;
    className: string;
    relationship: string;
  }[];
}

const mockStaffList: StaffUser[] = [
  {
    id: "u-1",
    fullName: "Nguyễn Văn Vinh",
    email: "admin@nhatre.local",
    phone: "0901 234 567",
    role: "Admin",
    status: "Active",
    department: "Ban Giám Hiệu",
    assignedScope: "Quản trị toàn trường & Vận hành",
  },
  {
    id: "u-2",
    fullName: "Nguyễn Thị Lan",
    email: "gv_lan@nhatre.local",
    phone: "0902 345 678",
    role: "Teacher",
    status: "Active",
    department: "Tổ Mầm Non",
    assignedScope: "GVCN Lớp Mầm (3–4 tuổi)",
  },
  {
    id: "u-3",
    fullName: "Trần Thị Mai",
    email: "gv_mai@nhatre.local",
    phone: "0903 456 789",
    role: "Teacher",
    status: "Active",
    department: "Tổ Mầm Non",
    assignedScope: "GVCN Lớp Lá (5–6 tuổi)",
  },
  {
    id: "u-4",
    fullName: "Lê Thị Thảo",
    email: "ketoan_thao@nhatre.local",
    phone: "0904 567 890",
    role: "Accountant",
    status: "Active",
    department: "Phòng Tài vụ",
    assignedScope: "Kế toán trưởng & Quản lý học phí",
  },
  {
    id: "u-5",
    fullName: "Phạm Quỳnh Hương",
    email: "yte_huong@nhatre.local",
    phone: "0905 678 901",
    role: "Medical",
    status: "Active",
    department: "Phòng Y tế học đường",
    assignedScope: "Theo dõi sức khỏe & Sự cố y tế",
  },
];

const mockParentList: ParentUser[] = [
  {
    id: "p-1",
    fullName: "Hoàng Văn Tuấn",
    email: "ph_tuan@gmail.com",
    phone: "0912 345 678",
    status: "Active",
    childrenList: [
      { childName: "Nguyễn Tuệ Nhi", className: "Lớp Mầm", relationship: "Bố" },
    ],
  },
  {
    id: "p-2",
    fullName: "Trần Quốc Hưng",
    email: "ph_hung@gmail.com",
    phone: "0913 456 789",
    status: "Active",
    childrenList: [
      { childName: "Trần Bảo An", className: "Lớp Mầm", relationship: "Bố" },
    ],
  },
  {
    id: "p-3",
    fullName: "Lê Minh Trí",
    email: "ph_tri@gmail.com",
    phone: "0914 567 890",
    status: "Active",
    childrenList: [
      { childName: "Lê Gia Huy", className: "Lớp Chồi", relationship: "Bố" },
    ],
  },
  {
    id: "p-4",
    fullName: "Phạm Hồng Phúc",
    email: "ph_phuc@gmail.com",
    phone: "0915 678 901",
    status: "Active",
    childrenList: [
      { childName: "Phạm Minh Khôi", className: "Lớp Lá", relationship: "Bố" },
    ],
  },
  {
    id: "p-5",
    fullName: "Vũ Hải Đăng",
    email: "ph_dang@gmail.com",
    phone: "0916 789 012",
    status: "Active",
    childrenList: [
      { childName: "Vũ Thảo Nguyên", className: "Lớp Lá", relationship: "Bố" },
    ],
  },
  {
    id: "p-6",
    fullName: "Nguyễn Thu Phương",
    email: "ph_phuong@gmail.com",
    phone: "0917 890 123",
    status: "Active",
    childrenList: [
      { childName: "Đỗ Gia Hưng", className: "Lớp Chồi", relationship: "Mẹ" },
    ],
  },
];

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"staff" | "parents">("staff");
  const [searchTerm, setSearchTerm] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>("ALL");

  // State cho Modal Phân quyền an toàn (D48 & Role Scope Protection)
  const [roleModalUser, setRoleModalUser] = useState<StaffUser | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<"Admin" | "Teacher" | "Accountant" | "Medical">("Teacher");
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Lọc danh sách nhân sự
  const filteredStaff = mockStaffList.filter((staff) => {
    const matchesSearch =
      staff.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.assignedScope.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = staffRoleFilter === "ALL" || staff.role === staffRoleFilter;
    return matchesSearch && matchesRole;
  });

  // Lọc danh sách phụ huynh
  const filteredParents = mockParentList.filter((parent) => {
    const matchesSearch =
      parent.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.phone.includes(searchTerm) ||
      parent.childrenList.some((c) =>
        c.childName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.className.toLowerCase().includes(searchTerm.toLowerCase())
      );
    return matchesSearch;
  });

  const handleOpenRoleModal = (staff: StaffUser) => {
    setRoleModalUser(staff);
    setSelectedNewRole(staff.role);
  };

  const handleConfirmRoleChange = () => {
    if (!roleModalUser) return;
    setActionSuccessMessage(
      `Đã cập nhật vai trò của ${roleModalUser.fullName} thành [${selectedNewRole === "Admin"
        ? "Admin"
        : selectedNewRole === "Teacher"
          ? "Giáo viên"
          : selectedNewRole === "Accountant"
            ? "Kế toán"
            : "Y tế"
      }]. Mọi phiên đăng nhập cũ đã được thu hồi bảo mật tự động.`
    );
    setRoleModalUser(null);
    setTimeout(() => setActionSuccessMessage(null), 5000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Page Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#121314]">
            Quản lý tài khoản & Phân quyền
          </h2>
          <p className="text-xs sm:text-sm text-[#606363] mt-1">
            Quản trị nhân sự nhà trường và tài khoản phụ huynh theo từng phân hệ nghiệp vụ
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#55B38F] hover:bg-[#1A624C] text-white shadow-sm shadow-[#55B38F]/20 transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Tạo tài khoản</span>
          </button>
        </div>
      </div>

      {/* Thông báo thao tác thành công (Alert Pastel) */}
      {actionSuccessMessage && (
        <div className="p-4 rounded-2xl bg-[#E8F8F1] border border-[#A7E5D2] text-[#1A624C] text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span>✓</span>
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-xs font-bold hover:underline"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 2. TAB NAVIGATION: Tách biệt Nhân sự & Phụ huynh */}
      <div className="flex items-center gap-2 border-b border-[#ECEDEC] pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("staff");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeTab === "staff"
            ? "bg-[#55B38F] text-white shadow-sm shadow-[#55B38F]/25"
            : "bg-[#FEFEFE] text-[#606363] border border-[#ECEDEC] hover:bg-[#F8F8F9] hover:text-[#121314]"
            }`}
        >
          <span>🧑‍🏫 Nhân sự nhà trường</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "staff"
              ? "bg-white/20 text-white"
              : "bg-[#F3F4F3] text-[#606363]"
              }`}
          >
            {mockStaffList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("parents");
            setSearchTerm("");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all ${activeTab === "parents"
            ? "bg-[#71C8E4] text-white shadow-sm shadow-[#71C8E4]/25"
            : "bg-[#FEFEFE] text-[#606363] border border-[#ECEDEC] hover:bg-[#F8F8F9] hover:text-[#121314]"
            }`}
        >
          <span>👨‍👩‍👧 Phụ huynh học sinh</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "parents"
              ? "bg-white/20 text-white"
              : "bg-[#F3F4F3] text-[#606363]"
              }`}
          >
            {mockParentList.length}
          </span>
        </button>
      </div>

      {/* 3. Filter & Search Controls */}
      <div className="p-4 rounded-2xl bg-[#FEFEFE] border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.02)] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative w-full sm:w-88">
          <input
            type="text"
            placeholder={
              activeTab === "staff"
                ? "Tìm theo họ tên, email công vụ hoặc nhiệm vụ..."
                : "Tìm theo tên phụ huynh, SĐT hoặc tên bé con..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-[#F8F8F9] border border-[#ECEDEC] text-xs text-[#121314] focus:outline-none focus:border-[#55B38F] focus:ring-2 focus:ring-[#55B38F]/15 transition-all"
          />
          <svg
            className="w-4 h-4 text-[#9FA2A1] absolute left-3 top-3"
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

        {/* Role filters (Chỉ dành cho Tab Nhân sự) */}
        {activeTab === "staff" && (
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { label: "Tất cả", value: "ALL" },
              { label: "Admin", value: "Admin" },
              { label: "Giáo viên", value: "Teacher" },
              { label: "Kế toán", value: "Accountant" },
              { label: "Y tế", value: "Medical" },
            ].map((r) => {
              const isActive = staffRoleFilter === r.value;
              return (
                <button
                  key={r.value}
                  onClick={() => setStaffRoleFilter(r.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${isActive
                    ? "bg-[#55B38F] text-white shadow-2xs"
                    : "bg-[#F8F8F9] text-[#606363] hover:text-[#121314] hover:bg-[#ECEDEC]/60"
                    }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-info cho Tab Phụ huynh */}
        {activeTab === "parents" && (
          <div className="text-xs text-[#606363] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#71C8E4]" />
            <span>Tài khoản Phụ huynh liên kết dữ liệu đón trả & học phí</span>
          </div>
        )}
      </div>

      {/* 4. DATA TABLE THEO TAB */}
      <div className="bg-[#FEFEFE] rounded-3xl border border-[#ECEDEC] shadow-[0_2px_8px_rgba(30,60,50,0.03)] overflow-hidden">
        {activeTab === "staff" ? (
          /* TAB 1: BẢNG NHÂN SỰ NHÀ TRƯỜNG */
          filteredStaff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBF7] border-b border-[#ECEDEC] text-[#9FA2A1] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Nhân sự</th>
                    <th className="py-3.5 px-4 text-center">Vai trò hệ thống</th>
                    <th className="py-3.5 px-4">Phòng ban / Chức vụ</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-6 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F3]">
                  {filteredStaff.map((staff) => {
                    const isCurrentAdmin =
                      currentUser?.userId === staff.id || staff.email === "admin@nhatre.local";

                    return (
                      <tr key={staff.id} className="hover:bg-[#F8F8F9]/80 transition-colors">
                        {/* Name & Email */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-[#EAF7FC] text-[#17627D] font-bold text-xs flex items-center justify-center shrink-0">
                              {staff.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-[#121314] text-sm">
                                {staff.fullName}
                                {isCurrentAdmin && (
                                  <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C]">
                                    Bạn
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-[#9FA2A1] mt-0.5">
                                {staff.email} • {staff.phone}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge (Multi-color Pastel) - CANH GIỮA */}
                        <td className="py-4 px-4 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${staff.role === "Admin"
                              ? "bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]/50"
                              : staff.role === "Teacher"
                                ? "bg-[#FAFBF7] text-[#55B38F] border border-[#C6E495]/60"
                                : staff.role === "Accountant"
                                  ? "bg-[#FFF9E6] text-[#7A5B00] border border-[#FFF3DD]"
                                  : "bg-[#EAF7FC] text-[#17627D] border border-[#71C8E4]/40"
                              }`}
                          >
                            {staff.role === "Admin"
                              ? "Admin"
                              : staff.role === "Teacher"
                                ? "Giáo viên"
                                : staff.role === "Accountant"
                                  ? "Kế toán"
                                  : "Y tế"}
                          </span>
                        </td>

                        {/* Department & Assigned Scope */}
                        <td className="py-4 px-4 text-[#606363]">
                          <p className="font-medium text-[#121314]">{staff.assignedScope}</p>
                          <p className="text-[11px] text-[#9FA2A1] mt-0.5">{staff.department}</p>
                        </td>

                        {/* Status - CANH GIỮA */}
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center justify-center gap-1.5 text-xs text-[#55B38F] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#55B38F]" />
                            Hoạt động
                          </span>
                        </td>

                        {/* Actions - CANH GIỮA */}
                        <td className="py-4 px-6 text-center">
                          {isCurrentAdmin ? (
                            <span className="text-[11px] text-[#9FA2A1] italic">
                              (Tài khoản hiện hành)
                            </span>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenRoleModal(staff)}
                                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F8F8F9] hover:bg-[#E8F8F1] text-[#1A624C] border border-[#ECEDEC] transition-all"
                              >
                                Phân quyền
                              </button>
                              <button
                                type="button"
                                className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0F2] hover:bg-[#FFE3EC] text-[#E8916E] border border-[#FAC4CD]/50 transition-all"
                              >
                                Khóa
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <p className="text-xs text-[#606363]">Không tìm thấy nhân sự phù hợp.</p>
            </div>
          )
        ) : (
          /* TAB 2: BẢNG PHỤ HUYNH HỌC SINH */
          filteredParents.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFBF7] border-b border-[#ECEDEC] text-[#9FA2A1] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">Phụ huynh học sinh</th>
                    <th className="py-3.5 px-4">Học sinh theo học (Bé liên kết)</th>
                    <th className="py-3.5 px-4 text-center">Vai trò hệ thống</th>
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-6 text-center">Thao tác tài khoản</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F3]">
                  {filteredParents.map((parent) => (
                    <tr key={parent.id} className="hover:bg-[#F8F8F9]/80 transition-colors">
                      {/* Parent Name, Phone & Email */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#FFF0EB] text-[#E8916E] font-bold text-xs flex items-center justify-center shrink-0">
                            {parent.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-[#121314] text-sm">{parent.fullName}</p>
                            <p className="text-[11px] text-[#9FA2A1] mt-0.5">
                              {parent.phone} • {parent.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Linked Children */}
                      <td className="py-4 px-4">
                        <div className="flex flex-wrap gap-1.5">
                          {parent.childrenList.map((child, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#FAFBF7] border border-[#ECEDEC] text-xs text-[#121314]"
                            >
                              <span>🧒</span>
                              <strong className="font-semibold">{child.childName}</strong>
                              <span className="text-[#9FA2A1] text-[10px]">({child.className})</span>
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Role Badge: Cố định là Phụ huynh (CANH GIỮA) */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBE8E2] text-[#8A4F42] border border-[#FAC4CD]/50">
                          Phụ huynh
                        </span>
                      </td>

                      {/* Status (CANH GIỮA) */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center justify-center gap-1.5 text-xs text-[#55B38F] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#55B38F]" />
                          Đang kích hoạt
                        </span>
                      </td>

                      {/* Actions (CANH GIỮA) */}
                      <td className="py-4 px-6 text-center">
                        <div className="inline-flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F8F8F9] hover:bg-[#EAF7FC] text-[#17627D] border border-[#ECEDEC] transition-all"
                          >
                            Đặt lại MK
                          </button>
                          <button
                            type="button"
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0F2] hover:bg-[#FFE3EC] text-[#E8916E] border border-[#FAC4CD]/50 transition-all"
                          >
                            Tạm khóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 px-4 text-center flex flex-col items-center justify-center">
              <p className="text-xs text-[#606363]">Không tìm thấy phụ huynh phù hợp.</p>
            </div>
          )
        )}
      </div>

      {/* 5. MODAL PHÂN QUYỀN NHÂN SỰ AN TOÀN (D48 Role Revocation Compliant) */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-[#121314]/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#FEFEFE] rounded-3xl p-6 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-[#ECEDEC] space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#F3F4F3] pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">🛡️</span>
                <h3 className="font-bold text-base text-[#121314]">
                  Phân quyền nhân sự
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="w-7 h-7 rounded-full bg-[#F8F8F9] text-[#606363] hover:text-[#121314] flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div>
              <p className="text-xs text-[#606363]">Nhân sự được điều chỉnh:</p>
              <p className="text-sm font-bold text-[#121314] mt-0.5">
                {roleModalUser.fullName} ({roleModalUser.email})
              </p>
            </div>

            {/* Cảnh báo bảo mật nghiệp vụ */}
            <div className="p-3.5 rounded-2xl bg-[#FFF9E6] border border-[#FFF3DD] text-xs text-[#7A5B00] space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Quy định bảo mật & phân quyền an toàn:</span>
              </p>
              <p className="text-[11px] leading-relaxed">
                Chỉ được luân chuyển trong nhóm nhân sự nội bộ trường. Việc thay đổi vai trò sẽ lập tức thu hồi toàn bộ token đăng nhập trên mọi thiết bị và áp dụng phạm vi phân quyền mới.
              </p>
            </div>

            {/* Chọn vai trò mới */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#121314]">
                Chọn vai trò công tác mới:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "Teacher", label: "Giáo viên", desc: "Điểm danh & Dạy lớp" },
                  { id: "Accountant", label: "Kế toán", desc: "Học phí & Hồ sơ" },
                  { id: "Medical", label: "Y tế", desc: "Sức khỏe & Sự cố" },
                  { id: "Admin", label: "Ban Giám Hiệu", desc: "Quản trị toàn trường" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedNewRole(item.id as any)}
                    className={`p-3 rounded-2xl border text-left transition-all ${selectedNewRole === item.id
                      ? "bg-[#E8F8F1] border-[#55B38F] text-[#1A624C] shadow-2xs"
                      : "bg-[#F8F8F9] border-[#ECEDEC] text-[#606363] hover:bg-[#F3F4F3]"
                      }`}
                  >
                    <p className="font-bold text-xs">{item.label}</p>
                    <p className="text-[10px] text-[#9FA2A1] mt-0.5">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[#606363] hover:bg-[#F8F8F9] transition-all"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmRoleChange}
                className="px-5 py-2 rounded-full text-xs font-bold bg-[#55B38F] hover:bg-[#1A624C] text-white shadow-sm shadow-[#55B38F]/20 transition-all"
              >
                Xác nhận đổi quyền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
