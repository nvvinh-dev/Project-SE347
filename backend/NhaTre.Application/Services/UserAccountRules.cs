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
}
