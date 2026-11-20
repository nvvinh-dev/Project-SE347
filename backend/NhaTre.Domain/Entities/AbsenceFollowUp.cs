namespace NhaTre.Domain.Entities;

// FR-ATT-04: một lần giáo viên liên hệ khi trẻ vắng không phép (D39 mục 20). Chỉ ghi — không sửa,
// không xóa; kết quả của trẻ là dòng có recorded_at lớn nhất
public class AbsenceFollowUp
{
    public Guid Id { get; set; }
    public Guid AttendanceId { get; set; }
    public Guid RecordedByTeacherId { get; set; } // hồ sơ teachers của sub (D44 mục 2)
    public string Outcome { get; set; } = null!;  // AbsenceFollowUpOutcomes — check constraint ở DB (D51)
    public string? Note { get; set; }             // bắt buộc khi Reached (D51), tối đa 500 ký tự
    public DateTime RecordedAt { get; set; }

    public Attendance Attendance { get; set; } = null!;
    public Teacher RecordedByTeacher { get; set; } = null!;
}
