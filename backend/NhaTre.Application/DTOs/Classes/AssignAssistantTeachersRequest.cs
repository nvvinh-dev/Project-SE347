using System.Text.Json.Serialization;

namespace NhaTre.Application.DTOs.Classes;

// FR-CLASS-02: toàn bộ danh sách giáo viên phụ của lớp, mỗi phần tử là id tài khoản vai trò Giáo viên;
// backend tự tìm hồ sơ teachers. Danh sách rỗng là gỡ hết. Trường bắt buộc có mặt trong JSON: thiếu
// trường là 400, không bị hiểu thành gỡ hết
public record AssignAssistantTeachersRequest([property: JsonRequired] IReadOnlyList<Guid> TeacherUserIds);
