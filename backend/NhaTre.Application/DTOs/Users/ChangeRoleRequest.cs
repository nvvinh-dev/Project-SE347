namespace NhaTre.Application.DTOs.Users;

// Role là một trong 5 hằng số Roles.*; không có quyền chi tiết theo từng người (D39 mục 13)
public record ChangeRoleRequest(string Role);
