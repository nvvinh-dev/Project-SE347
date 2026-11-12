namespace NhaTre.Application.DTOs.Complaints;

// FR-COMPLAINT-01: phụ huynh chỉ nhập nội dung. Trạng thái, người gửi và thời điểm do server đặt, nên
// client gửi kèm status hay người xử lý thì bị bỏ qua (D44, UC-COMPLAINT-01 A3)
public record CreateComplaintRequest(string Content);
