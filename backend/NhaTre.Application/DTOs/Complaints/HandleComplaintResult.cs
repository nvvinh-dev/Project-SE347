namespace NhaTre.Application.DTOs.Complaints;

public enum HandleComplaintOutcome
{
    Success,
    ComplaintNotFound,   // 404
    AlreadyResolved      // 409: đã Resolved thì không đổi được nữa (D39 mục 18)
}

// Complaint có giá trị khi Outcome là Success
public record HandleComplaintResult(HandleComplaintOutcome Outcome, ComplaintResponse? Complaint = null);
