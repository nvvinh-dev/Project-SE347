using NhaTre.Application.DTOs.Tuition;
using NhaTre.Application.Interfaces;
using NhaTre.Domain.Entities;

namespace NhaTre.Application.Services;

public class TuitionService : ITuitionService
{
    private readonly ITuitionRepository _tuitionRepository;

    public TuitionService(ITuitionRepository tuitionRepository)
    {
        _tuitionRepository = tuitionRepository;
    }

    public async Task<IReadOnlyList<TuitionFeeResponse>> GetFeesAsync()
    {
        var fees = await _tuitionRepository.GetAllFeesAsync();
        return fees.Select(ToResponse).ToList();
    }

    public async Task<TuitionFeeResponse?> GetFeeByIdAsync(Guid id)
    {
        var fee = await _tuitionRepository.FindFeeByIdAsync(id);
        return fee is null ? null : ToResponse(fee);
    }

    // D39 mục 4: một mức phí chung toàn trường. Đã có biểu phí thì trả null để Controller
    // báo 409 — Kế toán sửa mức phí hiện có chứ không tạo thêm
    public async Task<TuitionFeeResponse?> CreateFeeAsync(TuitionFeeRequest request)
    {
        if (await _tuitionRepository.AnyFeeAsync())
            return null;

        var fee = new TuitionFee
        {
            Description = request.Description.Trim(),
            Amount = request.Amount
        };

        _tuitionRepository.AddFee(fee);
        await _tuitionRepository.SaveChangesAsync();
        return ToResponse(fee);
    }

    // Hóa đơn chép số tiền và mô tả lúc tạo, nên sửa biểu phí không làm đổi hóa đơn đã lập (D39 mục 4)
    public async Task<TuitionFeeResponse?> UpdateFeeAsync(Guid id, TuitionFeeRequest request)
    {
        var fee = await _tuitionRepository.FindFeeByIdAsync(id);

        if (fee is null)
            return null;

        fee.Description = request.Description.Trim();
        fee.Amount = request.Amount;

        await _tuitionRepository.SaveChangesAsync();
        return ToResponse(fee);
    }

    private static TuitionFeeResponse ToResponse(TuitionFee fee)
        => new(fee.Id, fee.Description, fee.Amount);
}
