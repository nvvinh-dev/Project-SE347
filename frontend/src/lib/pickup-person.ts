// Quy tắc kiểm tra form người đón (D24, D39 mục 5). Backend vẫn kiểm lại; đây chỉ để báo lỗi sớm.

export const PICKUP_NAME_MAX = 100;
export const PICKUP_RELATIONSHIP_MAX = 50;
export const PICKUP_PHOTO_MAX_BYTES = 5 * 1024 * 1024;

/** Câu xác nhận đồng ý, đúng từng chữ với D24 (DECISIONS.md): đây là bằng chứng đồng ý nên không tự viết lại. */
export const PICKUP_CONSENT_TEXT =
  "Tôi xác nhận người được đăng ký (hoặc chính tôi, nếu tôi tự đăng ký) đồng ý cung cấp họ tên, "
  + "số điện thoại, số CCCD và ảnh khuôn mặt để nhà trường xác minh khi đón trẻ. Thông tin chỉ phụ huynh "
  + "của trẻ và giáo viên phụ trách lớp của trẻ xem được, và bị xóa khi người này không còn được đăng ký.";

export function validatePickupName(value: string): true | string {
  const text = value.trim();
  if (!text) return "Họ tên người đón không được để trống.";
  return text.length <= PICKUP_NAME_MAX || `Họ tên người đón không được dài quá ${PICKUP_NAME_MAX} ký tự.`;
}

export function validatePickupRelationship(value: string): true | string {
  const text = value.trim();
  if (!text) return "Mối liên hệ với trẻ không được để trống.";
  return text.length <= PICKUP_RELATIONSHIP_MAX
    || `Mối liên hệ với trẻ không được dài quá ${PICKUP_RELATIONSHIP_MAX} ký tự.`;
}

export function validatePickupPhone(value: string): true | string {
  const text = value.trim();
  if (!text) return "Số điện thoại không được để trống.";
  return /^0[0-9]{9}$/.test(text) || "Số điện thoại phải gồm đúng 10 chữ số và bắt đầu bằng 0.";
}

export function validatePickupCitizenId(value: string): true | string {
  const text = value.trim();
  if (!text) return "Số CCCD không được để trống.";
  return /^[0-9]{12}$/.test(text) || "Số CCCD phải gồm đúng 12 chữ số.";
}

/** `required`: thêm mới bắt buộc có ảnh; sửa thì bỏ trống để giữ ảnh cũ. */
export function validatePickupPhoto(files: FileList | null | undefined, required: boolean): true | string {
  const file = files?.[0];
  if (!file) return required ? "Vui lòng chọn 1 ảnh khuôn mặt của người đón." : true;
  const okType = file.type === "image/jpeg" || file.type === "image/png";
  const okExt = /\.(jpe?g|png)$/i.test(file.name);
  if (!okType || !okExt) return "Ảnh khuôn mặt chỉ nhận định dạng JPEG hoặc PNG (.jpg, .jpeg, .png).";
  if (file.size <= 0) return "Ảnh khuôn mặt không được rỗng.";
  if (file.size > PICKUP_PHOTO_MAX_BYTES) return "Ảnh khuôn mặt không được lớn hơn 5 MB.";
  return true;
}

export function formatFileSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
