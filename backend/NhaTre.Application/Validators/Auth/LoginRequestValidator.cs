using FluentValidation;
using NhaTre.Application.DTOs.Auth;

namespace NhaTre.Application.Validators.Auth;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        // Giới hạn 254 ký tự (độ dài tối đa của địa chỉ email) trước khi kiểm định dạng: email
        // đăng nhập sai được ghi nguyên vào security_events.target_reference (D50), không giới
        // hạn thì mỗi request chưa đăng nhập đẩy được chuỗi hàng chục MB vào database. Email dài
        // hơn không khớp được tài khoản nào nên trả 400 không mất gì.
        RuleFor(x => x.Email)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Email không được để trống.")
            .Must(email => email.Trim().Length <= 254)
            .WithMessage("Email không được dài quá 254 ký tự.")
            .EmailAddress().WithMessage("Email không đúng định dạng.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Mật khẩu không được để trống.");

        // Cố ý KHÔNG kiểm tra độ dài tối thiểu của Password ở đây — endpoint này
        // dùng để ĐĂNG NHẬP (so khớp với hash đã có), không phải ĐĂNG KÝ. Validate
        // độ mạnh mật khẩu (nếu cần) thuộc về validator của chức năng "Admin tạo user"
        // (D20 — Admin tự nhập password khi tạo tài khoản), sẽ làm khi module đó ra đời.
    }
}