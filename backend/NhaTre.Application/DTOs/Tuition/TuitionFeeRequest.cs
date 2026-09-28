namespace NhaTre.Application.DTOs.Tuition;

// D39 mục 4: biểu phí là danh mục phẳng gồm mô tả và số tiền, một mức phí chung toàn trường
public record TuitionFeeRequest(
    string Description,
    decimal Amount);
