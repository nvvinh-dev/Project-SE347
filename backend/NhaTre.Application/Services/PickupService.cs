using NhaTre.Application.Common;
using NhaTre.Application.DTOs.Pickup;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Constants;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class PickupService : IPickupService
{
    private readonly IPickupRepository _pickupRepository;
    private readonly IFileStorageService _fileStorageService;

    public PickupService(IPickupRepository pickupRepository, IFileStorageService fileStorageService)
    {
        _pickupRepository = pickupRepository;
        _fileStorageService = fileStorageService;
    }

    public async Task<PickupResponse?> GetByIdAsync(Guid id, Guid teacherUserId)
    {
        var pickup = await _pickupRepository.FindByIdInHomeroomClassAsync(id, teacherUserId);
        return pickup is null ? null : ToResponse(pickup, pickup.Attendance.Child);
    }

    // FR-PICKUP-02: màn hình đón về dùng danh sách này để biết trẻ nào đã được đón trong ngày.
    // Giáo viên chưa được gán lớp hoặc ngày chưa có ai được đón thì danh sách rỗng
    public async Task<IReadOnlyList<PickupResponse>> GetByDateAsync(DateOnly date, Guid teacherUserId)
    {
        var pickups = await _pickupRepository.GetByDateInHomeroomClassesAsync(date, teacherUserId);
        return pickups.Select(p => ToResponse(p, p.Attendance.Child)).ToList();
    }

    // FR-PICKUP-02. Kiểm phạm vi trước, rồi mới nạp người đón và xin URL ký (D53): trẻ lớp khác trả
    // null như trẻ không tồn tại, không lộ thông tin người đón (AC-PICKUP-06). Người đón chính đứng
    // trước theo thứ tự của repository (D24)
    public async Task<IReadOnlyList<PickupPersonResponse>?> GetPickupPersonsAsync(Guid childId, Guid teacherUserId)
    {
        var child = await _pickupRepository.FindChildInHomeroomClassAsync(childId, teacherUserId);
        if (child is null)
            return null;

        var registeredPersons = await _pickupRepository.GetRegisteredPersonsAsync(child.Id);
        return await ToPersonResponsesAsync(registeredPersons);
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

    // FR-PICKUP-03. Cùng thứ tự với phía giáo viên: kiểm phạm vi trước, rồi mới nạp người đón và xin URL
    // ký (D53). Trẻ không phải con mình trả null như trẻ không tồn tại (AC-PICKUP-07). Người đón chính
    // đứng trước (AC-PICKUP-03)
    public async Task<IReadOnlyList<PickupPersonResponse>?> GetPickupPersonsForGuardianAsync(Guid childId, Guid parentUserId)
    {
        if (!await _pickupRepository.IsGuardianOfChildAsync(childId, parentUserId))
            return null;

        var registeredPersons = await _pickupRepository.GetRegisteredPersonsAsync(childId);
        return await ToPersonResponsesAsync(registeredPersons);
    }

    public async Task<PickupPersonResponse?> GetPickupPersonForGuardianAsync(Guid childId, Guid id, Guid parentUserId)
    {
        if (!await _pickupRepository.IsGuardianOfChildAsync(childId, parentUserId))
            return null;

        var person = (await _pickupRepository.GetRegisteredPersonsAsync(childId)).FirstOrDefault(p => p.Id == id);
        if (person is null)
            return null;

        return ToPersonResponse(person, await _fileStorageService.GetSignedUrlAsync(person.FacePhotoReference));
    }

    // FR-PICKUP-03, AC-PICKUP-03, AC-PICKUP-11. Validator đã kiểm 4 thông tin, ô xác nhận đồng ý và ảnh.
    // Ở đây kiểm phạm vi (404) rồi các quy tắc 409, qua hết mới upload ảnh: request bị từ chối không để
    // lại file nào trên Storage
    public async Task<PickupPersonResult> CreatePickupPersonAsync(Guid childId, CreatePickupPersonRequest request,
        UploadedPhoto facePhoto, Guid parentUserId)
    {
        if (!await _pickupRepository.IsGuardianOfChildAsync(childId, parentUserId))
            return new PickupPersonResult(PickupPersonOutcome.ChildNotFound);

        var registeredPersons = await _pickupRepository.GetRegisteredPersonsAsync(childId);
        var priority = request.Priority!.Value;
        var hasPrimary = registeredPersons.Any(p => p.Priority == PickupPersonPriorities.Primary);

        // D24: mỗi trẻ một người đón chính; muốn đổi người thì sửa, không thêm người thứ hai
        if (priority == PickupPersonPriorities.Primary && hasPrimary)
            return new PickupPersonResult(PickupPersonOutcome.PrimaryAlreadyExists);

        if (priority == PickupPersonPriorities.Backup)
        {
            // BR-PICKUP-03: phải có người đón chính trước mới thêm được người dự phòng
            if (!hasPrimary)
                return new PickupPersonResult(PickupPersonOutcome.NoPrimaryPerson);

            if (registeredPersons.Any(p => p.Priority == PickupPersonPriorities.Backup))
                return new PickupPersonResult(PickupPersonOutcome.BackupAlreadyExists);
        }

        // BR-PICKUP-08: người dự phòng không trùng số CCCD với người đón chính
        if (registeredPersons.Any(p => p.CitizenIdNumber == request.CitizenIdNumber))
            return new PickupPersonResult(PickupPersonOutcome.DuplicateCitizenId);

        var person = new RegisteredPickupPerson
        {
            ChildId = childId,
            Priority = priority,
            FullName = request.FullName!.Trim(),
            Relationship = request.Relationship!.Trim(),
            PhoneNumber = request.PhoneNumber!,
            CitizenIdNumber = request.CitizenIdNumber!,
            FacePhotoReference = await UploadFacePhotoAsync(facePhoto),
            // D24, D44 mục 2: bằng chứng xác nhận đồng ý do server đặt ở mỗi lần lưu
            ConsentConfirmedAt = DateTime.UtcNow,
            ConsentConfirmedByUserId = parentUserId
        };

        var saved = false;
        try
        {
            // Xin URL ký trước khi ghi DB: bước này lỗi thì chưa có gì được lưu
            var facePhotoUrl = await _fileStorageService.GetSignedUrlAsync(person.FacePhotoReference);

            // Hai request cùng thêm một loại người đón đều qua được bước kiểm ở trên; UNIQUE (child_id,
            // priority) chặn request đến sau, và request đó cũng nhận 409 chứ không phải 500
            saved = await _pickupRepository.TryAddRegisteredPersonAsync(person);
            if (!saved)
                return new PickupPersonResult(priority == PickupPersonPriorities.Primary
                    ? PickupPersonOutcome.PrimaryAlreadyExists
                    : PickupPersonOutcome.BackupAlreadyExists);

            return new PickupPersonResult(PickupPersonOutcome.Success, ToPersonResponse(person, facePhotoUrl));
        }
        finally
        {
            // Không lưu được người đón (409 hay lỗi) thì xóa ảnh vừa upload, không để file mồ côi
            if (!saved)
                await _fileStorageService.DeleteAsync(person.FacePhotoReference);
        }
    }

    // FR-PICKUP-03 (E1), AC-PICKUP-12, AC-PICKUP-15 (c). Sửa là ghi đè cả 4 thông tin và bằng chứng xác
    // nhận đồng ý; ảnh mới tùy chọn. Không đổi được thứ tự ưu tiên. Bản ghi đón về lưu họ tên lúc đón nên
    // sửa ở đây không đổi lịch sử đón (BR-PICKUP-07)
    public async Task<PickupPersonResult> UpdatePickupPersonAsync(Guid childId, Guid id, PickupPersonRequest request,
        UploadedPhoto? facePhoto, Guid parentUserId)
    {
        if (!await _pickupRepository.IsGuardianOfChildAsync(childId, parentUserId))
            return new PickupPersonResult(PickupPersonOutcome.ChildNotFound);

        var registeredPersons = await _pickupRepository.GetRegisteredPersonsAsync(childId);
        var current = registeredPersons.FirstOrDefault(p => p.Id == id);
        if (current is null)
            return new PickupPersonResult(PickupPersonOutcome.PickupPersonNotFound);

        // BR-PICKUP-08: so với người đón còn lại của trẻ, dù đang sửa người chính hay người dự phòng
        if (registeredPersons.Any(p => p.Id != id && p.CitizenIdNumber == request.CitizenIdNumber))
            return new PickupPersonResult(PickupPersonOutcome.DuplicateCitizenId);

        var hasNewPhoto = facePhoto is not null;
        var person = new RegisteredPickupPerson
        {
            Id = current.Id,
            ChildId = current.ChildId,
            Priority = current.Priority,
            FullName = request.FullName!.Trim(),
            Relationship = request.Relationship!.Trim(),
            PhoneNumber = request.PhoneNumber!,
            CitizenIdNumber = request.CitizenIdNumber!,
            FacePhotoReference = hasNewPhoto ? await UploadFacePhotoAsync(facePhoto!) : current.FacePhotoReference,
            ConsentConfirmedAt = DateTime.UtcNow,
            ConsentConfirmedByUserId = parentUserId
        };

        var saved = false;
        PickupPersonResponse response;
        try
        {
            var facePhotoUrl = await _fileStorageService.GetSignedUrlAsync(person.FacePhotoReference);

            saved = await _pickupRepository.TryUpdateRegisteredPersonAsync(person, current.FacePhotoReference);
            if (!saved)
                return new PickupPersonResult(PickupPersonOutcome.ChangedConcurrently);

            response = ToPersonResponse(person, facePhotoUrl);
        }
        finally
        {
            if (!saved && hasNewPhoto)
                await _fileStorageService.DeleteAsync(person.FacePhotoReference);
        }

        // D24: thay ảnh thì xóa file cũ. Xóa sau khi đã lưu khóa mới, để người đón không lúc nào trỏ tới
        // một file đã mất
        if (hasNewPhoto)
            await _fileStorageService.DeleteAsync(current.FacePhotoReference);

        return new PickupPersonResult(PickupPersonOutcome.Success, response);
    }

    // FR-PICKUP-03 (E2, E3), AC-PICKUP-08: ngoại lệ Xóa của D40 mục 1, chỉ cho người đón dự phòng
    public async Task<PickupPersonResult> DeletePickupPersonAsync(Guid childId, Guid id, Guid parentUserId)
    {
        if (!await _pickupRepository.IsGuardianOfChildAsync(childId, parentUserId))
            return new PickupPersonResult(PickupPersonOutcome.ChildNotFound);

        var person = (await _pickupRepository.GetRegisteredPersonsAsync(childId)).FirstOrDefault(p => p.Id == id);
        if (person is null)
            return new PickupPersonResult(PickupPersonOutcome.PickupPersonNotFound);

        // BR-PICKUP-07: trẻ luôn phải có người đón chính
        if (person.Priority == PickupPersonPriorities.Primary)
            return new PickupPersonResult(PickupPersonOutcome.CannotDeletePrimary);

        if (!await _pickupRepository.TryDeleteBackupPersonAsync(person.Id, person.FacePhotoReference))
            return new PickupPersonResult(PickupPersonOutcome.ChangedConcurrently);

        // D24: xóa người dự phòng thì xóa luôn ảnh khuôn mặt, sau khi dòng đã xóa
        await _fileStorageService.DeleteAsync(person.FacePhotoReference);

        return new PickupPersonResult(PickupPersonOutcome.Success);
    }

    private async Task<string> UploadFacePhotoAsync(UploadedPhoto facePhoto)
    {
        using var content = facePhoto.OpenReadStream();
        return await _fileStorageService.UploadAsync(content, StorageFolders.PickupFaces, facePhoto.ContentType);
    }

    private async Task<IReadOnlyList<PickupPersonResponse>> ToPersonResponsesAsync(
        IReadOnlyList<RegisteredPickupPerson> registeredPersons)
    {
        var responses = new List<PickupPersonResponse>(registeredPersons.Count);
        foreach (var person in registeredPersons)
            responses.Add(ToPersonResponse(person, await _fileStorageService.GetSignedUrlAsync(person.FacePhotoReference)));

        return responses;
    }

    private static PickupPersonResponse ToPersonResponse(RegisteredPickupPerson person, string facePhotoUrl)
        => new(person.Id, person.Priority, person.FullName, person.Relationship, person.PhoneNumber,
            person.CitizenIdNumber, facePhotoUrl);

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
