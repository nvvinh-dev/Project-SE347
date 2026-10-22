export type PickupMethod = "Primary" | "Backup" | "PhoneConfirmed";

export interface PickupPerson {
  id: string;
  priority: 1 | 2;
  fullName: string;
  relationship: string;
  phoneNumber: string;
  citizenIdNumber: string;
  facePhotoUrl: string;
}

export interface PickupRecord {
  id: string;
  attendanceId: string;
  childId: string;
  childFullName: string;
  pickupTimeUtc: string;
  pickupMethod: PickupMethod;
  pickerFullName: string;
  confirmedByName: string | null;
}

export interface CreatePickupRequest {
  childId: string;
  pickupPersonId: string;
  pickupMethod: PickupMethod;
  pickerFullName?: string;
}

export const PICKUP_METHOD_LABELS: Record<PickupMethod, string> = {
  Primary: "Người đón chính",
  Backup: "Người dự phòng",
  PhoneConfirmed: "Đã xác nhận qua điện thoại",
};
