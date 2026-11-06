namespace NhaTre.Application.DTOs.Notifications;

// FR-NOTI-03: Kế toán chỉ nhập nội dung; người nhận do backend xác định, không nhận từ client (D44)
public record SchoolClosureRequest(string Content);
