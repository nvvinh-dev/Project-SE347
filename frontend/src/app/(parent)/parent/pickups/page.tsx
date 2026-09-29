"use client";

import { PageHeader } from "@/components/layout/AppHeader";
import { StatusPill } from "@/components/ui/StatusPill";

export default function PickupsPage() {
  return (
    <>
      <PageHeader
        title="Người đón trẻ đã đăng ký"
        description="Mỗi trẻ có đúng 1 người đón chính và tối đa 1 người dự phòng"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Khung 1: Người đón chính (Bắt buộc, không có nút xóa) */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#247A60] bg-[#F0FAF6] border border-[#C4EDE0] px-2.5 py-1 rounded-full">
                Người đón chính (Bắt buộc)
              </span>
              <StatusPill variant="success" dot>Đã đăng ký</StatusPill>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-lg bg-[#F3F2F7] border border-[#E8E8EC] flex items-center justify-center text-xs font-bold text-[#6A677B] shrink-0">
                Ảnh 3x4
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-sm font-bold text-[#16141F]">Trần Thu Hà</p>
                <p className="text-[#247A60] font-semibold">Mối liên hệ: Mẹ</p>
                <p className="text-[#6A677B]">Số điện thoại: <strong className="text-[#16141F]">0901.234.567</strong></p>
                <p className="text-[#6A677B]">Số CCCD: <strong className="text-[#16141F]">079194008924</strong></p>
              </div>
            </div>

            <div className="text-[11px] text-[#30A46C] bg-[#ECFDF5] border border-[#A7F3D0] p-2.5 rounded-lg">
              ✓ Đã xác nhận đồng ý cung cấp thông tin phục vụ an toàn đón trẻ.
            </div>
          </div>

          <p className="text-[11px] text-[#6A677B] mt-4 pt-3 border-t border-[#F3F2F7]">
            Người đón chính chỉ có thể thay đổi thông tin, không thể xóa.
          </p>
        </div>

        {/* Khung 2: Người dự phòng (Tùy chọn) */}
        <div className="bg-white rounded-xl border border-[#E8E8EC] p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#6A677B] bg-[#F3F2F7] border border-[#E8E8EC] px-2.5 py-1 rounded-full">
                Người dự phòng (Tối đa 1 người)
              </span>
              <StatusPill variant="neutral" dot>Đã đăng ký</StatusPill>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-14 h-14 rounded-lg bg-[#F3F2F7] border border-[#E8E8EC] flex items-center justify-center text-xs font-bold text-[#6A677B] shrink-0">
                Ảnh 3x4
              </div>
              <div className="space-y-1 text-xs">
                <p className="text-sm font-bold text-[#16141F]">Nguyễn Văn Hùng</p>
                <p className="text-[#247A60] font-semibold">Mối liên hệ: Bố</p>
                <p className="text-[#6A677B]">Số điện thoại: <strong className="text-[#16141F]">0912.345.678</strong></p>
                <p className="text-[#6A677B]">Số CCCD: <strong className="text-[#16141F]">079192003456</strong></p>
              </div>
            </div>

            <div className="text-[11px] text-[#30A46C] bg-[#ECFDF5] border border-[#A7F3D0] p-2.5 rounded-lg">
              ✓ Đã xác nhận đồng ý cung cấp thông tin phục vụ an toàn đón trẻ.
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F3F2F7] flex items-center justify-between">
            <span className="text-[11px] text-[#6A677B]">Người dự phòng có thể xóa khi không cần.</span>
            <button className="text-xs font-semibold text-[#E5484D] hover:underline">
              Xóa người dự phòng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}