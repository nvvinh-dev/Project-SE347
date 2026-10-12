import React from "react";

/**
 * 1. Sửa thông tin: Tone màu xám
 * - Thẻ ID xám bo góc phía sau có hình người trắng
 * - Bút chì to màu xám than nghiêng 45 độ đè phía trước bên trái
 */
export function EditUserIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Thẻ ID phía sau bo góc màu xám */}
      <rect x="7" y="6" width="14" height="15" rx="2.5" fill="#6B7280" />
      {/* Biểu tượng người màu trắng trên thẻ ID */}
      <circle cx="14" cy="11" r="2.2" fill="white" />
      <path d="M9.8 18c0-2.2 1.9-3.2 4.2-3.2s4.2 1 4.2 3.2" fill="white" />

      {/* Cây bút chì to màu xám đen nghiêng 45 độ đè lên phía trước bên trái */}
      <path
        d="M11 2.5l3.2 3.2L6 14l-3.5 1 1-3.5L11 2.5z"
        fill="#374151"
        stroke="white"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      {/* Vạch ngang phân tách ngòi bút màu trắng */}
      <path d="M4.5 12.5l2 2" stroke="white" strokeWidth="1" strokeLinecap="round" />
      {/* Chóp nhọn ngòi bút màu xám đậm hơn */}
      <path d="M2.5 15l1-3.5L6 14 2.5 15z" fill="#1F2937" />
    </svg>
  );
}

/**
 * 2. Đổi vai trò: Tone màu tím và mũi tên xám
 * - 2 hình tròn nền màu tím magenta ở 2 góc chéo
 * - Bên trong MỖI hình tròn tím có hình bóng người màu xám than
 * - 2 mũi tên xám hoán đổi (mũi tên trên sang phải, mũi tên dưới sang trái)
 */
export function ChangeRoleIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <clipPath id="role-avatar-1">
          <circle cx="7" cy="7" r="4.8" />
        </clipPath>
        <clipPath id="role-avatar-2">
          <circle cx="17" cy="17" r="4.8" />
        </clipPath>
      </defs>

      {/* 1. Hình tròn tím góc trên bên trái */}
      <circle cx="7" cy="7" r="4.8" fill="#df3deaff" />
      <g clipPath="url(#role-avatar-1)">
        <circle cx="7" cy="5.8" r="1.6" fill="#374151" />
        <path d="M3.2 11.8c.2-1.8 1.8-2.6 3.8-2.6s3.6.8 3.8 2.6v1H3.2v-1z" fill="#374151" />
      </g>

      {/* 2. Hình tròn tím góc dưới bên phải */}
      <circle cx="17" cy="17" r="4.8" fill="#df3deaff" />
      <g clipPath="url(#role-avatar-2)">
        <circle cx="17" cy="15.8" r="1.6" fill="#374151" />
        <path d="M13.2 21.8c.2-1.8 1.8-2.6 3.8-2.6s3.6.8 3.8 2.6v1h-7.6v-1z" fill="#374151" />
      </g>

      {/* 3. Mũi tên trên chĩa sang phải */}
      <path
        d="M13.5 6h6.5m-2.2-2.2l2.2 2.2-2.2 2.2"
        stroke="#4B5563"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 4. Mũi tên dưới chĩa sang trái */}
      <path
        d="M10.5 18H4m2.2-2.2L4 18l2.2 2.2"
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
 * - Chìa khóa màu vàng: Đầu tròn có lỗ trắng, thân nghiêng, răng cưa hướng sang phải khớp hõm mũi tên
 * - Mũi tên xám: Vòng cung tròn dày dặn, chóp mũi tên tam giác đặc to rõ hướng về thân chìa khóa
 */
export function ResetPasswordIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Chìa khóa màu vàng bên trái */}
      <circle cx="7.5" cy="7" r="4.2" fill="#EAB308" />
      <circle cx="7.5" cy="7" r="1.4" fill="white" />
      <rect x="6.3" y="7" width="2.4" height="11.5" rx="0.5" fill="#EAB308" />
      <path
        d="M6.3 14H4.2v2h2.1v1H4.5v1.5h1.8v.5h2.4v-5H6.3z"
        fill="#EAB308"
      />

      {/* 2. Vòng cung tròn reset màu xám */}
      <path
        d="M 11.8 17.2 A 4.3 4.3 0 1 0 13.8 10.8"
        fill="none"
        stroke="#374151"
        strokeWidth="2.3"
        strokeLinecap="round"
      />

      {/* 3. Đầu mũi tên tam giác đặc to rõ chỉ về phía thân chìa khóa */}
      <polygon
        points="10.8,11.2 14.1,8.6 13.8,13.2"
        fill="#374151"
      />
    </svg>
  );
}

/**
 * 4. Khóa (Khóa đóng): Ổ khóa đóng màu đỏ
 * - Còng khóa màu xám cắm chặt 2 đầu vào thân khóa
 * - Thân ổ khóa màu đỏ bo góc mềm mại
 * - Lỗ khóa màu trắng ở giữa
 */
export function LockUserIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Còng khóa đóng màu xám đậm dày dặn */}
      <path
        d="M8 10V6.5a4 4 0 0 1 8 0V10"
        stroke="#4B5563"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Thân ổ khóa màu đỏ bo góc mềm mại */}
      <rect x="5" y="10" width="14" height="11.5" rx="2.8" fill="#EF4444" />
      {/* Lỗ khóa màu trắng chuẩn */}
      <circle cx="12" cy="14.5" r="1.4" fill="white" />
      <path d="M11.2 15.3h1.6l.4 2.5h-2.4z" fill="white" />
    </svg>
  );
}

/**
 * 5. Mở khóa: Ổ khóa mở màu xanh lá cây
 * - Còng khóa màu xám nâng cao mở hổng góc phải
 * - Thân ổ khóa màu xanh lá cây bo góc mềm mại
 * - Lỗ khóa màu trắng ở giữa
 */
export function UnlockUserIcon({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Còng khóa mở màu xám đậm vểnh lên mở góc phải */}
      <path
        d="M8 10V6.2a4 4 0 0 1 7.8-1.5"
        stroke="#4B5563"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Thân ổ khóa màu xanh lá bo góc mềm mại */}
      <rect x="5" y="10" width="14" height="11.5" rx="2.8" fill="#22C55E" />
      {/* Lỗ khóa màu trắng chuẩn */}
      <circle cx="12" cy="14.5" r="1.4" fill="white" />
      <path d="M11.2 15.3h1.6l.4 2.5h-2.4z" fill="white" />
    </svg>
  );
}