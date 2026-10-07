using NhaTre.Application.DTOs.Users;
using NhaTre.Domain.Constants;

namespace NhaTre.Application.Services;

// Quy tắc vòng đời tài khoản (D39 mục 7). UserRepository gọi hàm này với dữ liệu đọc được sau khi
// đã khóa các Admin đang hoạt động, nên quy tắc được xét trong cùng transaction với câu UPDATE
public static class UserAccountRules
{
    private static readonly short AdminRoleId = Roles.ToRoleId(Roles.Admin);

    // activeAdminCount tính cả tài khoản đích nếu đó là Admin đang hoạt động
    public static UserOutcome CheckDeactivation(short roleId, bool isActive, int activeAdminCount)
    {
        if (!isActive)
            return UserOutcome.AlreadyInactive;

        if (roleId == AdminRoleId && activeAdminCount <= 1)
            return UserOutcome.LastActiveAdmin;

        return UserOutcome.Success;
    }

    // Đổi sang vai trò đang có là thao tác lặp → 409, không tăng token_version (giống vô hiệu hóa hai lần).
    // Chỉ Admin đang hoạt động mới được tính khi hạ vai trò; hạ một Admin đã bị vô hiệu hóa không làm giảm
    // số Admin đang hoạt động. activeAdminCount tính cả tài khoản đích nếu đó là Admin đang hoạt động
    public static UserOutcome CheckRoleChange(short currentRoleId, bool isActive, short newRoleId, int activeAdminCount)
    {
        if (currentRoleId == newRoleId)
            return UserOutcome.AlreadyHasRole;

        if (currentRoleId == AdminRoleId && isActive && activeAdminCount <= 1)
            return UserOutcome.LastActiveAdminDemotion;

        return UserOutcome.Success;
    }
}
