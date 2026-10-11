"use client";

import React, { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  useUsers,
  useDeactivateUser,
  useActivateUser,
} from "@/hooks/useUsers";
import { toApiError } from "@/lib/axios";
import { PageHeader } from "@/components/layout/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { Pagination } from "@/components/ui/Pagination";
import { UserRoleBadge } from "@/components/admin/users/UserRoleBadge";
import { UserStatusBadge } from "@/components/admin/users/UserStatusBadge";
import { AddUserModal } from "@/components/admin/users/AddUserModal";
import { EditUserModal } from "@/components/admin/users/EditUserModal";
import { ChangeRoleModal } from "@/components/admin/users/ChangeRoleModal";
import { ResetPasswordModal } from "@/components/admin/users/ResetPasswordModal";
import {
  EditUserIcon,
  ChangeRoleIcon,
  ResetPasswordIcon,
  LockUserIcon,
  UnlockUserIcon,
} from "@/components/admin/users/UserActionIcons";
import type { UserResponse } from "@/types/user";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, isError, error, refetch } = useUsers();

  // Tab State: Tách biệt Nhân sự nhà trường & Phụ huynh học sinh
  const [activeTab, setActiveTab] = useState<"staff" | "parents">("staff");

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Pagination State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Notification Alerts
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Modal Dialog States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<UserResponse | null>(null);
  const [passwordModalUser, setPasswordModalUser] = useState<UserResponse | null>(null);
  const [deactivatingUser, setDeactivatingUser] = useState<UserResponse | null>(null);
  const [activatingUser, setActivatingUser] = useState<UserResponse | null>(null);

  // Mutations
  const deactivateUser = useDeactivateUser();
  const activateUser = useActivateUser();

  const handleShowSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setActionError(null);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 6000);
  };

  // Split users into Staff and Parents
  const staffList = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => u.role !== "Parent");
  }, [users]);

  const parentList = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => u.role === "Parent");
  }, [users]);

  // Counts for Staff role filters
  const staffRoleCounts = useMemo(() => {
    return {
      Admin: staffList.filter((u) => u.role === "Admin").length,
      Teacher: staffList.filter((u) => u.role === "Teacher").length,
      Accountant: staffList.filter((u) => u.role === "Accountant").length,
      Medical: staffList.filter((u) => u.role === "Medical").length,
    };
  }, [staffList]);

  // Counts for Status filters
  const staffStatusCounts = useMemo(() => {
    return {
      active: staffList.filter((u) => u.isActive).length,
      inactive: staffList.filter((u) => !u.isActive).length,
    };
  }, [staffList]);

  const parentStatusCounts = useMemo(() => {
    return {
      active: parentList.filter((u) => u.isActive).length,
      inactive: parentList.filter((u) => !u.isActive).length,
    };
  }, [parentList]);

  // Filtered List based on Active Tab
  const filteredUsers = useMemo(() => {
    const sourceList = activeTab === "staff" ? staffList : parentList;
    const term = searchTerm.trim().toLowerCase();

    return sourceList.filter((u) => {
      // 1. Search term (fullName or email)
      const matchesSearch =
        term === "" ||
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);

      // 2. Role filter (chỉ áp dụng cho Staff)
      const matchesRole =
        activeTab === "parents" ||
        staffRoleFilter === "ALL" ||
        u.role === staffRoleFilter;

      // 3. Status filter
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.isActive) ||
        (statusFilter === "INACTIVE" && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [activeTab, staffList, parentList, searchTerm, staffRoleFilter, statusFilter]);

  // Calculate safe page to prevent out-of-range when filtering
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const safePage = Math.min(page, totalPages);

  // Paginated records
  const paginatedUsers = useMemo(() => {
    const startIndex = (safePage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, safePage, pageSize]);

  const hasActiveFilters =
    searchTerm !== "" ||
    (activeTab === "staff" && staffRoleFilter !== "ALL") ||
    statusFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchTerm("");
    setStaffRoleFilter("ALL");
    setStatusFilter("ALL");
    setPage(1);
  };

  // Handle Confirm Deactivate
  const handleConfirmDeactivate = async () => {
    if (!deactivatingUser) return;
    try {
      await deactivateUser.mutateAsync(deactivatingUser.id);
      handleShowSuccess(
        `Đã vô hiệu hóa tài khoản "${deactivatingUser.fullName}". Quyền truy cập đã bị khóa ngay lập tức.`
      );
      setDeactivatingUser(null);
    } catch (err) {
      const apiErr = toApiError(err);
      setActionError(apiErr.errors?.join(". ") || apiErr.message);
      setDeactivatingUser(null);
    }
  };

  // Handle Confirm Activate
  const handleConfirmActivate = async () => {
    if (!activatingUser) return;
    try {
      await activateUser.mutateAsync(activatingUser.id);
      handleShowSuccess(
        `Đã kích hoạt lại thành công tài khoản "${activatingUser.fullName}". Người dùng có thể đăng nhập bình thường.`
      );
      setActivatingUser(null);
    } catch (err) {
      const apiErr = toApiError(err);
      setActionError(apiErr.errors?.join(". ") || apiErr.message);
      setActivatingUser(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Page Header & Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Quản lý tài khoản"
          description="Quản trị nhân sự nhà trường và tài khoản phụ huynh theo từng phân hệ nghiệp vụ"
        />
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#42B591] hover:bg-[#36A07F] active:bg-[#2B876B] text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Thêm tài khoản mới</span>
          </button>
        </div>
      </div>

      {/* 2. Success Alert (Pastel Mint) */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-[#E8F8F1] border border-[#A7E5D2] text-[#1A624C] text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#1A624C] text-white text-[10px] font-bold">
              ✓
            </span>
            <span>{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 3. Action Error Alert (Pastel Red) */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] text-[#E5484D] text-xs font-medium flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="text-base">⚠️</span>
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-xs font-bold hover:underline cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* 4. TAB NAVIGATION: Đồng nhất màu sắc thương hiệu (#42B591) khi Active */}
      <div className="flex items-center gap-2.5 border-b border-border/60 pb-2">
        <button
          type="button"
          onClick={() => {
            setActiveTab("staff");
            setSearchTerm("");
            setStatusFilter("ALL");
            setStaffRoleFilter("ALL");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === "staff"
              ? "bg-[#42B591] text-white shadow-xs shadow-[#42B591]/25"
              : "bg-card text-muted border border-border hover:bg-background hover:text-foreground"
            }`}
        >
          <span>Nhân sự nhà trường</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "staff"
                ? "bg-white/20 text-white"
                : "bg-background text-muted"
              }`}
          >
            {staffList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab("parents");
            setSearchTerm("");
            setStatusFilter("ALL");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${activeTab === "parents"
              ? "bg-[#42B591] text-white shadow-xs shadow-[#42B591]/25"
              : "bg-card text-muted border border-border hover:bg-background hover:text-foreground"
            }`}
        >
          <span>Phụ huynh học sinh</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${activeTab === "parents"
                ? "bg-white/20 text-white"
                : "bg-background text-muted"
              }`}
          >
            {parentList.length}
          </span>
        </button>
      </div>

      {/* 5. Filter & Search Controls: Tích hợp số đếm trực tiếp vào các nút lọc */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        {/* Search Input & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <input
              type="text"
              placeholder={
                activeTab === "staff"
                  ? "Tìm theo họ tên hoặc email nhân sự..."
                  : "Tìm theo họ tên hoặc email phụ huynh..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted focus:outline-none focus:border-[#42B591] focus:ring-2 focus:ring-[#42B591]/20 transition-all"
            />
            <svg
              className="w-4 h-4 text-muted absolute left-3 top-3 pointer-events-none"
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

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3.5 py-2 rounded-full bg-background hover:bg-card border border-border text-xs font-semibold text-muted hover:text-foreground transition-all cursor-pointer self-start sm:self-auto shrink-0"
            >
              ✕ Đặt lại bộ lọc
            </button>
          )}
        </div>

        {/* Detailed Filters with Integrated Counts */}
        <div className="pt-3 border-t border-border/50 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Tab 1: Role Filters for Staff (Integrated Counts) */}
          {activeTab === "staff" ? (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              <span className="text-[11px] font-bold text-muted mr-1 uppercase tracking-wider shrink-0">
                Vai trò:
              </span>
              {[
                { label: `Tất cả (${staffList.length})`, value: "ALL" },
                { label: `Admin (${staffRoleCounts.Admin})`, value: "Admin" },
                { label: `Giáo viên (${staffRoleCounts.Teacher})`, value: "Teacher" },
                { label: `Kế toán (${staffRoleCounts.Accountant})`, value: "Accountant" },
                { label: `Y tế (${staffRoleCounts.Medical})`, value: "Medical" },
              ].map((r) => {
                const isActive = staffRoleFilter === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setStaffRoleFilter(r.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${isActive
                        ? "bg-[#42B591] text-white shadow-2xs"
                        : "bg-background text-muted hover:text-foreground hover:bg-border/40"
                      }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-muted flex items-center gap-2"></div>
          )}

          {/* Status Filter Chips (Integrated Counts) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 shrink-0">
            <span className="text-[11px] font-bold text-muted mr-1 uppercase tracking-wider shrink-0">
              Trạng thái:
            </span>
            {activeTab === "staff" ? (
              <>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter === "ALL"
                      ? "bg-foreground text-background"
                      : "bg-background text-muted hover:text-foreground hover:bg-border/40"
                    }`}
                >
                  Tất cả ({staffList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter === "ACTIVE"
                      ? "bg-[#18794E] text-white"
                      : "bg-background text-muted hover:text-foreground hover:bg-border/40"
                    }`}
                >
                  Hoạt động ({staffStatusCounts.active})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("INACTIVE")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter === "INACTIVE"
                      ? "bg-foreground text-background"
                      : "bg-background text-muted hover:text-foreground hover:bg-border/40"
                    }`}
                >
                  Đã khóa ({staffStatusCounts.inactive})
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter === "ALL"
                      ? "bg-foreground text-background"
                      : "bg-background text-muted hover:text-foreground hover:bg-border/40"
                    }`}
                >
                  Tất cả ({parentList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter === "ACTIVE"
                      ? "bg-[#18794E] text-white"
                      : "bg-background text-muted hover:text-foreground hover:bg-border/40"
                    }`}
                >
                  Hoạt động ({parentStatusCounts.active})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter("INACTIVE")}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${statusFilter === "INACTIVE"
                      ? "bg-foreground text-background"
                      : "bg-background text-muted hover:text-foreground hover:bg-border/40"
                    }`}
                >
                  Đã khóa ({parentStatusCounts.inactive})
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 6. Data Table Section with Circular Action Buttons & Client-side Pagination */}
      <div className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <StatusMessage
              status="loading"
              title={`Đang tải danh sách ${activeTab === "staff" ? "nhân sự" : "phụ huynh"}...`}
            />
          </div>
        ) : isError ? (
          <div className="p-8">
            <StatusMessage
              status="error"
              title="Không thể tải danh sách tài khoản"
              message={error?.message || "Đã xảy ra lỗi khi kết nối máy chủ. Vui lòng thử lại."}
              onRetry={() => refetch()}
            />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center">
            <StatusMessage
              status="empty"
              title={`Không tìm thấy ${activeTab === "staff" ? "nhân sự" : "phụ huynh"} phù hợp`}
              message={
                hasActiveFilters
                  ? "Không có tài khoản nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
                  : activeTab === "staff"
                    ? "Chưa có tài khoản nhân sự nào trong hệ thống."
                    : "Chưa có tài khoản phụ huynh nào trong hệ thống."
              }
              action={
                hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="mt-3 px-4 py-2 rounded-full text-xs font-semibold bg-[#42B591] text-white hover:bg-[#36A07F] transition-all cursor-pointer"
                  >
                    Xóa bộ lọc
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-background/60 border-b border-border text-muted uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3.5 px-6">
                      {activeTab === "staff" ? "Nhân sự nhà trường" : "Phụ huynh học sinh"}
                    </th>
                    {/* Cột Vai trò chỉ hiển thị ở Tab Nhân sự */}
                    {activeTab === "staff" && (
                      <th className="py-3.5 px-4 text-center">Vai trò hệ thống</th>
                    )}
                    <th className="py-3.5 px-4 text-center">Trạng thái</th>
                    <th className="py-3.5 px-6 text-center">Thao tác tài khoản</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {paginatedUsers.map((u) => {
                    const isCurrentAdmin = currentUser?.userId === u.id;

                    return (
                      <tr
                        key={u.id}
                        className="hover:bg-background/40 transition-colors"
                      >
                        {/* Name, Email, Avatar */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full font-bold text-xs flex items-center justify-center shrink-0 border ${activeTab === "staff"
                                  ? "bg-brand-subtle text-brand border-brand-border/40"
                                  : "bg-[#FFF0EB] text-[#E8916E] border-[#FAC4CD]/40"
                                }`}
                            >
                              {u.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-foreground text-sm">
                                  {u.fullName}
                                </p>
                                {isCurrentAdmin && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#E8F8F1] text-[#1A624C] border border-[#A7E5D2]">
                                    Bạn
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted mt-0.5">
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge (Chỉ hiển thị ở Tab Nhân sự) */}
                        {activeTab === "staff" && (
                          <td className="py-4 px-4 text-center align-middle">
                            <UserRoleBadge role={u.role} />
                          </td>
                        )}

                        {/* Status Badge */}
                        <td className="py-4 px-4 text-center align-middle">
                          <UserStatusBadge isActive={u.isActive} />
                        </td>

                        {/* Thao tác tài khoản: Bộ icon nút tròn chuẩn theo thiết kế Hình 2 */}
                        <td className="py-4 px-6 text-center align-middle">
                          <div className="inline-flex items-center justify-center gap-2.5">
                            {/* 1. Sửa thông tin: Tone màu xám */}
                            <button
                              type="button"
                              onClick={() => setEditingUser(u)}
                              className="w-8 h-8 rounded-full bg-[#E5E7EB]/70 hover:bg-[#D1D5DB] border border-[#D1D5DB]/80 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xs cursor-pointer"
                              aria-label="Sửa thông tin"
                              title="Sửa thông tin"
                            >
                              <EditUserIcon className="w-4 h-4" />
                            </button>

                            {/* 2. Đổi vai trò: Icon người dùng tone tím và mũi tên xám (Chỉ tab Nhân sự, ẩn trên Admin đang đăng nhập) */}
                            {activeTab === "staff" && !isCurrentAdmin && (
                              <button
                                type="button"
                                onClick={() => setRoleModalUser(u)}
                                className="w-8 h-8 rounded-full bg-[#F3E8FF]/80 hover:bg-[#E9D5FF] border border-[#DDD6FE] flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xs cursor-pointer"
                                aria-label="Đổi vai trò"
                                title="Đổi vai trò"
                              >
                                <ChangeRoleIcon className="w-4 h-4" />
                              </button>
                            )}

                            {/* 3. Đặt lại MK: Chìa khóa vàng kèm mũi tên reset xám */}
                            <button
                              type="button"
                              onClick={() => setPasswordModalUser(u)}
                              className="w-8 h-8 rounded-full bg-[#FEF9C3]/90 hover:bg-[#FEF08A] border border-[#FDE047]/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xs cursor-pointer"
                              aria-label="Đặt lại mật khẩu"
                              title="Đặt lại mật khẩu"
                            >
                              <ResetPasswordIcon className="w-4 h-4" />
                            </button>

                            {/* 4. Khóa / Mở khóa (Ẩn hoàn toàn trên tài khoản Admin đang đăng nhập) */}
                            {isCurrentAdmin ? (
                              <span className="text-xs text-muted font-normal italic ml-1">
                                (Tài khoản hiện hành)
                              </span>
                            ) : u.isActive ? (
                              /* Khóa (Khóa đóng): Ổ khóa đóng màu đỏ */
                              <button
                                type="button"
                                onClick={() => setDeactivatingUser(u)}
                                className="w-8 h-8 rounded-full bg-[#FEE2E2]/90 hover:bg-[#FECACA] border border-[#FCA5A5]/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xs cursor-pointer"
                                aria-label="Khóa tài khoản"
                                title="Khóa tài khoản"
                              >
                                <LockUserIcon className="w-4 h-4" />
                              </button>
                            ) : (
                              /* Mở khóa: Ổ khóa mở màu xanh lá cây */
                              <button
                                type="button"
                                onClick={() => setActivatingUser(u)}
                                className="w-8 h-8 rounded-full bg-[#DCFCE7]/90 hover:bg-[#BBF7D0] border border-[#86EFAC]/60 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-xs cursor-pointer"
                                aria-label="Mở khóa tài khoản"
                                title="Mở khóa tài khoản"
                              >
                                <UnlockUserIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Component (Chỉ hiện khi có từ 1 bản ghi trở lên) */}
            {filteredUsers.length > 0 && (
              <div className="p-4 border-t border-border/60">
                <Pagination
                  page={safePage}
                  pageSize={pageSize}
                  totalCount={filteredUsers.length}
                  pageSizeOptions={[5, 10, 20]}
                  onPageChange={setPage}
                  onPageSizeChange={(newSize) => {
                    setPageSize(newSize);
                    setPage(1);
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. MODALS & DIALOGS */}
      {/* Modal Thêm tài khoản mới */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleShowSuccess}
      />

      {/* Modal Sửa thông tin tài khoản */}
      <EditUserModal
        user={editingUser}
        isOpen={editingUser !== null}
        onClose={() => setEditingUser(null)}
        onSuccess={handleShowSuccess}
      />

      {/* Modal Đổi vai trò */}
      <ChangeRoleModal
        user={roleModalUser}
        isOpen={roleModalUser !== null}
        onClose={() => setRoleModalUser(null)}
        onSuccess={handleShowSuccess}
      />

      {/* Modal Đặt lại mật khẩu */}
      <ResetPasswordModal
        user={passwordModalUser}
        isOpen={passwordModalUser !== null}
        onClose={() => setPasswordModalUser(null)}
        onSuccess={handleShowSuccess}
      />

      {/* ConfirmDialog Vô hiệu hóa tài khoản (variant="destructive") */}
      <ConfirmDialog
        isOpen={deactivatingUser !== null}
        title="Xác nhận vô hiệu hóa tài khoản"
        variant="destructive"
        confirmText="Vô hiệu hóa tài khoản"
        cancelText="Hủy bỏ"
        isLoading={deactivateUser.isPending}
        onConfirm={handleConfirmDeactivate}
        onClose={() => !deactivateUser.isPending && setDeactivatingUser(null)}
        description={
          deactivatingUser ? (
            <div className="space-y-2">
              <p>
                Bạn có chắc chắn muốn vô hiệu hóa tài khoản của{" "}
                <strong className="text-foreground">{deactivatingUser.fullName}</strong> (
                {deactivatingUser.email})?
              </p>
              <div className="rounded-xl bg-[#FFF0F2] border border-[#FECACA] p-3 text-xs text-[#E5484D]">
                <p className="font-semibold">⚠️ Lưu ý an toàn hệ thống (AC-USER-03):</p>
                <p className="mt-1 text-[11px] leading-relaxed">
                  Tài khoản sẽ bị khóa quyền truy cập ngay lập tức ở request tiếp theo. Mọi bản ghi điểm danh, sự cố, hóa đơn do người dùng này tạo vẫn được bảo toàn nguyên vẹn.
                </p>
              </div>
            </div>
          ) : null
        }
      />

      {/* ConfirmDialog Kích hoạt lại tài khoản (variant="primary") */}
      <ConfirmDialog
        isOpen={activatingUser !== null}
        title="Kích hoạt lại tài khoản"
        variant="primary"
        confirmText="Kích hoạt tài khoản"
        cancelText="Hủy bỏ"
        isLoading={activateUser.isPending}
        onConfirm={handleConfirmActivate}
        onClose={() => !activateUser.isPending && setActivatingUser(null)}
        description={
          activatingUser ? (
            <div>
              <p>
                Khôi phục quyền truy cập cho tài khoản của{" "}
                <strong className="text-foreground">{activatingUser.fullName}</strong> (
                {activatingUser.email})?
              </p>
              <p className="mt-2 text-xs text-muted">
                Sau khi kích hoạt, người dùng có thể đăng nhập bình thường vào hệ thống với vai trò{" "}
                <strong className="text-foreground">{activatingUser.role}</strong>.
              </p>
            </div>
          ) : null
        }
      />
    </div>
  );
}
