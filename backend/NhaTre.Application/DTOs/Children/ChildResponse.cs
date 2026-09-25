namespace NhaTre.Application.DTOs.Children;

// D45: hồ sơ trẻ phía Kế toán không kèm health_notes và phân lớp
public record ChildResponse(
    Guid Id,
    string FullName,
    DateOnly DateOfBirth,
    DateOnly EnrollmentDate);
