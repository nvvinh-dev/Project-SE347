using NhaTre.Application.DTOs.Classes;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

// FR-CLASS-01: Admin xếp trẻ vào một trong 3 lớp cố định và gán giáo viên chủ nhiệm (D39 mục 3).
// Xếp lớp và gán giáo viên chủ nhiệm không thuộc 8 sự kiện của security_events (D50)
public class ClassService : IClassService
{
    // Tuổi tính tới ngày hôm nay theo giờ Việt Nam, không theo múi giờ của máy chủ
    private static readonly TimeZoneInfo VietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");

    private static readonly short TeacherRoleId = Roles.ToRoleId(Roles.Teacher);

    private readonly IClassRepository _classRepository;

    public ClassService(IClassRepository classRepository)
    {
        _classRepository = classRepository;
    }

    public async Task<IReadOnlyList<ClassResponse>> GetClassesAsync()
        => await _classRepository.GetAllAsync();

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

        if (child.ClassId == targetClass.Id)
            return new ClassPlacementResult(ClassOutcome.AlreadyInClass);

        // BR-CLASS-03: tuổi tính từ ngày sinh đã lưu, request không có trường tuổi
        var ageInMonths = ClassAgeRules.AgeInMonths(child.DateOfBirth, TodayInVietnam());

        if (!ClassAgeRules.FitsAgeRange(ageInMonths, targetClass.MinAgeMonths, targetClass.MaxAgeMonths))
            return new ClassPlacementResult(ClassOutcome.AgeMismatch);

        // UPDATE chỉ khớp khi ngày sinh vẫn là ngày vừa dùng để tính tuổi: Kế toán sửa ngày sinh
        // giữa lúc đọc và lúc ghi thì không xếp, tránh trẻ nằm ở lớp không khớp tuổi
        if (!await _classRepository.AssignClassAsync(child.ChildId, targetClass.Id, child.DateOfBirth))
            return new ClassPlacementResult(ClassOutcome.ChildChanged);

        return new ClassPlacementResult(ClassOutcome.Success,
            child with { ClassId = targetClass.Id, ClassName = targetClass.Name });
    }

    public async Task<ClassResult> AssignHomeroomTeacherAsync(Guid classId, AssignHomeroomTeacherRequest request)
    {
        var targetClass = await _classRepository.FindByIdAsync(classId);

        if (targetClass is null)
            return new ClassResult(ClassOutcome.ClassNotFound);

        if (request.TeacherUserId is null)
        {
            if (targetClass.HomeroomTeacherId is null)
                return new ClassResult(ClassOutcome.NoHomeroomTeacher);

            await _classRepository.SetHomeroomTeacherAsync(targetClass.Id, null);
            return new ClassResult(ClassOutcome.Success, ToResponse(targetClass, null));
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
        // không mở thêm quyền: mọi chức năng của giáo viên xét vai trò trước rồi mới xét lớp chủ nhiệm
        await _classRepository.SetHomeroomTeacherAsync(targetClass.Id, user.Teacher.Id);

        return new ClassResult(ClassOutcome.Success,
            ToResponse(targetClass, new HomeroomTeacherResponse(user.Id, user.FullName)));
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

    private static DateOnly TodayInVietnam()
        => DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone));

    private static ClassResponse ToResponse(Class classEntity, HomeroomTeacherResponse? homeroomTeacher)
        => new(classEntity.Id, classEntity.Name, classEntity.MinAgeMonths, classEntity.MaxAgeMonths, homeroomTeacher);
}
