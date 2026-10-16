using System.Text.Json.Serialization;

namespace NhaTre.Application.DTOs.Classes;

// ClassId = null là gỡ trẻ khỏi lớp (trẻ nghỉ học, D39 mục 2). Trường bắt buộc có mặt trong JSON:
// thiếu trường hay gõ sai tên trường thì 400, không bị hiểu thành null rồi gỡ trẻ khỏi lớp.
// Không có trường tuổi: tuổi luôn tính từ ngày sinh đã lưu (BR-CLASS-03)
public record AssignClassRequest([property: JsonRequired] Guid? ClassId);
