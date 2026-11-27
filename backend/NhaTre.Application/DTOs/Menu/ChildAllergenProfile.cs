namespace NhaTre.Application.DTOs.Menu;

// Trẻ có dị nguyên, dùng để tìm trẻ bị trùng với thực đơn (FR-MENU-03). Không trả ra client
public record ChildAllergenProfile(Guid ChildId, string FullName, IReadOnlyList<string> AllergenCodes);
