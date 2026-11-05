namespace NhaTre.Domain.Entities;

// FR-CLASS-02: giáo viên phụ của lớp (D39 mục 3). Dòng phân công không phải bằng chứng nghiệp vụ nên
// gỡ giáo viên phụ là xóa dòng (D40 mục 1, ngoại lệ thứ ba)
public class ClassTeacher
{
    public Guid ClassId { get; set; }
    public Guid TeacherId { get; set; }

    public Class Class { get; set; } = null!;
    public Teacher Teacher { get; set; } = null!;
}
