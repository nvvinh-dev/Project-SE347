using System.Text.Json.Serialization;

namespace NhaTre.Application.DTOs.Classes;

// TeacherUserId là id tài khoản vai trò Giáo viên (Admin chọn từ danh sách tài khoản); backend tự tìm
// hồ sơ teachers của tài khoản đó. null là bỏ giáo viên chủ nhiệm của lớp. Trường bắt buộc có mặt
// trong JSON, giống AssignClassRequest
public record AssignHomeroomTeacherRequest([property: JsonRequired] Guid? TeacherUserId);
