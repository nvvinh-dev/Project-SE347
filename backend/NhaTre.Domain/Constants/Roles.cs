namespace NhaTre.Domain.Constants;
/// KHÔNG dùng roles.name (tiếng Việt) trực tiếp làm claim — xem D20.
public static class Roles
{
    public const string Admin = "Admin";
    public const string Teacher = "Teacher";
    public const string Accountant = "Accountant";
    public const string Medical = "Medical";
    public const string Parent = "Parent";
    private static readonly Dictionary<short, string> RoleIdToClaim = new()
    {
        [1] = Admin,
        [2] = Teacher,
        [3] = Accountant,
        [4] = Medical,
        [5] = Parent,
    };

    // Phải đứng sau RoleIdToClaim: field tĩnh khởi tạo theo thứ tự trong file
    private static readonly Dictionary<string, short> ClaimToRoleId =
        RoleIdToClaim.ToDictionary(pair => pair.Value, pair => pair.Key);

    public static string FromRoleId(short roleId)
    {
        if (!RoleIdToClaim.TryGetValue(roleId, out var claim))
            throw new ArgumentOutOfRangeException(nameof(roleId), $"role_id không hợp lệ: {roleId}");
        return claim;
    }

    // Phân biệt hoa thường: chỉ nhận đúng 5 hằng số ở trên
    public static bool IsValid(string? role) => role is not null && ClaimToRoleId.ContainsKey(role);

    public static short ToRoleId(string role)
    {
        if (!ClaimToRoleId.TryGetValue(role, out var roleId))
            throw new ArgumentOutOfRangeException(nameof(role), $"Vai trò không hợp lệ: {role}");
        return roleId;
    }
}