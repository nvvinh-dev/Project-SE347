using System.Text.Json.Serialization;

namespace NhaTre.Application.DTOs.Classes;

// FR-CLASS-03, FR-CLASS-04: body chung của tạo lớp (POST) và sửa lớp (PUT). Cả 4 trường bắt buộc có mặt
// trong JSON, kể cả khi sĩ số là null (không giới hạn): sửa lớp mà thiếu trường sĩ số thì 400, không bị
// hiểu thành bỏ giới hạn. Không có trường tuổi: khoảng tuổi lấy từ khối (D39 mục 3)
public record SaveClassRequest(
    [property: JsonRequired] short GradeLevelId,
    [property: JsonRequired] string Name,
    [property: JsonRequired] int? MinCapacity,
    [property: JsonRequired] int? MaxCapacity);
