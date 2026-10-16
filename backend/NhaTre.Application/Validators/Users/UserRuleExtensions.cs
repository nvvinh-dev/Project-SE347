using FluentValidation;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.Users;

// Quy tắc dùng chung cho tạo, sửa tài khoản, đặt lại mật khẩu và đổi vai trò, để các validator không lệch nhau.
// Họ tên và email đo độ dài sau Trim vì UserService lưu bản đã trim
internal static class UserRuleExtensions
{
    public static IRuleBuilderOptions<T, string> UserFullName<T>(this IRuleBuilderInitial<T, string> rule)
        => rule.Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Họ tên không được để trống.")
            .Must(fullName => fullName.Trim().Length <= 100)
            .WithMessage("Họ tên không được dài quá 100 ký tự.");

    // 254 ký tự là độ dài tối đa của một địa chỉ email
    public static IRuleBuilderOptions<T, string> UserEmail<T>(this IRuleBuilderInitial<T, string> rule)
        => rule.Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không đúng định dạng.")
            .Must(email => email.Trim().Length <= 254)
            .WithMessage("Email không được dài quá 254 ký tự.");

    // Không trim mật khẩu: khoảng trắng là một phần của mật khẩu, lúc đăng nhập cũng không trim
    public static IRuleBuilderOptions<T, string> UserPassword<T>(this IRuleBuilderInitial<T, string> rule)
        => rule.Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.")
            .Length(8, 128).WithMessage("Mật khẩu phải từ 8 đến 128 ký tự.");

    // Thiếu hoặc sai vai trò thì từ chối, không gán vai trò mặc định (D43 mục 5)
    public static IRuleBuilderOptions<T, string> UserRole<T>(this IRuleBuilderInitial<T, string> rule)
        => rule.Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Vai trò không được để trống.")
            .Must(Roles.IsValid)
            .WithMessage($"Vai trò phải là một trong: {Roles.Admin}, {Roles.Teacher}, {Roles.Accountant}, {Roles.Medical}, {Roles.Parent}.");
}
