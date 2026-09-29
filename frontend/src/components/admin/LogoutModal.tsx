"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/axios";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LogoutModal({ isOpen, onClose }: LogoutModalProps) {
  const router = useRouter();
  const { logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleConfirmLogout() {
    setIsSubmitting(true);
    try {
      // D48: Bắt buộc gọi API POST /api/auth/logout trước để backend thu hồi token
      await apiClient.post("/api/auth/logout");
    } catch {
      // Ngay cả khi request lỗi mạng, client vẫn dọn dẹp state và chuyển trang an toàn
    } finally {
      logout();
      onClose();
      router.push("/login");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-xs animate-in fade-in duration-200"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-md bg-[#FEFEFE] rounded-3xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(30,60,50,0.12)] border border-[#ECEDEC] relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Soft Peach Warning Icon */}
        <div className="w-14 h-14 rounded-2xl bg-[#FBE8E2] text-[#E8916E] flex items-center justify-center mb-5 mx-auto">
          <svg
            className="w-7 h-7"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
        </div>

        <div className="text-center space-y-2 mb-6">
          <h2 className="text-xl font-bold text-[#121314]">
            Xác nhận đăng xuất
          </h2>
          <p className="text-sm text-[#606363] leading-relaxed">
            Bạn có chắc chắn muốn kết thúc phiên làm việc Quản trị viên hiện tại không?
            Mọi thao tác chưa lưu có thể bị gián đoạn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="flex-1 py-3 px-5 rounded-full text-sm font-semibold border border-[#ECEDEC] text-[#606363] hover:bg-[#F8F8F9] hover:text-[#121314] transition-colors disabled:opacity-50"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmLogout}
            className="flex-1 py-3 px-5 rounded-full text-sm font-semibold bg-[#E8916E] hover:bg-[#D96B43] text-white shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
                <span>Đang xử lý...</span>
              </>
            ) : (
              <span>Đăng xuất</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
