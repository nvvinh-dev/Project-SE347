namespace NhaTre.Application.DTOs.Classes;

// D45: Admin xếp lớp chỉ nhận họ tên, ngày sinh và lớp hiện tại của trẻ (AC-CLASS-04);
// không kèm ngày nhập học, lưu ý sức khỏe, điểm danh hay học phí
public record ClassPlacementResponse(
    Guid ChildId,
    string FullName,
    DateOnly DateOfBirth,
    Guid? ClassId,
    string? ClassName);
