import React from "react";

/**
 * 1. Sửa thông tin: Tone màu xám (Bút chì nghiêng phía trước + thẻ ID phía sau)
 */
export function EditUserIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {/* Thẻ ID phía sau bo góc */}
      <rect x="9" y="8" width="12" height="13" rx="2.5" fill="#6B7280" />
      <circle cx="15" cy="12.5" r="1.8" fill="white" />
      <path d="M11.5 18c0-1.8 1.5-2.8 3.5-2.8s3.5 1 3.5 2.8" fill="white" />
      {/* Cây bút chì nghiêng 45 độ phía trước */}
      <path
        d="M11 3.5l2.8 2.8L5.2 15l-3.2 1 1-3.2L11 3.5z"
        fill="#374151"
        stroke="#FFFFFF"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 2. Đổi vai trò: Icon người dùng với tone màu tím và mũi tên xám
 */
export function ChangeRoleIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {/* Avatar người dùng góc trên bên trái (Tròn tím) */}
      <circle cx="7.5" cy="7.5" r="5" fill="#C026D3" />
      <circle cx="7.5" cy="6.2" r="1.5" fill="#374151" />
      <path d="M4.5 11c.5-1.5 1.5-2 3-2s2.5.5 3 2" fill="#374151" />
      {/* Avatar người dùng góc dưới bên phải (Tròn tím) */}
      <circle cx="16.5" cy="16.5" r="5" fill="#C026D3" />
      <circle cx="16.5" cy="15.2" r="1.5" fill="#374151" />
      <path d="M13.5 20c.5-1.5 1.5-2 3-2s2.5.5 3 2" fill="#374151" />
      {/* Mũi tên trên chĩa sang phải */}
      <path
        d="M14 6h5m0 0l-2-2m2 2l-2 2"
        stroke="#4B5563"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Mũi tên dưới chĩa sang trái */}
      <path
        d="M10 18H5m0 0l2-2m-2 2l2 2"
        stroke="#4B5563"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 3. Đặt lại MK: Chìa khoá màu vàng kèm mũi tên reset màu xám
 */
export function ResetPasswordIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {/* Chìa khóa màu vàng */}
      <path
        d="M10.8 7.5a3.8 3.8 0 1 0-5.5 3.5l-.8.8v2.5h2.5v-1.2h1.3v-1.3l1.5-1.5a3.8 3.8 0 0 0 1-2.8z"
        fill="#EAB308"
      />
      <circle cx="7.2" cy="6.2" r="1.1" fill="white" />
      {/* Mũi tên xoay tròn reset màu xám */}
      <path
        d="M15.5 11a5 5 0 1 1-3.5 8.5"
        stroke="#4B5563"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M15.5 8v3.5H12"
        stroke="#4B5563"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * 4. Khóa (Khóa đóng): Ổ khóa đóng màu đỏ
 */
export function LockUserIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {/* Còng khóa đóng màu xám đậm */}
      <path
        d="M7.5 11V7a4.5 4.5 0 0 1 9 0v4"
        stroke="#4B5563"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Thân ổ khóa màu đỏ bo góc */}
      <rect x="4.5" y="11" width="15" height="11" rx="2.5" fill="#EF4444" />
      {/* Lỗ khóa màu trắng */}
      <circle cx="12" cy="15.5" r="1.3" fill="white" />
      <path d="M11.3 16.5h1.4l.4 2.5h-2.2l.4-2.5z" fill="white" />
    </svg>
  );
}

/**
 * 5. Mở khóa: Ổ khóa mở màu xanh lá cây
 */
export function UnlockUserIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      {/* Còng khóa mở màu xám đậm */}
      <path
        d="M7.5 11V7a4.5 4.5 0 0 1 8.5-2"
        stroke="#4B5563"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Thân ổ khóa màu xanh lá bo góc */}
      <rect x="4.5" y="11" width="15" height="11" rx="2.5" fill="#22C55E" />
      {/* Lỗ khóa màu trắng */}
      <circle cx="12" cy="15.5" r="1.3" fill="white" />
      <path d="M11.3 16.5h1.4l.4 2.5h-2.2l.4-2.5z" fill="white" />
    </svg>
  );
}
