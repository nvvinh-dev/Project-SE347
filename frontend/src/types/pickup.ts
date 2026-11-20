// Phản chiếu DTO phụ huynh quản lý người đón (FR-PICKUP-03, D24, D45, D53).

/** `priority` theo PickupPersonPriorities của backend: 1 = người đón chính, 2 = người dự phòng. */
export type PickupPriority = 1 | 2;

export const PICKUP_PRIMARY: PickupPriority = 1;
export const PICKUP_BACKUP: PickupPriority = 2;

// `facePhotoUrl` là URL ký hạn 60 phút (D53), hết hạn thì xin lại qua API.
export interface PickupPersonResponse {
  id: string;
  priority: PickupPriority;
  fullName: string;
  relationship: string;
  phoneNumber: string;
  citizenIdNumber: string;
  facePhotoUrl: string;
}

// 4 thông tin + ảnh; `consentConfirmed` luôn gửi true vì nút Lưu chỉ bật khi đã đánh dấu (D24).
// Không gửi thời điểm hay người xác nhận: server tự ghi (D44 mục 2).
export interface PickupPersonInput {
  fullName: string;
  relationship: string;
  phoneNumber: string;
  citizenIdNumber: string;
  /** Bắt buộc khi thêm mới; khi sửa không gửi thì giữ ảnh cũ. */
  facePhoto?: File;
}
