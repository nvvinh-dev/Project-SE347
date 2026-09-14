using FluentValidation;
using NhaTre.Application.DTOs.Auth;

namespace NhaTre.Application.Validators.Auth;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email không được để trống.")
            .EmailAddress().WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.");

        // Cố ý KHÔNG kiểm tra độ dài tối thiểu của Password ở đây — endpoint này
        // dùng để ĐĂNG NHẬP (so khớp với hash đã có), không phải ĐĂNG KÝ. Validate
        // độ mạnh mật khẩu (nếu cần) thuộc về validator của chức năng "Admin tạo user"
        // (D20 — Admin tự nhập password khi tạo tài khoản), sẽ làm khi module đó ra đời.
    }
}