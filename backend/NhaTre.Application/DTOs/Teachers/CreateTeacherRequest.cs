using System.Text.Json.Serialization;

namespace NhaTre.Application.DTOs.Teachers;

// UserId là id tài khoản vai trò Giáo viên Kế toán chọn từ danh sách tài khoản chưa có hồ sơ.
// Trường bắt buộc có mặt trong JSON, giống LinkGuardianRequest
public record CreateTeacherRequest([property: JsonRequired] Guid UserId);
