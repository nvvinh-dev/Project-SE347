using FluentValidation.Results;

namespace NhaTre.Application.Validators;

// Quy ước chung của route hàng loạt (api-conventions.md §2.3, D39 mục 21)
public static class BatchRequests
{
    // Mỗi lần gửi tối đa 50 dòng, đủ cho một lớp
    public const int MaxItems = 50;

    // Lỗi của một dòng ghi kèm chỉ số dòng theo tên trường JSON (items[3].notes: ...), để client biết
    // dòng nào sai; lỗi của cả danh sách giữ nguyên message
    public static List<string> ErrorMessages(ValidationResult validationResult)
        => validationResult.Errors
            .Select(e => e.PropertyName.Contains('[')
                ? $"{ToJsonPath(e.PropertyName)}: {e.ErrorMessage}"
                : e.ErrorMessage)
            .ToList();

    // Items[3].Notes → items[3].notes, khớp JSON camelCase
    private static string ToJsonPath(string propertyName)
        => string.Join('.', propertyName.Split('.')
            .Select(segment => segment.Length == 0 ? segment : char.ToLowerInvariant(segment[0]) + segment[1..]));
}
