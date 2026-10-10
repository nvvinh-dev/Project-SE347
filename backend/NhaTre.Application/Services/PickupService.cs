using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Pickup;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class PickupService : IPickupService
{
    private readonly IPickupRepository _pickupRepository;

    public PickupService(IPickupRepository pickupRepository)
    {
        _pickupRepository = pickupRepository;
    }

    public async Task<PickupResponse?> GetByIdAsync(Guid id, Guid teacherUserId)
    {
        var pickup = await _pickupRepository.FindByIdInHomeroomClassAsync(id, teacherUserId);
        return pickup is null ? null : ToResponse(pickup, pickup.Attendance.Child);
    }

    // FR-PICKUP-01. Trẻ không tồn tại, chưa xếp lớp hay thuộc lớp khác đều ngoài phạm vi → 404
    // (BR-SCOPE-02, D40 mục 2). Bản điểm danh là bản của hôm nay do server tự tìm; giờ đón, người ghi
    // nhận và họ tên chép từ người đón đã đăng ký cũng do server đặt (D24, D44 mục 2)
    public async Task<PickupResult> CreateAsync(CreatePickupRequest request, Guid teacherUserId)
    {
        var child = await _pickupRepository.FindChildInHomeroomClassAsync(request.ChildId, teacherUserId);
        if (child is null)
            return new PickupResult(PickupOutcome.ChildNotFound);

        var now = DateTime.UtcNow;
        var attendance = await _pickupRepository.FindAttendanceAsync(child.Id, VietnamTime.DateOf(now));
        if (attendance is null)
            return new PickupResult(PickupOutcome.NotCheckedInToday);

        // BR-PICKUP-11: trẻ vắng không ở trường nên không có việc giao trẻ
        if (attendance.Status != AttendanceStatuses.Present)
            return new PickupResult(PickupOutcome.ChildAbsent);

        // BR-PICKUP-06: đã có bản ghi đón về thì từ chối, không ghi đè
        if (attendance.Pickup is not null)
            return new PickupResult(PickupOutcome.AlreadyPickedUp);

        var registeredPersons = await _pickupRepository.GetRegisteredPersonsAsync(child.Id);

        // AC-PICKUP-14: chưa có người đón chính thì không có ai để đối chiếu hay gọi xác minh, nên
        // từ chối với mọi cách đón, trước cả khi xét người được chọn
        if (!registeredPersons.Any(p => p.Priority == PickupPersonPriorities.Primary))
            return new PickupResult(PickupOutcome.NoPrimaryPerson);

        // BR-PICKUP-04: chỉ tìm trong người đón của đúng trẻ này, nên id của người đã đăng ký cho
        // trẻ khác (kể cả anh chị em) không khớp (D44 mục 3)
        var chosenPerson = registeredPersons.FirstOrDefault(p => p.Id == request.PickupPersonId);
        if (chosenPerson is null)
            return new PickupResult(PickupOutcome.PickupPersonNotFound);

        if (!MethodMatchesPerson(request.PickupMethod, chosenPerson))
            return new PickupResult(PickupOutcome.MethodMismatch);

        var phoneConfirmed = request.PickupMethod == PickupMethods.PhoneConfirmed;

        var pickup = new Pickup
        {
            AttendanceId = attendance.Id,
            // Repository đã lọc lớp chủ nhiệm theo tài khoản đang đăng nhập, nên đây là hồ sơ teachers của chính người gọi
            RecordedByTeacherId = child.Class!.HomeroomTeacherId!.Value,
            PickupTime = now,
            PickupMethod = request.PickupMethod,
            // Primary/Backup: chép họ tên người đón đã đăng ký, bỏ qua giá trị client gửi (AC-PICKUP-01).
            // PhoneConfirmed: họ tên người đến đón do giáo viên nhập, validator đã bắt buộc
            PickerFullName = phoneConfirmed ? request.PickerFullName!.Trim() : chosenPerson.FullName,
            // CK_Pickup_ConfirmedByName: không phải PhoneConfirmed thì phải là null, không phải chuỗi rỗng
            ConfirmedByName = phoneConfirmed ? chosenPerson.FullName : null
        };

        // Hai request cùng lúc cho một bản điểm danh đều qua được bước kiểm ở trên; UNIQUE (attendance_id)
        // chặn request đến sau, và request đó cũng nhận 409 chứ không phải 500
        if (!await _pickupRepository.TryAddAsync(pickup))
            return new PickupResult(PickupOutcome.AlreadyPickedUp);

        return new PickupResult(PickupOutcome.Success, ToResponse(pickup, child));
    }

    // Primary/Backup phải khớp thứ tự ưu tiên của người được chọn, để pickup_method ghi đúng ai đã
    // nhận trẻ. PhoneConfirmed thì người xác nhận là người chính hoặc người dự phòng (D39 mục 11)
    private static bool MethodMatchesPerson(string pickupMethod, RegisteredPickupPerson person) => pickupMethod switch
    {
        PickupMethods.Primary => person.Priority == PickupPersonPriorities.Primary,
        PickupMethods.Backup => person.Priority == PickupPersonPriorities.Backup,
        PickupMethods.PhoneConfirmed => true,
        _ => throw new InvalidOperationException($"Cách đón không xử lý: {pickupMethod}")
    };

    private static PickupResponse ToResponse(Pickup pickup, Child child)
        => new(pickup.Id, pickup.AttendanceId, child.Id, child.FullName, pickup.PickupTime,
            pickup.PickupMethod, pickup.PickerFullName, pickup.ConfirmedByName);
}
