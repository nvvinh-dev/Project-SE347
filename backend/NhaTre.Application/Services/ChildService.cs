using NhaTre.Application.DTOs.Children;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class ChildService : IChildService
{
    private readonly IChildRepository _childRepository;

    public ChildService(IChildRepository childRepository)
    {
        _childRepository = childRepository;
    }

    public async Task<IReadOnlyList<ChildResponse>> GetAllAsync()
    {
        var children = await _childRepository.GetAllAsync();
        return children.Select(ToResponse).ToList();
    }

    public async Task<ChildResponse?> GetByIdAsync(Guid id)
    {
        var child = await _childRepository.FindByIdAsync(id);
        return child is null ? null : ToResponse(child);
    }

    public async Task<ChildResponse> CreateAsync(ChildProfileRequest request)
    {
        var child = new Child
        {
            FullName = request.FullName.Trim(),
            DateOfBirth = request.DateOfBirth,
            EnrollmentDate = request.EnrollmentDate
        };

        _childRepository.Add(child);
        await _childRepository.SaveChangesAsync();
        return ToResponse(child);
    }

    // Chỉ ghi 3 trường của Kế toán (D39 mục 2); class_id và health_notes giữ nguyên
    public async Task<ChildResponse?> UpdateAsync(Guid id, ChildProfileRequest request)
    {
        var child = await _childRepository.FindByIdAsync(id);

        if (child is null)
            return null;

        child.FullName = request.FullName.Trim();
        child.DateOfBirth = request.DateOfBirth;
        child.EnrollmentDate = request.EnrollmentDate;

        await _childRepository.SaveChangesAsync();
        return ToResponse(child);
    }

    private static ChildResponse ToResponse(Child child)
        => new(child.Id, child.FullName, child.DateOfBirth, child.EnrollmentDate);
}
