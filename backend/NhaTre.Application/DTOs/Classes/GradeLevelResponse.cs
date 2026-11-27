namespace NhaTre.Application.DTOs.Classes;

// 3 khối cố định (D39 mục 3). Khoảng tuổi nửa mở: trẻ thuộc khối khi MinAgeMonths <= tuổi < MaxAgeMonths
public record GradeLevelResponse(short Id, string Name, int MinAgeMonths, int MaxAgeMonths);
