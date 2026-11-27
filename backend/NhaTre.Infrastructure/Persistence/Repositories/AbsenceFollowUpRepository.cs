using Microsoft.EntityFrameworkCore;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class AbsenceFollowUpRepository : IAbsenceFollowUpRepository
{
    private readonly AppDbContext _dbContext;

    public AbsenceFollowUpRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Phạm vi tính theo lớp hiện tại của trẻ, như FR-ATT-01 và FR-ATT-03
    public async Task<Attendance?> FindAttendanceInScopeAsync(Guid attendanceId, Guid teacherUserId)
    {
        var scope = _dbContext.ClassIdsInScope(teacherUserId);

        return await _dbContext.Attendances
            .AsNoTracking()
            .Include(a => a.Child).ThenInclude(c => c.Class)
            .FirstOrDefaultAsync(a => a.Id == attendanceId
                && scope.Contains(a.Child.ClassId));
    }

    public async Task<IReadOnlyList<Attendance>> GetUnexcusedInScopeAsync(DateOnly date, Guid teacherUserId)
    {
        var scope = _dbContext.ClassIdsInScope(teacherUserId);

        return await _dbContext.Attendances
            .AsNoTracking()
            .Include(a => a.Child).ThenInclude(c => c.Class)
            .Include(a => a.Child).ThenInclude(c => c.RegisteredPickupPersons)
            .Where(a => a.AttendanceDate == date
                && a.Status == AttendanceStatuses.AbsentUnexcused
                && scope.Contains(a.Child.ClassId))
            .OrderBy(a => a.Child.Class!.Name)
            .ThenBy(a => a.Child.FullName)
            .AsSplitQuery()
            .ToListAsync();
    }

    // Trẻ chưa xếp lớp không có lớp để báo và không giáo viên nào liên hệ được, nên bị loại như ở phía
    // giáo viên
    public async Task<IReadOnlyList<Attendance>> GetUnexcusedAsync(DateOnly date)
    {
        return await _dbContext.Attendances
            .AsNoTracking()
            .Include(a => a.Child).ThenInclude(c => c.Class)
            .Where(a => a.AttendanceDate == date
                && a.Status == AttendanceStatuses.AbsentUnexcused
                && a.Child.ClassId != null)
            .OrderBy(a => a.Child.Class!.Name)
            .ThenBy(a => a.Child.FullName)
            .ToListAsync();
    }

    public async Task<IReadOnlyList<AbsenceFollowUp>> GetFollowUpsAsync(IReadOnlyCollection<Guid> attendanceIds)
    {
        if (attendanceIds.Count == 0)
            return Array.Empty<AbsenceFollowUp>();

        return await _dbContext.AbsenceFollowUps
            .AsNoTracking()
            .Include(f => f.RecordedByTeacher).ThenInclude(t => t.User)
            .Where(f => attendanceIds.Contains(f.AttendanceId))
            .OrderBy(f => f.RecordedAt)
            .ToListAsync();
    }

    public async Task<Guid?> FindTeacherIdAsync(Guid teacherUserId)
        => await _dbContext.FindTeacherIdAsync(teacherUserId);

    public async Task<string?> FindUserFullNameAsync(Guid userId)
        => await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == userId)
            .Select(u => u.FullName)
            .FirstOrDefaultAsync();

    public async Task AddAsync(AbsenceFollowUp followUp)
    {
        _dbContext.AbsenceFollowUps.Add(followUp);
        await _dbContext.SaveChangesAsync();
    }
}
