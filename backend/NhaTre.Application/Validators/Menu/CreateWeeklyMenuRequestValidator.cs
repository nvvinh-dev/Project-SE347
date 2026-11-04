using FluentValidation;
using NhaTre.Application.DTOs.Menu;

namespace NhaTre.Application.Validators.Menu;

public class CreateWeeklyMenuRequestValidator : AbstractValidator<CreateWeeklyMenuRequest>
{
    public CreateWeeklyMenuRequestValidator()
    {
        RuleFor(x => x.WeekStartDate).WeekStartDate();
        RuleFor(x => x.Entries).MenuEntries();
    }
}
