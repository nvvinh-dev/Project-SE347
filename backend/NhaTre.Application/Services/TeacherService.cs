using NhaTre.Application.DTOs.Teachers;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

// FR-TEACHER-01: Kế toán lập hồ sơ giáo viên cho tài khoản Giáo viên có sẵn để Admin phân công lớp
// (BR-TEACHER-02). Bảng teachers không có trường nào sửa được: họ tên, email là của tài khoản và chỉ
// Admin sửa (FR-USER-01), còn gắn hồ sơ sang tài khoản khác sẽ chuyển cả lớp chủ nhiệm và bản ghi
// điểm danh, sức khỏe của giáo viên cũ sang người mới. Vì vậy chỉ có Tạo + Xem, không có Xóa (D40 mục 1).
// Tạo hồ sơ không thuộc 8 sự kiện của security_events (D50)
public class TeacherService : ITeacherService
{
    private readonly ITeacherRepository _teacherRepository;

    public TeacherService(ITeacherRepository teacherRepository)
    {
        _teacherRepository = teacherRepository;
    }

    public async Task<IReadOnlyList<TeacherResponse>> GetAllAsync()
        => await _teacherRepository.GetAllAsync();

    public async Task<TeacherResponse?> GetByIdAsync(Guid id)
        => await _teacherRepository.FindByIdAsync(id);

    public async Task<IReadOnlyList<TeacherAccountResponse>> GetAccountsWithoutProfileAsync()
        => await _teacherRepository.GetAccountsWithoutProfileAsync();

    public async Task<TeacherResult> CreateAsync(CreateTeacherRequest request)
    {
        // Không có tài khoản, sai vai trò hay đã bị vô hiệu hóa đều cùng một kết quả: tách riêng thì
        // Kế toán dò được vai trò và trạng thái của tài khoản khác qua API này, giống FR-STU-02
        var account = await _teacherRepository.FindActiveTeacherAccountAsync(request.UserId);

        if (account is null)
            return new TeacherResult(TeacherOutcome.InvalidTeacherAccount);

        if (await _teacherRepository.ProfileExistsAsync(account.UserId))
            return new TeacherResult(TeacherOutcome.ProfileExists);

        var teacher = new Teacher
        {
            Id = Guid.NewGuid(),
            UserId = account.UserId,
            CreatedAt = DateTime.UtcNow
        };

        // Hồ sơ không cấp thêm quyền: vai trò hay trạng thái tài khoản đổi sau lúc này thì mọi chức năng
        // vẫn xét vai trò trước rồi mới xét hồ sơ (D39 mục 7)
        if (!await _teacherRepository.AddAsync(teacher))
            return new TeacherResult(TeacherOutcome.ProfileExists);

        return new TeacherResult(TeacherOutcome.Success,
            new TeacherResponse(teacher.Id, account.UserId, account.FullName, account.Email, teacher.CreatedAt));
    }
}
