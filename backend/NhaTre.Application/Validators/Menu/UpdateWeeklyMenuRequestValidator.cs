using FluentValidation;
using NhaTre.Application.DTOs.Menu;

namespace NhaTre.Application.Validators.Menu;

public class UpdateWeeklyMenuRequestValidator : AbstractValidator<UpdateWeeklyMenuRequest>
{
    public UpdateWeeklyMenuRequestValidator()
    {
        RuleFor(x => x.Entries).MenuEntries();
    }
}
