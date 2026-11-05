using Microsoft.EntityFrameworkCore;
using NhaTre.Application.DTOs.Classes;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class ClassRepository : IClassRepository
{
    private static readonly short TeacherRoleId = Roles.ToRoleId(Roles.Teacher);

    private readonly AppDbContext _dbContext;

    public ClassRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Xếp theo nhóm tuổi: Mầm, Chồi, Lá
    public async Task<IReadOnlyList<ClassResponse>> GetAllAsync()
    {
        return await SelectClasses(_dbContext.Classes.AsNoTracking().OrderBy(c => c.MinAgeMonths))
            .ToListAsync();
    }

    public async Task<ClassResponse?> GetResponseByIdAsync(Guid id)
    {
        return await SelectClasses(_dbContext.Classes.AsNoTracking().Where(c => c.Id == id))
            .FirstOrDefaultAsync();
    }

    // Không theo dõi thay đổi: mọi thao tác ghi đi qua câu UPDATE riêng
    public async Task<Class?> FindByIdAsync(Guid id)
    {
        return await _dbContext.Classes
            .AsNoTracking()
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<IReadOnlyList<ClassPlacementResponse>> GetPlacementsAsync()
    {
        // Sắp xếp trước khi chiếu sang DTO: EF không dịch được OrderBy trên thuộc tính của record đã dựng
        return await SelectPlacements(_dbContext.Children.AsNoTracking().OrderBy(c => c.FullName))
            .ToListAsync();
    }

    public async Task<ClassPlacementResponse?> FindPlacementAsync(Guid childId)
    {
        return await SelectPlacements(_dbContext.Children.AsNoTracking().Where(c => c.Id == childId))
            .FirstOrDefaultAsync();
    }

    public async Task<bool> AssignClassAsync(Guid childId, Guid classId, DateOnly expectedDateOfBirth)
    {
        var updatedRows = await _dbContext.Children
            .Where(c => c.Id == childId && c.DateOfBirth == expectedDateOfBirth)
            .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.ClassId, (Guid?)classId));

        return updatedRows == 1;
    }

    public async Task<bool> RemoveFromClassAsync(Guid childId)
    {
        var updatedRows = await _dbContext.Children
            .Where(c => c.Id == childId && c.ClassId != null)
            .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.ClassId, (Guid?)null));

        return updatedRows == 1;
    }

    public async Task<User?> FindUserWithTeacherProfileAsync(Guid userId)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .Include(u => u.Teacher)
            .FirstOrDefaultAsync(u => u.Id == userId);
    }

    public async Task<IReadOnlyList<Guid>> FindActiveTeacherProfileIdsAsync(IReadOnlyCollection<Guid> userIds)
    {
        return await _dbContext.Teachers
            .AsNoTracking()
            .Where(t => userIds.Contains(t.UserId) && t.User.RoleId == TeacherRoleId && t.User.IsActive)
            .Select(t => t.Id)
            .ToListAsync();
    }

    public async Task<ClassOutcome> SetHomeroomTeacherAsync(Guid classId, Guid? teacherId)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        if (await LockClassAsync(classId) is null)
            return ClassOutcome.ClassNotFound;

        // BR-CLASS-04: đọc sau khi đã khóa nên thấy đúng danh sách giáo viên phụ lần gán trước vừa commit
        if (teacherId is not null
            && await _dbContext.ClassTeachers.AnyAsync(ct => ct.ClassId == classId && ct.TeacherId == teacherId))
            return ClassOutcome.HomeroomIsAssistant;

        await _dbContext.Classes
            .Where(c => c.Id == classId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.HomeroomTeacherId, teacherId));

        await transaction.CommitAsync();
        return ClassOutcome.Success;
    }

    public async Task<ClassOutcome> ReplaceAssistantTeachersAsync(Guid classId, IReadOnlyCollection<Guid> teacherIds)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        var lockedClass = await LockClassAsync(classId);

        // Thoát mà không commit: transaction tự rollback, danh sách cũ giữ nguyên
        if (lockedClass is null)
            return ClassOutcome.ClassNotFound;

        if (lockedClass.HomeroomTeacherId is { } homeroomTeacherId && teacherIds.Contains(homeroomTeacherId))
            return ClassOutcome.AssistantIsHomeroom;

        var currentRows = await _dbContext.ClassTeachers
            .Where(ct => ct.ClassId == classId)
            .ToListAsync();

        // Giáo viên còn trong danh sách thì giữ dòng cũ, chỉ xóa dòng bị gỡ và thêm dòng mới
        _dbContext.ClassTeachers.RemoveRange(currentRows.Where(ct => !teacherIds.Contains(ct.TeacherId)));

        foreach (var teacherId in teacherIds.Where(id => currentRows.All(ct => ct.TeacherId != id)))
            _dbContext.ClassTeachers.Add(new ClassTeacher { ClassId = classId, TeacherId = teacherId });

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
        return ClassOutcome.Success;
    }

    // Khóa dòng lớp: gán giáo viên chủ nhiệm và gán giáo viên phụ của cùng lớp chạy lần lượt, nên không
    // có lúc một người vừa là chủ nhiệm vừa là giáo viên phụ của lớp (BR-CLASS-04). EF Core không có
    // toán tử FOR UPDATE nên viết SQL; giá trị truyền dạng tham số, không ghép chuỗi
    private async Task<LockedClass?> LockClassAsync(Guid classId)
    {
        // Mỗi dòng là giáo viên chủ nhiệm (có thể null), nên phân biệt lớp không tồn tại bằng số dòng
        var rows = await _dbContext.Database
            .SqlQuery<Guid?>($"SELECT homeroom_teacher_id AS \"Value\" FROM classes WHERE id = {classId} FOR UPDATE")
            .ToListAsync();

        return rows.Count == 0 ? null : new LockedClass(rows[0]);
    }

    private sealed record LockedClass(Guid? HomeroomTeacherId);

    // Giáo viên phụ xếp theo họ tên rồi id tài khoản để thứ tự ổn định giữa các lần gọi
    private static IQueryable<ClassResponse> SelectClasses(IQueryable<Class> classes)
        => classes.Select(c => new ClassResponse(
            c.Id,
            c.Name,
            c.MinAgeMonths,
            c.MaxAgeMonths,
            c.HomeroomTeacher == null
                ? null
                : new ClassTeacherResponse(c.HomeroomTeacher.UserId, c.HomeroomTeacher.User.FullName),
            c.AssistantTeachers
                .OrderBy(ct => ct.Teacher.User.FullName)
                .ThenBy(ct => ct.Teacher.UserId)
                .Select(ct => new ClassTeacherResponse(ct.Teacher.UserId, ct.Teacher.User.FullName))
                .ToList()));

    // D45: chọn đúng 5 cột, không đọc ngày nhập học hay health_notes của trẻ
    private static IQueryable<ClassPlacementResponse> SelectPlacements(IQueryable<Child> children)
        => children.Select(c => new ClassPlacementResponse(
            c.Id,
            c.FullName,
            c.DateOfBirth,
            c.ClassId,
            c.Class == null ? null : c.Class.Name));
}
