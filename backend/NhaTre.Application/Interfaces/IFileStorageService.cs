namespace NhaTre.Application.Interfaces;

// D22, D53: mọi thao tác với file ảnh đi qua interface này. Controller và Service không gọi
// thẳng SDK của nhà cung cấp, không tự ghép URL. Bên ngoài chỉ cầm "khóa" của file — giá trị
// lưu ở các cột file_reference / face_photo_reference — không bao giờ cầm đường dẫn thô.
public interface IFileStorageService
{
    // Đẩy một ảnh lên thư mục StorageFolders.X. File phải đã qua kiểm tra số lượng, dung lượng
    // và định dạng ở tầng Api (D39 mục 5). Tên file do backend tự sinh, không dùng tên client
    // gửi (D44 mục 2). Trả về khóa đầy đủ, ví dụ "incidents/<khóa>.jpg", để lưu vào database.
    Task<string> UploadAsync(Stream content, string folder, string contentType);

    // D53: URL ký hạn 60 phút để frontend tải ảnh thẳng từ Storage. Chỉ gọi SAU KHI đã kiểm tra
    // phạm vi người xem (ngoài phạm vi → 404). Không lưu URL này vào database.
    Task<string> GetSignedUrlAsync(string fileReference);

    // D24: xóa file cũ khi phụ huynh thay ảnh khuôn mặt, thay người hoặc xóa người đón dự phòng.
    // File không còn trên Storage thì coi như đã xóa, không báo lỗi.
    Task DeleteAsync(string fileReference);
}
