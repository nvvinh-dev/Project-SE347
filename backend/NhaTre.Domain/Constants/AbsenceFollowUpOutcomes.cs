namespace NhaTre.Domain.Constants;

/// Hai kết quả liên hệ khi trẻ vắng không phép — chốt ở D39 mục 20, khớp CHECK
/// CK_AbsenceFollowUp_Outcome và CK_AbsenceFollowUp_ReachedNote (D51).
/// Reached bắt buộc có note; Unreachable thì note tùy chọn và báo mọi Admin đang hoạt động.
/// KHÔNG gõ chuỗi tay ở Service hay Controller — luôn dùng hằng số ở đây.
public static class AbsenceFollowUpOutcomes
{
    public const string Reached = "Reached";         // Đã liên lạc được
    public const string Unreachable = "Unreachable"; // Không liên lạc được

    public static readonly IReadOnlyList<string> All = new[]
    {
        Reached, Unreachable,
    };

    public static bool IsValid(string? outcome) => outcome is not null && All.Contains(outcome);
}
