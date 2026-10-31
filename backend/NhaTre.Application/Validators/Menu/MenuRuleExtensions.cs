using FluentValidation;
using NhaTre.Application.DTOs.Menu;

namespace NhaTre.Application.Validators.Menu;

// Quy tắc dùng chung cho tạo và sửa thực đơn tuần, để hai validator không lệch nhau
internal static class MenuRuleExtensions
{
    private const int MaxDescriptionLength = 1000;

    // Chỉ số 0 bỏ trống để tra thẳng bằng DayOfWeek (ISO 8601: 1 = thứ Hai ... 7 = Chủ nhật)
    private static readonly string[] DayNames =
        { "", "thứ Hai", "thứ Ba", "thứ Tư", "thứ Năm", "thứ Sáu", "thứ Bảy", "Chủ nhật" };

    // Tuần bắt đầu từ thứ Hai, khớp ngày 1 của MenuEntryRequest.DayOfWeek
    public static IRuleBuilderOptions<T, DateOnly> WeekStartDate<T>(this IRuleBuilderInitial<T, DateOnly> rule)
        => rule.Cascade(CascadeMode.Stop)
            // DateOnly thiếu trong JSON nhận giá trị mặc định 01/01/0001, NotEmpty mới bắt được
            .NotEmpty().WithMessage("Ngày bắt đầu tuần không được để trống.")
            .Must(date => date.DayOfWeek == DayOfWeek.Monday)
            .WithMessage("Ngày bắt đầu tuần phải là thứ Hai.");

    // 1–7 ngày, mỗi ngày một lần. Báo lỗi theo tên ngày (hoặc số mục, đếm từ 1, khi số ngày sai) để Kế toán
    // biết sửa ô nào; không viết "ngày thứ 2" vì dễ đọc thành thứ Hai. Mô tả đo độ dài sau Trim vì
    // MenuService lưu bản đã trim
    public static IRuleBuilderOptionsConditions<T, IReadOnlyList<MenuEntryRequest>> MenuEntries<T>(
        this IRuleBuilderInitial<T, IReadOnlyList<MenuEntryRequest>> rule)
        => rule.Custom((entries, context) =>
        {
            if (entries is null || entries.Count == 0)
            {
                context.AddFailure("Thực đơn tuần phải có ít nhất một ngày.");
                return;
            }

            if (entries.Count > 7)
            {
                context.AddFailure("Thực đơn tuần có tối đa 7 ngày.");
                return;
            }

            var seenDays = new HashSet<int>();

            for (var i = 0; i < entries.Count; i++)
            {
                var entry = entries[i];
                var number = i + 1;

                if (entry is null)
                {
                    context.AddFailure($"Mục {number} của thực đơn không hợp lệ.");
                    continue;
                }

                string dayLabel;
                if (entry.DayOfWeek is < 1 or > 7)
                {
                    context.AddFailure($"Mục {number} của thực đơn phải có ngày từ 1 (thứ Hai) đến 7 (Chủ nhật).");
                    dayLabel = $"ở mục {number}";
                }
                else
                {
                    dayLabel = DayNames[entry.DayOfWeek];
                    if (!seenDays.Add(entry.DayOfWeek))
                        context.AddFailure($"Thực đơn {dayLabel} bị nhập hơn một lần.");
                }

                if (string.IsNullOrWhiteSpace(entry.Description))
                    context.AddFailure($"Thực đơn {dayLabel} không được để trống.");
                else if (entry.Description.Trim().Length > MaxDescriptionLength)
                    context.AddFailure($"Thực đơn {dayLabel} không được dài quá {MaxDescriptionLength} ký tự.");
            }
        });
}
