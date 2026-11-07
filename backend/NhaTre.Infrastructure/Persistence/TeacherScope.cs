using Microsoft.EntityFrameworkCore;

namespace NhaTre.Infrastructure.Persistence;

// Phạm vi của giáo viên (D40 mục 2, BR-SCOPE-02): lớp mình phụ trách là lớp mình là giáo viên chủ nhiệm
// hoặc giáo viên phụ (class_teachers), quyền như nhau. Mọi repository lọc phạm vi giáo viên đều đi qua
// đây để hai nguồn không bị lệch nhau
internal static class TeacherScope
{
    // Truy vấn chưa chạy: dùng trong Where bằng Contains thì EF dịch thành class_id IN (subquery), cùng một
    // câu SQL với truy vấn chính. Trẻ chưa xếp lớp có class_id null nên không bao giờ khớp. Giáo viên bị gỡ
    // khỏi lớp thì mất quyền ngay ở request kế tiếp vì không có gì được lưu tạm
    public static IQueryable<Guid?> ClassIdsInScope(this AppDbContext dbContext, Guid teacherUserId)
        => dbContext.Classes
            .Where(c => c.HomeroomTeacher!.UserId == teacherUserId
                || c.AssistantTeachers.Any(ct => ct.Teacher.UserId == teacherUserId))
            .Select(c => (Guid?)c.Id);

    // Hồ sơ teachers của người gọi, để ghi người ghi nhận là chính giáo viên đã tạo bản ghi, kể cả khi
    // họ là giáo viên phụ (D44 mục 2). null khi tài khoản không có hồ sơ
    public static async Task<Guid?> FindTeacherIdAsync(this AppDbContext dbContext, Guid teacherUserId)
        => await dbContext.Teachers
            .AsNoTracking()
            .Where(t => t.UserId == teacherUserId)
            .Select(t => (Guid?)t.Id)
            .FirstOrDefaultAsync();
}
