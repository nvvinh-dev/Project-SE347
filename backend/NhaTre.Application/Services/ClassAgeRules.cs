namespace NhaTre.Application.Services;

// Quy tắc tuổi khi xếp lớp (BR-CLASS-03, D39 mục 3). Tách thành hàm thuần để thử được với ngày bất kỳ
public static class ClassAgeRules
{
    // Số tháng tuổi tròn. Trẻ đủ thêm một tháng vào ngày trùng ngày sinh; tháng không có ngày đó
    // (sinh ngày 31, sinh 29/2) thì tính đủ vào ngày cuối tháng
    public static int AgeInMonths(DateOnly dateOfBirth, DateOnly today)
    {
        var months = (today.Year - dateOfBirth.Year) * 12 + today.Month - dateOfBirth.Month;

        if (dateOfBirth.AddMonths(months) > today)
            months--;

        return months;
    }

    // Ba lớp nối nhau ở mốc 48 và 60 tháng, nên lấy nửa khoảng [min, max): trẻ đúng 48 tháng vào lớp
    // Chồi, không vào lớp Mầm. Lớp thiếu một trong hai giới hạn thì không nhận trẻ nào
    public static bool FitsAgeRange(int ageInMonths, int? minAgeMonths, int? maxAgeMonths)
        => minAgeMonths is not null
            && maxAgeMonths is not null
            && ageInMonths >= minAgeMonths
            && ageInMonths < maxAgeMonths;
}
