using Microsoft.EntityFrameworkCore;
using Npgsql;
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

    public async Task<IReadOnlyList<GradeLevelResponse>> GetGradeLevelsAsync()
    {
        return await _dbContext.GradeLevels
            .AsNoTracking()
            .OrderBy(g => g.SortOrder)
            .Select(g => new GradeLevelResponse(g.Id, g.Name, g.MinAgeMonths, g.MaxAgeMonths))
            .ToListAsync();
    }

    public async Task<bool> GradeLevelExistsAsync(short gradeLevelId)
    {
        return await _dbContext.GradeLevels.AnyAsync(g => g.Id == gradeLevelId);
    }

    // Xếp theo khối (Mầm, Chồi, Lá), trong khối theo tên rồi id để thứ tự ổn định giữa các lần gọi
    public async Task<IReadOnlyList<ClassResponse>> GetAllAsync()
    {
        var activeClasses = _dbContext.Classes
            .AsNoTracking()
            .Where(c => c.ArchivedAtUtc == null)
            .OrderBy(c => c.GradeLevel.SortOrder)
            .ThenBy(c => c.Name)
            .ThenBy(c => c.Id);

        return await SelectClasses(activeClasses).ToListAsync();
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
            .Include(c => c.GradeLevel)
            .FirstOrDefaultAsync(c => c.Id == id);
    }

    public async Task<bool> NameExistsAsync(string name, Guid? exceptClassId)
    {
        return await _dbContext.Classes.AnyAsync(c => c.Name == name && c.Id != exceptClassId);
    }

    public async Task<bool> AddAsync(Class newClass)
    {
        _dbContext.Classes.Add(newClass);

        try
        {
            await _dbContext.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            // Bỏ theo dõi bản ghi không lưu được, để SaveChanges sau trong cùng request không thêm lại nó
            _dbContext.Entry(newClass).State = EntityState.Detached;
            return false;
        }
    }

    public async Task<ClassOutcome> UpdateAsync(
        Guid classId, short gradeLevelId, string name, int? minCapacity, int? maxCapacity)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        var lockedClass = await LockClassAsync(classId);

        // Thoát mà không commit: transaction tự rollback, lớp giữ nguyên
        if (lockedClass is null)
            return ClassOutcome.ClassNotFound;

        if (lockedClass.ArchivedAtUtc is not null)
            return ClassOutcome.ClassArchived;

        // BR-CLASS-05: chỉ đổi khối khi lớp chưa có trẻ, vì khoảng tuổi của lớp là của khối
        if (gradeLevelId != lockedClass.GradeLevelId && lockedClass.ChildCount > 0)
            return ClassOutcome.ChangeGradeWithChildren;

        // BR-CLASS-06: không hạ sĩ số tối đa xuống dưới số trẻ đang có (AC-CLASS-11)
        if (maxCapacity is not null && maxCapacity < lockedClass.ChildCount)
            return ClassOutcome.MaxCapacityBelowChildCount;

        try
        {
            await _dbContext.Classes
                .Where(c => c.Id == classId)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(c => c.GradeLevelId, gradeLevelId)
                    .SetProperty(c => c.Name, name)
                    .SetProperty(c => c.MinCapacity, minCapacity)
                    .SetProperty(c => c.MaxCapacity, maxCapacity));
        }
        catch (PostgresException exception) when (IsUniqueViolation(exception))
        {
            return ClassOutcome.DuplicateClassName;
        }

        await transaction.CommitAsync();
        return ClassOutcome.Success;
    }

    public async Task<ClassOutcome> ArchiveAsync(Guid classId, DateTime archivedAtUtc)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        var lockedClass = await LockClassAsync(classId);

        if (lockedClass is null)
            return ClassOutcome.ClassNotFound;

        // Lưu trữ một chiều: lưu trữ lần nữa là thao tác trên lớp đã lưu trữ (BR-CLASS-05)
        if (lockedClass.ArchivedAtUtc is not null)
            return ClassOutcome.ClassArchived;

        // Xếp lớp cũng khóa dòng lớp đích, nên không có trẻ nào được xếp vào sau lúc đếm này
        if (lockedClass.ChildCount > 0)
            return ClassOutcome.ArchiveWithChildren;

        // D39 mục 3: gỡ mọi giáo viên phụ và giáo viên chủ nhiệm cùng lúc lưu trữ. Ảnh hoạt động giữ nguyên
        await _dbContext.ClassTeachers
            .Where(ct => ct.ClassId == classId)
            .ExecuteDeleteAsync();

        await _dbContext.Classes
            .Where(c => c.Id == classId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(c => c.HomeroomTeacherId, (Guid?)null)
                .SetProperty(c => c.ArchivedAtUtc, archivedAtUtc));

        await transaction.CommitAsync();
        return ClassOutcome.Success;
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

    public async Task<ClassOutcome> AssignClassAsync(
        Guid childId, Guid classId, short expectedGradeLevelId, DateOnly expectedDateOfBirth)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        // Khóa dòng lớp đích: lần lưu trữ hay đổi khối của cùng lớp chạy trước hoặc sau, không đan xen
        var lockedClass = await LockClassAsync(classId);

        if (lockedClass is null)
            return ClassOutcome.ClassNotFound;

        if (lockedClass.ArchivedAtUtc is not null)
            return ClassOutcome.ClassArchived;

        if (lockedClass.GradeLevelId != expectedGradeLevelId)
            return ClassOutcome.ClassChanged;

        // BR-CLASS-06: lớp đã đủ sĩ số tối đa thì không xếp thêm. Đếm sau khi khóa nên hai Admin cùng xếp vào chỗ
        // trống cuối cùng chỉ một người thành công (AC-CLASS-10). Trẻ đang ở chính lớp này không tính thêm
        if (lockedClass.MaxCapacity is { } maxCapacity
            && await _dbContext.Children.CountAsync(c => c.ClassId == classId && c.Id != childId) >= maxCapacity)
            return ClassOutcome.ClassFull;

        var updatedRows = await _dbContext.Children
            .Where(c => c.Id == childId && c.DateOfBirth == expectedDateOfBirth)
            .ExecuteUpdateAsync(setters => setters.SetProperty(c => c.ClassId, (Guid?)classId));

        if (updatedRows != 1)
            return ClassOutcome.ChildChanged;

        await transaction.CommitAsync();
        return ClassOutcome.Success;
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

        var lockedClass = await LockClassAsync(classId);

        if (lockedClass is null)
            return ClassOutcome.ClassNotFound;

        if (lockedClass.ArchivedAtUtc is not null)
            return ClassOutcome.ClassArchived;

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

        if (lockedClass.ArchivedAtUtc is not null)
            return ClassOutcome.ClassArchived;

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

    // Khóa dòng lớp: mọi thao tác ghi lên cùng một lớp (gán giáo viên chủ nhiệm, giáo viên phụ, sửa, lưu trữ,
    // xếp trẻ vào) chạy lần lượt. Nhờ vậy không có lúc một người vừa là chủ nhiệm vừa là giáo viên phụ của
    // lớp (BR-CLASS-04), và lớp vừa lưu trữ hay vừa đổi khối không nhận thêm trẻ (BR-CLASS-05). EF Core không
    // có toán tử FOR UPDATE nên viết SQL; giá trị truyền dạng tham số, không ghép chuỗi
    private async Task<LockedClass?> LockClassAsync(Guid classId)
    {
        var lockedIds = await _dbContext.Database
            .SqlQuery<Guid>($"SELECT id AS \"Value\" FROM classes WHERE id = {classId} FOR UPDATE")
            .ToListAsync();

        if (lockedIds.Count == 0)
            return null;

        // Đọc sau khi đã khóa nên thấy đúng trạng thái lần ghi trước vừa commit. Số trẻ cũng đúng: chỉ xếp
        // lớp ghi children.class_id và xếp lớp khóa dòng lớp đích trước khi ghi
        return await _dbContext.Classes
            .AsNoTracking()
            .Where(c => c.Id == classId)
            .Select(c => new LockedClass(
                c.HomeroomTeacherId, c.GradeLevelId, c.ArchivedAtUtc, c.MaxCapacity, c.Children.Count()))
            .SingleAsync();
    }

    private sealed record LockedClass(
        Guid? HomeroomTeacherId, short GradeLevelId, DateTime? ArchivedAtUtc, int? MaxCapacity, int ChildCount);

    // Unique index của classes.name chặn: request khác vừa dùng tên này giữa lúc Service kiểm tra và lúc ghi.
    // SaveChanges bọc lỗi trong DbUpdateException, ExecuteUpdate thì không
    private static bool IsUniqueViolation(Exception exception)
        => (exception as PostgresException ?? exception.InnerException as PostgresException)?.SqlState
            == PostgresErrorCodes.UniqueViolation;

    // Khoảng tuổi lấy từ khối (D39 mục 3). Giáo viên phụ xếp theo họ tên rồi id tài khoản để thứ tự ổn
    // định giữa các lần gọi
    private static IQueryable<ClassResponse> SelectClasses(IQueryable<Class> classes)
        => classes.Select(c => new ClassResponse(
            c.Id,
            c.Name,
            new ClassGradeLevelResponse(c.GradeLevel.Id, c.GradeLevel.Name),
            c.GradeLevel.MinAgeMonths,
            c.GradeLevel.MaxAgeMonths,
            c.MinCapacity,
            c.MaxCapacity,
            c.Children.Count(),
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
