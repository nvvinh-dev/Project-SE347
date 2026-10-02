namespace NhaTre.Domain.Constants;
/// KHÔNG dùng roles.name (tiếng Việt) trực tiếp làm claim — xem D20.
public static class Roles
{
    public const string Admin = "Admin";
    public const string Teacher = "Teacher";
    public const string Accountant = "Accountant";
    public const string Medical = "Medical";
    public const string Parent = "Parent";

    // Cho [Authorize(Roles = ...)] của chức năng mọi vai trò đều có, như đăng xuất. D43 mục 4
    // vẫn yêu cầu khai báo tường minh: không dùng [Authorize] trống thay cho hằng số này.
    public const string All = Admin + "," + Teacher + "," + Accountant + "," + Medical + "," + Parent;
    private static readonly Dictionary<short, string> RoleIdToClaim = new()
    {
        [1] = Admin,
        [2] = Teacher,
        [3] = Accountant,
        [4] = Medical,
        [5] = Parent,
    };

    public static string FromRoleId(short roleId)
    {
        if (!RoleIdToClaim.TryGetValue(roleId, out var claim))
            throw new ArgumentOutOfRangeException(nameof(roleId), $"role_id không hợp lệ: {roleId}");
        return claim;
    }
}