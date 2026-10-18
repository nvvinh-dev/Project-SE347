using Microsoft.EntityFrameworkCore;
using Npgsql;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
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

    // Phạm vi lớp chủ nhiệm luôn có trong câu truy vấn như lịch sử điểm danh (FR-ATT-03). Lọc theo
    // ngày của bản điểm danh (ngày theo giờ Việt Nam), không theo pickup_time là giờ UTC
    public async Task<IReadOnlyList<Pickup>> GetByDateInHomeroomClassesAsync(DateOnly attendanceDate, Guid teacherUserId)
    {
        return await _dbContext.Pickups
            .AsNoTracking()
            .Include(p => p.Attendance)
                .ThenInclude(a => a.Child)
            .Where(p => p.Attendance.AttendanceDate == attendanceDate
                && p.Attendance.Child.Class!.HomeroomTeacher!.UserId == teacherUserId)
            .OrderBy(p => p.Attendance.Child.FullName)
            .ThenBy(p => p.Attendance.ChildId)
            .ToListAsync();
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

    public async Task<bool> IsGuardianOfChildAsync(Guid childId, Guid parentUserId)
    {
        return await _dbContext.ChildGuardians
            .AnyAsync(cg => cg.ChildId == childId && cg.GuardianUserId == parentUserId);
    }

    public async Task<bool> TryAddRegisteredPersonAsync(RegisteredPickupPerson person)
    {
        _dbContext.RegisteredPickupPersons.Add(person);

        try
        {
            await _dbContext.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            _dbContext.Entry(person).State = EntityState.Detached;
            return false;
        }
    }

    // Một câu UPDATE có điều kiện, không đọc rồi SaveChanges: hai request cùng thay ảnh của một người
    // thì chỉ request đến trước khớp khóa ảnh cũ, request sau không cập nhật được dòng nào. Nhờ vậy
    // không có ảnh nào bị ghi đè mà không ai xóa file của nó
    public async Task<bool> TryUpdateRegisteredPersonAsync(RegisteredPickupPerson person, string currentFacePhotoReference)
    {
        var updatedRows = await _dbContext.RegisteredPickupPersons
            .Where(p => p.Id == person.Id && p.FacePhotoReference == currentFacePhotoReference)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(p => p.FullName, person.FullName)
                .SetProperty(p => p.Relationship, person.Relationship)
                .SetProperty(p => p.PhoneNumber, person.PhoneNumber)
                .SetProperty(p => p.CitizenIdNumber, person.CitizenIdNumber)
                .SetProperty(p => p.FacePhotoReference, person.FacePhotoReference)
                .SetProperty(p => p.ConsentConfirmedAt, person.ConsentConfirmedAt)
                .SetProperty(p => p.ConsentConfirmedByUserId, person.ConsentConfirmedByUserId));

        return updatedRows == 1;
    }

    // Điều kiện priority nằm ngay trong câu DELETE: kể cả Service bỏ sót bước kiểm, người đón chính
    // vẫn không bị xóa
    public async Task<bool> TryDeleteBackupPersonAsync(Guid id, string currentFacePhotoReference)
    {
        var deletedRows = await _dbContext.RegisteredPickupPersons
            .Where(p => p.Id == id
                && p.Priority == PickupPersonPriorities.Backup
                && p.FacePhotoReference == currentFacePhotoReference)
            .ExecuteDeleteAsync();

        return deletedRows == 1;
    }
}
