namespace NhaTre.Application.DTOs.Children;

// D45: Kế toán chỉ gửi 3 trường này. Không có health_notes (của Y tế) hay class_id
// (của Admin) — client gửi kèm thì bị bỏ qua vì DTO không có chỗ nhận.
public record ChildProfileRequest(
    string FullName,
    DateOnly DateOfBirth,
    DateOnly EnrollmentDate);
