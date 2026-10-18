using NhaTre.Application.Common;

namespace NhaTre.Application.DTOs.Incidents;

// FR-INCIDENT-02: các ảnh giáo viên đính thêm vào một sự cố đã có, Controller chép từ trường photos của
// multipart. Không có người tải lên hay khóa file: sự cố lấy từ route, khóa file do backend sinh (D44 mục 2)
public record AttachIncidentPhotosRequest(IReadOnlyList<UploadedPhoto> Photos);
