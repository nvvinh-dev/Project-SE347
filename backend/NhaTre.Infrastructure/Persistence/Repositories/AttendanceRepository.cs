using Microsoft.EntityFrameworkCore;
using Npgsql;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class AttendanceRepository : IAttendanceRepository
{
    private readonly AppDbContext _dbContext;

    public AttendanceRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Phạm vi nằm ngay trong câu truy vấn: trẻ chưa xếp lớp (class_id null) hay lớp chưa có
    // giáo viên chủ nhiệm đều không khớp. Chỉ đọc, không theo dõi: điểm danh không sửa hồ sơ trẻ
    public async Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId)
    {
        return await _dbContext.Children
            .AsNoTracking()
            .Include(c => c.Class)
            .FirstOrDefaultAsync(c => c.Id == childId
                && c.Class!.HomeroomTeacher!.UserId == teacherUserId);
    }

    // Lấy theo lớp hiện tại của trẻ, cùng cách xác định phạm vi với FR-ATT-03
    public async Task<Attendance?> FindByIdInHomeroomClassAsync(Guid id, Guid teacherUserId)
    {
        return await _dbContext.Attendances
            .AsNoTracking()
            .Include(a => a.Child)
            .FirstOrDefaultAsync(a => a.Id == id
                && a.Child.Class!.HomeroomTeacher!.UserId == teacherUserId);
    }

    public async Task<bool> IsHomeroomClassAsync(Guid classId, Guid teacherUserId)
    {
        return await _dbContext.Classes
            .AnyAsync(c => c.Id == classId && c.HomeroomTeacher!.UserId == teacherUserId);
    }

    // Phạm vi lớp chủ nhiệm luôn có trong câu truy vấn; trẻ, lớp, ngày chỉ thu hẹp thêm
    public async Task<IReadOnlyList<Attendance>> GetInHomeroomClassesAsync(
        Guid teacherUserId, Guid? childId, Guid? classId, DateOnly? date)
    {
        var query = _dbContext.Attendances
            .AsNoTracking()
            .Include(a => a.Child)
            .Where(a => a.Child.Class!.HomeroomTeacher!.UserId == teacherUserId);

        if (childId is not null)
            query = query.Where(a => a.ChildId == childId.Value);

        if (classId is not null)
            query = query.Where(a => a.Child.ClassId == classId.Value);

        if (date is not null)
            query = query.Where(a => a.AttendanceDate == date.Value);

        return await query
            .OrderByDescending(a => a.AttendanceDate)
            .ThenBy(a => a.Child.FullName)
            .ToListAsync();
    }

    public async Task<bool> ExistsAsync(Guid childId, DateOnly attendanceDate)
    {
        return await _dbContext.Attendances
            .AnyAsync(a => a.ChildId == childId && a.AttendanceDate == attendanceDate);
    }

    public async Task<bool> TryAddAsync(Attendance attendance)
    {
        _dbContext.Attendances.Add(attendance);

        try
        {
            await _dbContext.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Bỏ theo dõi bản ghi lỗi để một SaveChanges khác trong cùng request không thử ghi lại nó
            _dbContext.Entry(attendance).State = EntityState.Detached;
            return false;
        }
    }
}
