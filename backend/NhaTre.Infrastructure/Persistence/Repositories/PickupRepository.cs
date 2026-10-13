using Microsoft.EntityFrameworkCore;
using Npgsql;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class PickupRepository : IPickupRepository
{
    private readonly AppDbContext _dbContext;

    public PickupRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Phạm vi nằm ngay trong câu truy vấn, cùng cách xác định với điểm danh vào lớp (FR-ATT-01):
    // trẻ chưa xếp lớp (class_id null) hay lớp chưa có giáo viên chủ nhiệm đều không khớp
    public async Task<Child?> FindChildInHomeroomClassAsync(Guid childId, Guid teacherUserId)
    {
        return await _dbContext.Children
            .AsNoTracking()
            .Include(c => c.Class)
            .FirstOrDefaultAsync(c => c.Id == childId
                && c.Class!.HomeroomTeacher!.UserId == teacherUserId);
    }

    public async Task<Attendance?> FindAttendanceAsync(Guid childId, DateOnly attendanceDate)
    {
        return await _dbContext.Attendances
            .AsNoTracking()
            .Include(a => a.Pickup)
            .FirstOrDefaultAsync(a => a.ChildId == childId && a.AttendanceDate == attendanceDate);
    }

    // Lọc theo child_id ngay trong truy vấn: người đón của trẻ khác không bao giờ được nạp (BR-PICKUP-04)
    public async Task<IReadOnlyList<RegisteredPickupPerson>> GetRegisteredPersonsAsync(Guid childId)
    {
        return await _dbContext.RegisteredPickupPersons
            .AsNoTracking()
            .Where(p => p.ChildId == childId)
            .OrderBy(p => p.Priority)
            .ToListAsync();
    }

    // Lấy theo lớp hiện tại của trẻ, cùng cách xác định phạm vi với bản điểm danh
    public async Task<Pickup?> FindByIdInHomeroomClassAsync(Guid id, Guid teacherUserId)
    {
        return await _dbContext.Pickups
            .AsNoTracking()
            .Include(p => p.Attendance)
                .ThenInclude(a => a.Child)
            .FirstOrDefaultAsync(p => p.Id == id
                && p.Attendance.Child.Class!.HomeroomTeacher!.UserId == teacherUserId);
    }

    public async Task<bool> TryAddAsync(Pickup pickup)
    {
        _dbContext.Pickups.Add(pickup);

        try
        {
            await _dbContext.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            // Bỏ theo dõi bản ghi lỗi để một SaveChanges khác trong cùng request không thử ghi lại nó
            _dbContext.Entry(pickup).State = EntityState.Detached;
            return false;
        }
    }
}
