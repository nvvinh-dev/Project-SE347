/**
 * Kiểu dữ liệu phản ánh chính xác DTOs Backend của Module Lớp (Classes & Class Placements)
 * Tương ứng với NhaTre.Application/DTOs/Classes/
 */

export interface GradeLevelResponse {
  id: number;
  name: string;
  minAgeMonths: number;
  maxAgeMonths: number;
}

export interface ClassGradeLevelResponse {
  id: number;
  name: string;
}

export interface ClassTeacherResponse {
  userId: string;
  fullName: string;
}

export interface ClassResponse {
  id: string;
  name: string;
  gradeLevel: ClassGradeLevelResponse;
  minAgeMonths: number;
  maxAgeMonths: number;
  minCapacity: number | null;
  maxCapacity: number | null;
  childCount: number;
  homeroomTeacher: ClassTeacherResponse | null;
  assistantTeachers: ClassTeacherResponse[];
}

/**
 * Body tạo hoặc sửa lớp học (POST /api/classes, PUT /api/classes/{id})
 * [property: JsonRequired] trên cả 4 trường: bắt buộc gửi đủ gradeLevelId, name, minCapacity, maxCapacity
 */
export interface SaveClassRequest {
  gradeLevelId: number;
  name: string;
  minCapacity: number | null;
  maxCapacity: number | null;
}

/**
 * AC-CLASS-04 & D45: Dữ liệu trả về khi xếp lớp là tối thiểu
 * Chỉ gồm Họ tên, Ngày sinh và Lớp hiện tại
 */
export interface ClassPlacementResponse {
  childId: string;
  fullName: string;
  dateOfBirth: string; // Định dạng YYYY-MM-DD
  classId: string | null;
  className: string | null;
}

/**
 * Body xếp trẻ vào lớp hoặc gỡ khỏi lớp (PUT /api/class-placements/{childId})
 * [property: JsonRequired] Guid? ClassId: Bắt buộc gửi key classId (null để gỡ lớp)
 */
export interface AssignClassRequest {
  classId: string | null;
}

/**
 * Body phân công hoặc gỡ giáo viên chủ nhiệm (PUT /api/classes/{id}/homeroom-teacher)
 * [property: JsonRequired] Guid? TeacherUserId: Bắt buộc gửi key teacherUserId (null để gỡ GVCN)
 */
export interface AssignHomeroomTeacherRequest {
  teacherUserId: string | null;
}

/**
 * Body phân công hoặc gỡ giáo viên phụ (PUT /api/classes/{id}/assistant-teachers)
 * FR-CLASS-02: Toàn bộ danh sách id giáo viên phụ, rỗng [] là gỡ hết
 * [property: JsonRequired] IReadOnlyList<Guid> TeacherUserIds: Bắt buộc gửi key teacherUserIds
 */
export interface AssignAssistantTeachersRequest {
  teacherUserIds: string[];
}
