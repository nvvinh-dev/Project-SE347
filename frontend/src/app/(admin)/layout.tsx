"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { LogoutModal } from "@/components/admin/LogoutModal";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // Bảo vệ route: Nếu không có phiên thì chuyển về trang đăng nhập
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login");
    }
  }, [isLoading, user, router]);

  // Trạng thái đang khôi phục phiên (Loading state)
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F8F9] flex flex-col items-center justify-center p-4">
        <div className="bg-[#FEFEFE] rounded-3xl p-8 border border-[#ECEDEC] shadow-[0_8px_30px_rgba(30,60,50,0.06)] flex flex-col items-center max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#E8F8F1] text-[#55B38F] flex items-center justify-center animate-bounce">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 20h10" />
              <path d="M10 20c5.5-2.5.8-6.4 3-10" />
              <path d="M9.5 9.4c1.1.8 1.8 2.2 2.3 3.7-2 .4-3.5.4-4.8-.3-1.2-.6-2.3-1.9-3-4.2 2.8-.5 4.4-.1 5.5.8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-bold text-[#121314]">Đang tải dữ liệu...</h2>
            <p className="text-xs text-[#606363] mt-1">
              Đang xác thực thông tin Quản trị viên
            </p>
          </div>
          <div className="w-24 h-1.5 bg-[#E8F8F1] rounded-full overflow-hidden">
            <div className="h-full bg-[#55B38F] rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Chưa đăng nhập: Render null trong khi chờ useEffect chuyển trang
  if (!user) {
    return null;
  }

  // Người dùng đăng nhập nhưng không có vai trò Admin (Access Denied)
  if (user.role !== "Admin") {
    return (
      <div className="min-h-screen bg-[#F8F8F9] flex flex-col items-center justify-center p-4">
        <div className="bg-[#FEFEFE] rounded-3xl p-8 border border-[#FAC4CD] shadow-[0_8px_30px_rgba(30,60,50,0.06)] flex flex-col items-center max-w-md w-full text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#FFF5F6] text-[#E8916E] flex items-center justify-center">
            <svg
              className="w-7 h-7"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#121314]">Truy cập bị từ chối</h2>
            <p className="text-xs text-[#606363] mt-1.5 leading-relaxed">
              Tài khoản của bạn ({user.role}) không có quyền truy cập vào phân hệ Quản trị viên.
            </p>
          </div>
          <button
            onClick={() => setLogoutModalOpen(true)}
            className="px-5 py-2.5 rounded-full text-xs font-semibold bg-[#55B38F] hover:bg-[#1A624C] text-white transition-all shadow-sm"
          >
            Đăng nhập bằng tài khoản khác
          </button>
        </div>
        <LogoutModal
          isOpen={logoutModalOpen}
          onClose={() => setLogoutModalOpen(false)}
        />
      </div>
    );
  }

  // Layout chuẩn cho Quản trị viên
  return (
    <div className="min-h-screen bg-[#F8F8F9] text-[#121314] flex flex-col">
      {/* Sidebar cố định bên trái trên desktop, drawer trên mobile */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex-1 lg:pl-72 flex flex-col min-h-screen">
        <AdminHeader
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenLogout={() => setLogoutModalOpen(true)}
        />

        {/* Nội dung các trang con */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Popup xác nhận đăng xuất chuẩn D48 */}
      <LogoutModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
      />
    </div>
  );
}
