namespace NhaTre.Application.DTOs.Menu;

// Phụ huynh xem thực đơn kèm childId có hai kiểu 404 (trẻ không phải con mình, tuần chưa có thực đơn),
// nên Service trả kết quả kèm lý do để Controller chọn message
public enum WeeklyMenuOutcome
{
    Success,
    ChildNotFound,
    MenuNotFound
}

public record WeeklyMenuResult(WeeklyMenuOutcome Outcome, WeeklyMenuResponse? Menu = null);
