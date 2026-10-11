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
import { UserRoleBadge } from "@/components/admin/users/UserRoleBadge";
import { UserStatusBadge } from "@/components/admin/users/UserStatusBadge";
import { AddUserModal } from "@/components/admin/users/AddUserModal";
import { EditUserModal } from "@/components/admin/users/EditUserModal";
import { ChangeRoleModal } from "@/components/admin/users/ChangeRoleModal";
import { ResetPasswordModal } from "@/components/admin/users/ResetPasswordModal";
import type { UserResponse } from "@/types/user";

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading, isError, error, refetch } = useUsers();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

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

  // Filtered User List
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((u) => {
      // 1. Search term (fullName or email)
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        term === "" ||
        u.fullName.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term);

      // 2. Role filter
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

      // 3. Status filter
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && u.isActive) ||
        (statusFilter === "INACTIVE" && !u.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Summary counts
  const stats = useMemo(() => {
    if (!users) return { total: 0, active: 0, inactive: 0 };
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
    };
  }, [users]);

  const hasActiveFilters = searchTerm !== "" || roleFilter !== "ALL" || statusFilter !== "ALL";

  const handleResetFilters = () => {
    setSearchTerm("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
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
          description="Danh sách người dùng và phân quyền 5 vai trò hệ thống"
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
            <span>+ Thêm tài khoản mới</span>
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

      {/* 4. Filter Toolbar Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        {/* Search & Status Counts */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Search Input */}
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="Tìm theo họ tên hoặc email..."
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

          {/* Quick Stats Badges */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 text-xs">
            <span className="px-3 py-1 rounded-full bg-background border border-border text-muted font-medium">
              Tổng số: <strong className="text-foreground font-bold">{stats.total}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[#18794E] font-medium">
              Hoạt động: <strong className="font-bold">{stats.active}</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-[#F8F8F9] border border-[#E8E8EC] text-[#737373] font-medium">
              Đã khóa: <strong className="font-bold">{stats.inactive}</strong>
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-1 rounded-full bg-card hover:bg-background border border-border text-xs font-semibold text-muted hover:text-foreground transition-all cursor-pointer"
              >
                ✕ Đặt lại lọc
              </button>
            )}
          </div>
        </div>

        {/* Filter Selection Chips */}
        <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Role Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-muted mr-1 uppercase tracking-wider shrink-0">
              Vai trò:
            </span>
            {[
              { label: "Tất cả", value: "ALL" },
              { label: "Admin", value: "Admin" },
              { label: "Giáo viên", value: "Teacher" },
              { label: "Kế toán", value: "Accountant" },
              { label: "Y tế", value: "Medical" },
              { label: "Phụ huynh", value: "Parent" },
            ].map((r) => {
              const isActive = roleFilter === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRoleFilter(r.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#42B591] text-white shadow-2xs"
                      : "bg-background text-muted hover:text-foreground hover:bg-border/40"
                  }`}
                >
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Status Filter Dropdown / Chips */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted mr-1 uppercase tracking-wider shrink-0">
              Trạng thái:
            </span>
            {[
              { label: "Tất cả", value: "ALL" },
              { label: "Hoạt động", value: "ACTIVE" },
              { label: "Đã vô hiệu hóa", value: "INACTIVE" },
            ].map((s) => {
              const isActive = statusFilter === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setStatusFilter(s.value)}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? "bg-foreground text-background"
                      : "bg-background text-muted hover:text-foreground hover:bg-border/40"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Data Table Section with 3 UI States */}
      <div className="rounded-3xl border border-border bg-card shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-8">
            <StatusMessage status="loading" title="Đang tải danh sách người dùng..." />
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
              title="Không tìm thấy tài khoản phù hợp"
              message={
                hasActiveFilters
                  ? "Không có tài khoản nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại."
                  : "Hệ thống chưa có người dùng nào được tạo."
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-background/60 border-b border-border text-muted uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3.5 px-6">Người dùng</th>
                  <th className="py-3.5 px-4 text-center">Vai trò hệ thống</th>
                  <th className="py-3.5 px-4 text-center">Trạng thái</th>
                  <th className="py-3.5 px-6 text-center">Thao tác tài khoản</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredUsers.map((u) => {
                  const isCurrentAdmin =
                    currentUser?.userId === u.id || (currentUser?.role === "Admin" && currentUser?.userId === u.id);

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-background/40 transition-colors"
                    >
                      {/* Name, Email, Avatar */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-subtle text-brand font-bold text-xs flex items-center justify-center shrink-0 border border-brand-border/40">
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

                      {/* Role Badge (Centered) */}
                      <td className="py-4 px-4 text-center align-middle">
                        <UserRoleBadge role={u.role} />
                      </td>

                      {/* Status Badge (Centered) */}
                      <td className="py-4 px-4 text-center align-middle">
                        <UserStatusBadge isActive={u.isActive} />
                      </td>

                      {/* Action Buttons (Centered) */}
                      <td className="py-4 px-6 text-center align-middle">
                        <div className="inline-flex items-center justify-center gap-2 flex-wrap">
                          {/* 1. Sửa thông tin */}
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-background hover:bg-card text-foreground border border-border hover:border-border-hover transition-all cursor-pointer"
                          >
                            Sửa thông tin
                          </button>

                          {/* 2. Đổi vai trò (ẨN HOÀN TOÀN TRÊN TÀI KHOẢN HIỆN HÀNH: AC-USER-08 & D39 MỤC 7) */}
                          {!isCurrentAdmin && (
                            <button
                              type="button"
                              onClick={() => setRoleModalUser(u)}
                              className="px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F0FF] hover:bg-[#ECE4FF] text-[#583F8C] border border-[#E3D8FF] transition-all cursor-pointer"
                            >
                              Đổi vai trò
                            </button>
                          )}

                          {/* 3. Đặt lại mật khẩu */}
                          <button
                            type="button"
                            onClick={() => setPasswordModalUser(u)}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF9E6] hover:bg-[#FFF3DD] text-[#7A5B00] border border-[#FFE8B8] transition-all cursor-pointer"
                          >
                            Đặt lại MK
                          </button>

                          {/* 4. Vô hiệu hóa / Kích hoạt lại (ẨN HOÀN TOÀN TRÊN TÀI KHOẢN HIỆN HÀNH: AC-USER-08 & D39 MỤC 7) */}
                          {isCurrentAdmin ? (
                            <span className="text-[11px] text-muted italic ml-1">
                              (Tài khoản hiện hành)
                            </span>
                          ) : u.isActive ? (
                            <button
                              type="button"
                              onClick={() => setDeactivatingUser(u)}
                              className="px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF0F2] hover:bg-[#FFE3EC] text-[#E5484D] border border-[#FECACA] transition-all cursor-pointer"
                            >
                              Khóa
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setActivatingUser(u)}
                              className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E8F8F1] hover:bg-[#D1F2E3] text-[#1A624C] border border-[#A7E5D2] transition-all cursor-pointer"
                            >
                              Mở lại
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
        )}
      </div>

      {/* 6. MODALS & DIALOGS */}
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
