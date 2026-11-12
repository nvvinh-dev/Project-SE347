namespace NhaTre.Application.DTOs.Complaints;

// FR-COMPLAINT-02: Status là InProgress hoặc Resolved. Resolution bắt buộc khi Resolved, bị bỏ qua khi
// InProgress vì kết quả chỉ có nghĩa khi đã xử lý xong
public record HandleComplaintRequest(string Status, string? Resolution);
