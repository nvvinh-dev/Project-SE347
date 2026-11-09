namespace NhaTre.Domain.Entities;

public class Complaint
{
    public Guid Id { get; set; }
    public Guid ChildId { get; set; }
    public Guid SubmittedByUserId { get; set; } // phụ huynh gửi, lấy từ sub (D44)
    public Guid? HandledByUserId { get; set; }  // Admin xử lý gần nhất, lấy từ sub (D44)
    public string Content { get; set; } = null!; // không sửa sau khi gửi (D39 mục 18)
    public string Status { get; set; } = null!;  // ComplaintStatuses — check constraint ở DB (D51)
    public string? Resolution { get; set; }      // bắt buộc khi Resolved (D51)
    public DateTime CreatedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public Child Child { get; set; } = null!;
    public User SubmittedByUser { get; set; } = null!;
    public User? HandledByUser { get; set; }
}
