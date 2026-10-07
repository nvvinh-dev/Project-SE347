using Microsoft.EntityFrameworkCore;
using Npgsql;
using NhaTre.Application.DTOs.Users;
using NhaTre.Application.Interfaces;
using NhaTre.Application.Services;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private static readonly short AdminRoleId = Roles.ToRoleId(Roles.Admin);

    private readonly AppDbContext _dbContext;

    public UserRepository(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    // Mới tạo xếp trước
    public async Task<IReadOnlyList<User>> GetAllAsync()
    {
        return await _dbContext.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();
    }

    // Không theo dõi thay đổi: mọi thao tác sửa đi qua câu UPDATE riêng, nên một SaveChanges khác
    // trong cùng request không thể ghi đè tài khoản bằng bản đã đọc
    public async Task<User?> FindByIdAsync(Guid id)
    {
        return await _dbContext.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);
    }

    public async Task<bool> IsEmailTakenAsync(string normalizedEmail, Guid? exceptUserId = null)
    {
        var query = _dbContext.Users.Where(u => u.LoginIdentifier == normalizedEmail);

        if (exceptUserId is not null)
            query = query.Where(u => u.Id != exceptUserId);

        return await query.AnyAsync();
    }

    public async Task<bool> AddAsync(User user)
    {
        _dbContext.Users.Add(user);

        try
        {
            await _dbContext.SaveChangesAsync();
            return true;
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            // Bỏ theo dõi bản ghi không lưu được, để SaveChanges sau trong cùng request không thêm lại nó
            _dbContext.Entry(user).State = EntityState.Detached;
            return false;
        }
    }

    public async Task<bool> UpdateProfileAsync(Guid id, string fullName, string normalizedEmail)
    {
        try
        {
            await _dbContext.Users
                .Where(u => u.Id == id)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(u => u.FullName, fullName)
                    .SetProperty(u => u.LoginIdentifier, normalizedEmail));
            return true;
        }
        catch (PostgresException exception) when (IsUniqueViolation(exception))
        {
            return false;
        }
    }

    public async Task<UserOutcome> DeactivateAsync(Guid id)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        var activeAdminIds = await LockActiveAdminIdsAsync();

        var target = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new { u.RoleId, u.IsActive })
            .FirstOrDefaultAsync();

        if (target is null)
            return UserOutcome.UserNotFound;

        // Không đạt thì thoát mà không commit: transaction tự rollback, nhả khóa
        var outcome = UserAccountRules.CheckDeactivation(target.RoleId, target.IsActive, activeAdminIds.Count);
        if (outcome != UserOutcome.Success)
            return outcome;

        // D48: tăng token_version trong cùng câu UPDATE để mọi token cũ của người này hết hiệu lực
        await _dbContext.Users
            .Where(u => u.Id == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.IsActive, false)
                .SetProperty(u => u.TokenVersion, u => u.TokenVersion + 1));

        await transaction.CommitAsync();
        return UserOutcome.Success;
    }

    // Khóa giống vô hiệu hóa: hai Admin hạ vai trò nhau cùng lúc, hoặc một người hạ vai trò trong lúc người kia
    // vô hiệu hóa, không được làm mất Admin đang hoạt động cuối cùng
    public async Task<UserOutcome> ChangeRoleAsync(Guid id, short newRoleId)
    {
        await using var transaction = await _dbContext.Database.BeginTransactionAsync();

        var activeAdminIds = await LockActiveAdminIdsAsync();

        var target = await _dbContext.Users
            .AsNoTracking()
            .Where(u => u.Id == id)
            .Select(u => new { u.RoleId, u.IsActive })
            .FirstOrDefaultAsync();

        if (target is null)
            return UserOutcome.UserNotFound;

        var outcome = UserAccountRules.CheckRoleChange(target.RoleId, target.IsActive, newRoleId, activeAdminIds.Count);
        if (outcome != UserOutcome.Success)
            return outcome;

        // D48: tăng token_version cùng câu UPDATE, buộc người này đăng nhập lại để nhận token mang vai trò mới
        await _dbContext.Users
            .Where(u => u.Id == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.RoleId, newRoleId)
                .SetProperty(u => u.TokenVersion, u => u.TokenVersion + 1));

        await transaction.CommitAsync();
        return UserOutcome.Success;
    }

    // Mở lại không tăng token_version: tài khoản đang bị vô hiệu hóa thì không còn token nào dùng được
    public async Task<bool> ActivateAsync(Guid id)
    {
        var updatedRows = await _dbContext.Users
            .Where(u => u.Id == id && !u.IsActive)
            .ExecuteUpdateAsync(setters => setters.SetProperty(u => u.IsActive, true));

        return updatedRows == 1;
    }

    // D48: mật khẩu cũ coi như đã lộ thì token cũ cũng vậy — tăng token_version cùng câu UPDATE
    public async Task ResetPasswordAsync(Guid id, string passwordHash)
    {
        await _dbContext.Users
            .Where(u => u.Id == id)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(u => u.CredentialReference, passwordHash)
                .SetProperty(u => u.TokenVersion, u => u.TokenVersion + 1));
    }

    // D39 mục 7: số Admin đang hoạt động phải được đếm khi đã khóa, trong cùng transaction với câu UPDATE.
    // Chỉ đếm trong transaction thì chưa đủ: ở mức READ COMMITTED, hai Admin vô hiệu hóa nhau cùng lúc
    // đều thấy còn 2 Admin và cả hai cùng ghi. Khóa FOR UPDATE buộc request sau chờ request trước commit
    // rồi mới đếm lại. Phải gọi bên trong transaction.
    // ORDER BY id để mọi request khóa các dòng theo cùng một thứ tự: không có thứ tự cố định thì hai
    // transaction có thể khóa ngược chiều nhau (dòng vừa bị UPDATE đổi vị trí), Postgres hủy một bên vì
    // deadlock và request đó ra 500
    private async Task<List<Guid>> LockActiveAdminIdsAsync()
    {
        // EF Core không có toán tử FOR UPDATE nên viết SQL; giá trị truyền dạng tham số, không ghép chuỗi
        return await _dbContext.Database
            .SqlQuery<Guid>($"SELECT id AS \"Value\" FROM users WHERE role_id = {AdminRoleId} AND is_active ORDER BY id FOR UPDATE")
            .ToListAsync();
    }

    // Unique index của login_identifier chặn: request khác vừa dùng email này giữa lúc Service kiểm tra
    // và lúc ghi. SaveChanges bọc lỗi trong DbUpdateException, ExecuteUpdate thì không
    private static bool IsUniqueViolation(Exception exception)
        => (exception as PostgresException ?? exception.InnerException as PostgresException)?.SqlState
            == PostgresErrorCodes.UniqueViolation;
}
