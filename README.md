# Hệ thống quản lý nhà trẻ

Ứng dụng web quản lý hoạt động hằng ngày của nhà trẻ: hồ sơ trẻ, lớp học, điểm danh,
theo dõi sức khỏe, học phí và thông báo cho phụ huynh.

Backend là ASP.NET Core Web API dựng theo kiến trúc 4 lớp, frontend là Next.js.

## Công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Backend | ASP.NET Core 10, EF Core 10, FluentValidation, Serilog |
| Cơ sở dữ liệu | PostgreSQL (đang dùng Supabase) |
| Xác thực | JWT Bearer, thuật toán HS256 |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Gọi API | Axios, TanStack Query, React Hook Form |

## Yêu cầu môi trường

- .NET SDK 10
- Node.js 20.9 trở lên
- Một cơ sở dữ liệu PostgreSQL
- Công cụ `dotnet-ef` để chạy migration:

```
dotnet tool install --global dotnet-ef
```

## Cấu hình

Chuỗi kết nối và khóa JWT không nằm trong repo. Mỗi người tự khai báo bằng user-secrets,
chạy trong thư mục `backend/NhaTre.API`:

```
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=...;Port=5432;Database=...;Username=...;Password=..."
dotnet user-secrets set "Jwt:Key" "<chuỗi ngẫu nhiên tối thiểu 32 ký tự>"
```

Các chức năng có ảnh (ảnh sự cố, ảnh hoạt động, ảnh người đón) cần thêm hai giá trị của Supabase Storage:

```
dotnet user-secrets set "Supabase:Url" "https://<mã-project>.supabase.co"
dotnet user-secrets set "Supabase:ServiceKey" "<service key>"
```

Thiếu hai giá trị này thì ứng dụng vẫn chạy, chỉ những request đụng tới ảnh trả lỗi 500.

Xin các giá trị trên từ lead. Không đưa giá trị nào vào bất kỳ file nào trong repo.

Phía frontend, sao chép `frontend/.env.example` thành `frontend/.env.local`. Giá trị mặc
định đã trỏ về `http://localhost:5015`, chỉ sửa nếu bạn đổi cổng backend.

## Chạy dự án

Tạo hoặc cập nhật schema cơ sở dữ liệu:

```
dotnet ef database update --project backend/NhaTre.Infrastructure --startup-project backend/NhaTre.API
```

Chạy backend:

```
dotnet run --project backend/NhaTre.API
```

API chạy ở `http://localhost:5015`, tài liệu Swagger ở `http://localhost:5015/swagger`.
Log ghi ra console và thư mục `Logs/`, tách theo ngày, giữ lại 14 ngày gần nhất.

Chạy frontend:

```
cd frontend
npm install
npm run dev
```

Giao diện ở `http://localhost:3000`.

Backend chỉ chấp nhận request từ các origin khai báo ở `Cors:AllowedOrigins` trong
`appsettings.json`, mặc định là `http://localhost:3000`. Nếu bạn chạy frontend ở cổng
khác thì phải bổ sung vào đây, không thì trình duyệt sẽ chặn.

## Cấu trúc thư mục

```
backend/
  NhaTre.Domain/          Entity và hằng số. Không tham chiếu project nào khác.
  NhaTre.Application/     DTO, interface, service, validator.
  NhaTre.Infrastructure/  DbContext, cấu hình Fluent API, migration, repository.
  NhaTre.API/             Controller, middleware, cấu hình khởi động.
frontend/
  src/app/                Route theo App Router.
  src/context/            AuthContext, quản lý phiên đăng nhập.
  src/lib/                Axios instance đã gắn sẵn interceptor.
  src/types/              Kiểu dữ liệu dùng chung.
```

Phụ thuộc đi một chiều: API phụ thuộc Application, Infrastructure phụ thuộc Application,
Application phụ thuộc Domain. Domain không tham chiếu ngược lên lớp nào.

## API hiện có

Danh sách đầy đủ, kèm tham số và kiểu dữ liệu, xem ở Swagger (`/swagger`) khi chạy backend. Các
nhóm chức năng đã có:

| Nhóm | Đường dẫn chính | Vai trò dùng |
| --- | --- | --- |
| Đăng nhập, đăng xuất | `/api/auth` | Mọi vai trò |
| Tài khoản và vai trò | `/api/users` | Admin |
| Lớp, xếp lớp, giáo viên phụ trách | `/api/classes`, `/api/class-placements` | Admin |
| Thống kê | `/api/dashboard` | Admin |
| Hồ sơ trẻ, liên kết phụ huynh | `/api/children`, `/api/parent-accounts` | Kế toán, Phụ huynh |
| Hồ sơ giáo viên | `/api/teachers`, `/api/teacher-accounts` | Kế toán |
| Học phí, hóa đơn, doanh thu | `/api/tuition-fees`, `/api/invoices`, `/api/revenue-reports` | Kế toán, Phụ huynh |
| Thực đơn tuần | `/api/weekly-menus` | Kế toán, Phụ huynh |
| Điểm danh vào lớp | `/api/attendances` | Giáo viên, Phụ huynh |
| Đón về và người đón | `/api/pickups`, `/api/children/{id}/pickup-persons` | Giáo viên, Phụ huynh |
| Sức khỏe và số đo | `/api/quick-health-statuses`, `/api/homeroom-children`, `/api/school-children`, `/api/children/{id}/health` | Giáo viên, Y tế, Phụ huynh |
| Sự cố | `/api/incidents` | Giáo viên, Y tế, Phụ huynh |
| Ảnh hoạt động | `/api/classes/{id}/activity-photos`, `/api/children/{id}/activity-photos` | Giáo viên, Phụ huynh |
| Thông báo | `/api/notifications` | Phụ huynh, Y tế, Admin, Kế toán |
| Phản ánh | `/api/complaints`, `/api/children/{id}/complaints` | Phụ huynh, Admin |

Mọi response đều theo chung một khuôn, kể cả khi lỗi:

```json
{ "success": true, "data": { }, "message": null, "errors": null }
```

Endpoint đăng nhập bị giới hạn 5 lần gọi mỗi phút cho mỗi địa chỉ IP. Vượt quá sẽ nhận
mã 429, chờ hết phút đó rồi thử lại.

## Quy ước làm việc

- `develop` là nhánh tích hợp, không commit thẳng lên đó. Không ai tự mở pull request
  vào `main`.
- Mỗi nhóm việc làm trên một nhánh riêng, mỗi nhánh chỉ một người làm:
  - Backend: `feature/auth`, `feature/user`, `feature/student`, `feature/teacher`,
    `feature/class`, `feature/attendance`, `feature/health`, `feature/media`,
    `feature/tuition`, `feature/menu`, `feature/notification`.
  - Frontend, chia theo vai trò: `feature/fe-teacher`, `feature/fe-medical`,
    `feature/fe-accounting`, `feature/fe-parent`, `feature/fe-admin`.
  - Dashboard (cả backend lẫn giao diện): `feature/dashboard`.

  Thẻ Trello nào làm trên nhánh nào có trong `docs/onboarding/team-workflow.md`.
- Làm xong thì mở pull request vào `develop`. GitHub tự gán người review theo
  `.github/CODEOWNERS`: `backend/` do @nvvinh-dev duyệt, `frontend/` do @QuangGiang06 duyệt.
  Mô tả pull request ghi rõ làm gì, thêm endpoint nào, mã FR tương ứng và đã test thế nào.
- Commit theo Conventional Commits: `feat(scope): ...`, `fix(scope): ...`, `chore: ...`.

## Tài liệu

Tài liệu đặc tả yêu cầu, quy tắc nghiệp vụ, thiết kế cơ sở dữ liệu, hướng dẫn onboarding
và nhật ký quyết định không nằm trong repo này mà ở repo private `Project-SE347-docs`, lead
cấp quyền cho từng thành viên. Clone repo đó vào thư mục `docs/` của dự án (repo này đã bỏ
qua thư mục `docs/`):

```
git clone https://github.com/nvvinh-dev/Project-SE347-docs.git docs
```

Khi lead báo có cập nhật tài liệu, chạy `git -C docs pull`.

Trong mã nguồn có những chú thích dạng `D20`, `D38`, `D39` — đó là số hiệu quyết định,
tra trong `docs/DECISIONS.md`.
