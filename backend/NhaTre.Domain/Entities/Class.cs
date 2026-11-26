namespace NhaTre.Domain.Entities;

public class Class
{
    public Guid Id { get; set; }
    public short GradeLevelId { get; set; }
    public Guid? HomeroomTeacherId { get; set; }
    public string Name { get; set; } = null!;
    // D39 mục 3: khoảng tuổi lấy từ khối (GradeLevel); hai cột này giữ lại nhưng ngừng đọc
    public int? MinAgeMonths { get; set; }
    public int? MaxAgeMonths { get; set; }
    // Rỗng là không giới hạn (FR-CLASS-04)
    public int? MinCapacity { get; set; }
    public int? MaxCapacity { get; set; }
    // Rỗng là đang hoạt động; lưu trữ một chiều, thay cho xóa cứng (FR-CLASS-03)
    public DateTime? ArchivedAtUtc { get; set; }

    public GradeLevel GradeLevel { get; set; } = null!;
    public Teacher? HomeroomTeacher { get; set; }
    public ICollection<ClassTeacher> AssistantTeachers { get; set; } = new List<ClassTeacher>();
    public ICollection<Child> Children { get; set; } = new List<Child>();
    public ICollection<ActivityPhoto> ActivityPhotos { get; set; } = new List<ActivityPhoto>();
}