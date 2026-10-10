using System.Text.Json.Serialization;

namespace NhaTre.Application.DTOs.Children;

// GuardianUserId là id tài khoản Phụ huynh Kế toán chọn từ danh sách tài khoản (D39 mục 16).
// Trường bắt buộc có mặt trong JSON, giống AssignClassRequest
public record LinkGuardianRequest([property: JsonRequired] Guid GuardianUserId);
