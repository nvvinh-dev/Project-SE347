namespace NhaTre.Application.DTOs.Menu;

// DayOfWeek theo ISO 8601: 1 = thứ Hai ... 7 = Chủ nhật. AllergenCodes xếp theo thứ tự của danh mục.
// MatchedAllergenCodes chỉ có khi Phụ huynh xem kèm childId: dị nguyên của ngày trùng với dị nguyên của
// con (rỗng là ngày đó không trùng); không kèm childId thì null (FR-MENU-03, D39 mục 19)
public record MenuEntryResponse(
    int DayOfWeek,
    string Description,
    IReadOnlyList<string> AllergenCodes,
    IReadOnlyList<string>? MatchedAllergenCodes = null);
