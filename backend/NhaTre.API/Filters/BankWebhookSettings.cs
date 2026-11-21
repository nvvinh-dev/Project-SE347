namespace NhaTre.API.Filters;

// D21 mục 2, D46: khóa HMAC của webhook ngân hàng, đọc từ BankWebhook:SecretKey (user-secrets) và kiểm
// độ dài lúc khởi động ở Program.cs. Giữ sẵn dạng byte (UTF-8 của chuỗi khóa) để mỗi request không phải
// đổi lại; bên gửi (ngân hàng, Postman) cũng ký bằng byte UTF-8 của đúng chuỗi đó
public sealed record BankWebhookSettings(byte[] SecretKey);
