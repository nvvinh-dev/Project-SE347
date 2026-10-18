namespace NhaTre.Application.Common;

// Một file ảnh client gửi lên qua multipart, Controller chép từ IFormFile để tầng Application không
// phụ thuộc ASP.NET Core. FileName, ContentType và Length chỉ để kiểm tra định dạng, dung lượng
// trước khi tới IFileStorageService (D39 mục 5, D44 mục 5); file lưu mang tên do backend sinh.
// OpenReadStream mở lại nội dung file mỗi lần gọi, người gọi tự đóng stream
public record UploadedPhoto(string FileName, string ContentType, long Length, Func<Stream> OpenReadStream);
