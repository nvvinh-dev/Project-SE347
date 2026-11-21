using FluentValidation;
using NhaTre.Application.DTOs.AbsenceFollowUps;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Validators.AbsenceFollowUps;

public class CreateAbsenceFollowUpRequestValidator : AbstractValidator<CreateAbsenceFollowUpRequest>
{
    public const int NoteMaxLength = 500;

    public CreateAbsenceFollowUpRequestValidator()
    {
        // Phân biệt hoa thường như CHECK CK_AbsenceFollowUp_Outcome ở database (D51)
        RuleFor(x => x.Outcome)
            .Cascade(CascadeMode.Stop)
            .NotEmpty().WithMessage("Kết quả liên hệ không được để trống.")
            .Must(AbsenceFollowUpOutcomes.IsValid)
            .WithMessage("Kết quả liên hệ chỉ nhận 'Reached' hoặc 'Unreachable'.");

        // D39 mục 20: liên lạc được thì phải ghi lại nội dung (ví dụ lý do vắng); chuỗi chỉ có khoảng
        // trắng coi như không ghi, khớp CHECK CK_AbsenceFollowUp_ReachedNote sau khi Service Trim
        RuleFor(x => x.Note)
            .Must(note => !string.IsNullOrWhiteSpace(note))
            .When(x => x.Outcome == AbsenceFollowUpOutcomes.Reached)
            .WithMessage("Liên lạc được thì phải ghi chú nội dung trao đổi.");

        RuleFor(x => x.Note)
            .Must(note => note!.Trim().Length <= NoteMaxLength)
            .When(x => x.Note is not null)
            .WithMessage($"Ghi chú tối đa {NoteMaxLength} ký tự.");
    }
}
