using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Classes;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

// FR-CLASS-01: Admin xếp trẻ vào lớp đang hoạt động của khối khớp tuổi và gán giáo viên chủ nhiệm (D39 mục 3).
// FR-CLASS-02: Admin phân công giáo viên phụ cho lớp.
// FR-CLASS-03: Admin tạo, sửa và lưu trữ lớp trong 3 khối cố định; FR-CLASS-04 (phần sửa lớp): không hạ sĩ
// số tối đa dưới số trẻ đang có.
// Quản lý lớp, xếp lớp, gán giáo viên chủ nhiệm và giáo viên phụ không thuộc 8 sự kiện của security_events (D50)
public class ClassService : IClassService
{
    private static readonly short TeacherRoleId = Roles.ToRoleId(Roles.Teacher);

    private readonly IClassRepository _classRepository;

    public ClassService(IClassRepository classRepository)
    {
        _classRepository = classRepository;
    }

    public async Task<IReadOnlyList<GradeLevelResponse>> GetGradeLevelsAsync()
        => await _classRepository.GetGradeLevelsAsync();

    public async Task<IReadOnlyList<ClassResponse>> GetClassesAsync()
        => await _classRepository.GetAllAsync();

    public async Task<ClassResult> CreateClassAsync(SaveClassRequest request)
    {
        if (!await _classRepository.GradeLevelExistsAsync(request.GradeLevelId))
            return new ClassResult(ClassOutcome.GradeLevelNotFound);

        // BR-CLASS-05: tên không trùng lớp nào khác, kể cả lớp đã lưu trữ; so trên bản đã trim như lúc lưu
        var name = request.Name.Trim();

        if (await _classRepository.NameExistsAsync(name, exceptClassId: null))
            return new ClassResult(ClassOutcome.DuplicateClassName);

        // Lớp mới đang hoạt động, chưa có trẻ và giáo viên (UC-CLASS-03); hai cột tuổi cũ để trống
        var newClass = new Class
        {
            GradeLevelId = request.GradeLevelId,
            Name = name,
            MinCapacity = request.MinCapacity,
            MaxCapacity = request.MaxCapacity
        };

        if (!await _classRepository.AddAsync(newClass))
            return new ClassResult(ClassOutcome.DuplicateClassName);

        return await LoadClassResultAsync(newClass.Id);
    }

    public async Task<ClassResult> UpdateClassAsync(Guid classId, SaveClassRequest request)
    {
        var targetClass = await _classRepository.FindByIdAsync(classId);

        if (targetClass is null)
            return new ClassResult(ClassOutcome.ClassNotFound);

        if (!await _classRepository.GradeLevelExistsAsync(request.GradeLevelId))
            return new ClassResult(ClassOutcome.GradeLevelNotFound);

        if (targetClass.ArchivedAtUtc is not null)
            return new ClassResult(ClassOutcome.ClassArchived);

        var name = request.Name.Trim();

        if (await _classRepository.NameExistsAsync(name, exceptClassId: classId))
            return new ClassResult(ClassOutcome.DuplicateClassName);

        // Lưu trữ, số trẻ (đổi khối, sĩ số tối đa) xét lại sau khi repository khóa dòng lớp
        var outcome = await _classRepository.UpdateAsync(
            classId, request.GradeLevelId, name, request.MinCapacity, request.MaxCapacity);

        return outcome == ClassOutcome.Success
            ? await LoadClassResultAsync(classId)
            : new ClassResult(outcome);
    }

    // Lưu trữ một chiều, không có API mở lại (D39 mục 3). Mọi điều kiện xét sau khi repository khóa dòng lớp
    public async Task<ClassResult> ArchiveClassAsync(Guid classId)
    {
        var outcome = await _classRepository.ArchiveAsync(classId, DateTime.UtcNow);

        return outcome == ClassOutcome.Success
            ? await LoadClassResultAsync(classId)
            : new ClassResult(outcome);
    }

    public async Task<IReadOnlyList<ClassPlacementResponse>> GetPlacementsAsync()
        => await _classRepository.GetPlacementsAsync();

    public async Task<ClassPlacementResult> AssignClassAsync(Guid childId, AssignClassRequest request)
    {
        // BR-CLASS-02: trẻ chỉ tồn tại khi Kế toán đã lập hồ sơ nhập học, nên không có hồ sơ là 404
        var child = await _classRepository.FindPlacementAsync(childId);

        if (child is null)
            return new ClassPlacementResult(ClassOutcome.ChildNotFound);

        if (request.ClassId is null)
            return await RemoveFromClassAsync(child);

        var targetClass = await _classRepository.FindByIdAsync(request.ClassId.Value);

        if (targetClass is null)
            return new ClassPlacementResult(ClassOutcome.ClassNotFound);

        // BR-CLASS-03: không xếp được trẻ vào lớp đã lưu trữ (AC-CLASS-09 b)
        if (targetClass.ArchivedAtUtc is not null)
            return new ClassPlacementResult(ClassOutcome.ClassArchived);

        if (child.ClassId == targetClass.Id)
            return new ClassPlacementResult(ClassOutcome.AlreadyInClass);

        // BR-CLASS-03: tuổi tính từ ngày sinh đã lưu, request không có trường tuổi; khoảng tuổi là của khối
        var ageInMonths = ClassAgeRules.AgeInMonths(child.DateOfBirth, TodayInVietnam());

        if (!ClassAgeRules.FitsAgeRange(
                ageInMonths, targetClass.GradeLevel.MinAgeMonths, targetClass.GradeLevel.MaxAgeMonths))
            return new ClassPlacementResult(ClassOutcome.AgeMismatch);

        // Repository khóa dòng lớp rồi mới ghi. UPDATE chỉ khớp khi khối của lớp và ngày sinh của trẻ vẫn là
        // giá trị vừa dùng để xét tuổi: Admin đổi khối hay Kế toán sửa ngày sinh giữa lúc đọc và lúc ghi thì
        // không xếp, tránh trẻ nằm ở lớp không khớp tuổi
        var outcome = await _classRepository.AssignClassAsync(
            child.ChildId, targetClass.Id, targetClass.GradeLevelId, child.DateOfBirth);

        if (outcome != ClassOutcome.Success)
            return new ClassPlacementResult(outcome);

        return new ClassPlacementResult(ClassOutcome.Success,
            child with { ClassId = targetClass.Id, ClassName = targetClass.Name });
    }

    public async Task<ClassResult> AssignHomeroomTeacherAsync(Guid classId, AssignHomeroomTeacherRequest request)
    {
        var targetClass = await _classRepository.FindByIdAsync(classId);

        if (targetClass is null)
            return new ClassResult(ClassOutcome.ClassNotFound);

        // BR-CLASS-05: không gán giáo viên cho lớp đã lưu trữ; repository xét lại sau khi khóa dòng lớp
        if (targetClass.ArchivedAtUtc is not null)
            return new ClassResult(ClassOutcome.ClassArchived);

        if (request.TeacherUserId is null)
        {
            if (targetClass.HomeroomTeacherId is null)
                return new ClassResult(ClassOutcome.NoHomeroomTeacher);

            return await SetHomeroomTeacherAsync(targetClass.Id, null);
        }

        var user = await _classRepository.FindUserWithTeacherProfileAsync(request.TeacherUserId.Value);

        if (user is null)
            return new ClassResult(ClassOutcome.UserNotFound);

        // Hồ sơ teachers còn lại sau khi đổi vai trò không cho thêm quyền nào (D39 mục 7),
        // nên xét vai trò hiện tại trước khi xét hồ sơ
        if (user.RoleId != TeacherRoleId)
            return new ClassResult(ClassOutcome.NotTeacherRole);

        if (!user.IsActive)
            return new ClassResult(ClassOutcome.TeacherInactive);

        // Hồ sơ giáo viên do Kế toán lập (FR-TEACHER-01); backend không tự tạo thay
        if (user.Teacher is null)
            return new ClassResult(ClassOutcome.NoTeacherProfile);

        if (targetClass.HomeroomTeacherId == user.Teacher.Id)
            return new ClassResult(ClassOutcome.AlreadyHomeroom);

        // Một giáo viên chủ nhiệm được nhiều lớp. Vai trò hay trạng thái tài khoản đổi sau lúc này cũng
        // không mở thêm quyền: mọi chức năng của giáo viên xét vai trò trước rồi mới xét lớp phụ trách
        // BR-CLASS-04: người đang là giáo viên phụ của lớp thì repository trả HomeroomIsAssistant
        return await SetHomeroomTeacherAsync(targetClass.Id, user.Teacher.Id);
    }

    public async Task<ClassResult> AssignAssistantTeachersAsync(Guid classId, AssignAssistantTeachersRequest request)
    {
        var targetClass = await _classRepository.FindByIdAsync(classId);

        if (targetClass is null)
            return new ClassResult(ClassOutcome.ClassNotFound);

        // BR-CLASS-05: không gán giáo viên cho lớp đã lưu trữ; repository xét lại sau khi khóa dòng lớp
        if (targetClass.ArchivedAtUtc is not null)
            return new ClassResult(ClassOutcome.ClassArchived);

        // Validator đã chặn id trùng, nên mỗi tài khoản đạt điều kiện ứng với đúng một hồ sơ: thiếu hồ sơ
        // nào là có tài khoản không tồn tại, không phải Giáo viên, bị vô hiệu hóa hoặc chưa có hồ sơ
        var teacherIds = request.TeacherUserIds.Count == 0
            ? []
            : await _classRepository.FindActiveTeacherProfileIdsAsync(request.TeacherUserIds);

        if (teacherIds.Count != request.TeacherUserIds.Count)
            return new ClassResult(ClassOutcome.InvalidAssistantTeacher);

        var outcome = await _classRepository.ReplaceAssistantTeachersAsync(classId, teacherIds);

        return outcome == ClassOutcome.Success
            ? await LoadClassResultAsync(classId)
            : new ClassResult(outcome);
    }

    // Trẻ nghỉ học thì gỡ khỏi lớp (D39 mục 2); gỡ không cần xét tuổi
    private async Task<ClassPlacementResult> RemoveFromClassAsync(ClassPlacementResponse child)
    {
        if (child.ClassId is null)
            return new ClassPlacementResult(ClassOutcome.NotInAnyClass);

        // UPDATE chỉ khớp khi trẻ còn lớp: Admin khác vừa gỡ trước thì báo như gỡ lần hai
        if (!await _classRepository.RemoveFromClassAsync(child.ChildId))
            return new ClassPlacementResult(ClassOutcome.NotInAnyClass);

        return new ClassPlacementResult(ClassOutcome.Success, child with { ClassId = null, ClassName = null });
    }

    // Tuổi tính tới ngày hôm nay theo giờ Việt Nam, không theo múi giờ của máy chủ
    private static DateOnly TodayInVietnam()
        => VietnamTime.DateOf(DateTime.UtcNow);

    private async Task<ClassResult> SetHomeroomTeacherAsync(Guid classId, Guid? teacherId)
    {
        var outcome = await _classRepository.SetHomeroomTeacherAsync(classId, teacherId);

        return outcome == ClassOutcome.Success
            ? await LoadClassResultAsync(classId)
            : new ClassResult(outcome);
    }

    // Đọc lại sau khi ghi để response có đủ khối, số trẻ, giáo viên chủ nhiệm và giáo viên phụ hiện tại.
    // Lớp không bị xóa (chỉ lưu trữ), nên lớp vừa ghi xong luôn đọc lại được
    private async Task<ClassResult> LoadClassResultAsync(Guid classId)
    {
        var response = await _classRepository.GetResponseByIdAsync(classId);

        return response is null
            ? new ClassResult(ClassOutcome.ClassNotFound)
            : new ClassResult(ClassOutcome.Success, response);
    }
}
