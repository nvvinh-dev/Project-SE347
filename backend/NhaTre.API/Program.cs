using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.EntityFrameworkCore;
using NhaTre.Application.Interfaces;
using NhaTre.Infrastructure.Persistence;
using NhaTre.Infrastructure.Services;
using NhaTre.Application.Services;
using NhaTre.Infrastructure.Persistence.Repositories;
using NhaTre.API.Middleware;
using Serilog;
using FluentValidation;
using NhaTre.Application.Validators.Auth;
using NhaTre.Application.DTOs.Auth;
using NhaTre.Application.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore", Serilog.Events.LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File(
        "Logs/log-.txt",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 14) // giữ log 14 ngày gần nhất, tự xóa file cũ hơn
    .CreateLogger();
var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();
builder.Services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.OpenApiInfo
    {
        Title = "Nhà Trẻ Management API",
        Version = "v1",
        Description = "API cho hệ thống quản lý nhà trẻ"
    });

    // Cho phép Swagger UI có ô nhập "Bearer <token>" để test các API cần đăng nhập
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.ParameterLocation.Header,
        Description = "Nhập token JWT (không cần gõ chữ 'Bearer ' phía trước, Swagger tự thêm)"
    });

    // Áp scheme "Bearer" ở trên cho MỌI endpoint, để Swagger UI tự đính header
    // Authorization sau khi bấm nút Authorize. Thiếu phần này thì nút Authorize
    // vẫn hiện nhưng "Try it out" không gửi token — xem ghi chú ở D9.
    // Phải truyền `document` vào reference thì tên "Bearer" mới được phân giải khi
    // sinh swagger.json — đó cũng là lý do overload này nhận lambda chứ không nhận
    // thẳng một OpenApiSecurityRequirement. Thiếu tham số document thì security
    // serialize ra rỗng `[ { } ]` và Swagger UI vẫn không đính token.
    options.AddSecurityRequirement(document => new Microsoft.OpenApi.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.OpenApiSecuritySchemeReference("Bearer", document),
            new List<string>()   // scope rỗng: JWT của dự án không dùng OAuth scope
        }
    });
});
builder.Services.AddControllers();

// D38: [ApiController] mặc định tự trả ProblemDetails khi model binding thất bại
// (JSON sai kiểu, thiếu field bắt buộc) — tức là một khuôn response KHÁC ApiResponse<T>
// mà Frontend phải xử lý riêng. Ép nó về đúng khuôn chung.
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        // CỐ Ý không trả thẳng ErrorMessage của ModelState ra ngoài: với lỗi parse JSON,
        // .NET nhét cả tên class DTO và vị trí byte vào đó (VD: "The JSON value could not
        // be converted to NhaTre.Application.DTOs.Auth.LoginRequest. Path: $.email...").
        // Lộ cấu trúc nội bộ cho client là vi phạm NFR-SEC-03 — chỉ trả tên trường.
        var errors = context.ModelState
            .Where(entry => entry.Value is not null && entry.Value.Errors.Count > 0)
            .Select(entry =>
            {
                var field = entry.Key.TrimStart('$', '.');
                return string.IsNullOrEmpty(field)
                    ? "Dữ liệu gửi lên không đọc được (JSON không hợp lệ)."
                    : $"Trường '{field}' bị thiếu hoặc sai kiểu dữ liệu.";
            })
            .Distinct()
            .ToList();

        return new BadRequestObjectResult(ApiResponse<object>.Fail(errors));
    };

    // Không tự bọc các lỗi client KHÔNG có body (404 sai route, 405 sai method,
    // 415 sai Content-Type) thành ProblemDetails — để UseStatusCodePages phía dưới
    // bọc chúng thành ApiResponse. Các lỗi ta tự trả kèm body (NotFound(ApiResponse...))
    // không bị ảnh hưởng.
    options.SuppressMapClientErrors = true;
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection"))
        .UseSnakeCaseNamingConvention());

builder.Services.AddScoped<IPasswordHasher, PasswordHasherService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAuthRepository, AuthRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
builder.Services.AddProblemDetails();
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]
    ?? throw new InvalidOperationException("Thiếu cấu hình Jwt:Key trong user-secrets.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // giữ nguyên tên claim gốc ("sub", "role"), không đổi thành URI dài

        // D38: mặc định JWT middleware trả 401/403 với BODY RỖNG — Frontend đọc
        // res.data.message sẽ nổ. Ghi đè để 2 trường hợp này cũng theo ApiResponse<T>.
        options.Events = new JwtBearerEvents
        {
            OnChallenge = async context =>
            {
                context.HandleResponse(); // chặn hành vi mặc định (401 rỗng + header WWW-Authenticate)
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                context.Response.ContentType = "application/json";

                // Phân biệt token hết hạn với token thiếu/sai, để Frontend hiện đúng
                // thông báo cho giáo viên hết ca thay vì một lỗi chung chung.
                var message = context.AuthenticateFailure is SecurityTokenExpiredException
                    ? "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại."
                    : "Chưa đăng nhập hoặc token không hợp lệ.";

                await context.Response.WriteAsJsonAsync(ApiResponse<object>.Fail(message));
            },

            OnForbidden = async context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(
                    ApiResponse<object>.Fail("Bạn không có quyền thực hiện hành động này."));
            }
        };

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSection["Issuer"],

            ValidateAudience = true,
            ValidAudience = jwtSection["Audience"],

            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),

            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1), // mặc định .NET là 5 phút — rút ngắn cho chặt hơn

            ValidAlgorithms = new[] { SecurityAlgorithms.HmacSha256 }, // chặn algorithm-confusion attack

            RoleClaimType = "role", // khớp đúng tên claim đã phát hành ở TokenService (4.1)
            NameClaimType = System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub,
        };
    });

builder.Services.AddAuthorization();

// D20: CORS chỉ mở cho đúng origin của frontend — KHÔNG dùng AllowAnyOrigin.
// Danh sách origin đọc từ cấu hình "Cors:AllowedOrigins", nên khi deploy chỉ cần
// thêm origin vào appsettings (hoặc biến môi trường), không phải sửa code.
const string FrontendCorsPolicy = "FrontendPolicy";
var allowedOrigins = builder.Configuration
    .GetSection("Cors:AllowedOrigins")
    .Get<string[]>()
    ?? throw new InvalidOperationException("Thiếu cấu hình Cors:AllowedOrigins trong appsettings.");

// D20: rate limit cho /api/auth/login — chặn dò mật khẩu bằng cách thử hàng loạt.
// Chỉ áp cho endpoint đăng nhập (gắn [EnableRateLimiting] ở AuthController), KHÔNG áp
// toàn hệ thống: giáo viên điểm danh cả lớp sẽ bắn nhiều request hợp lệ liên tiếp.
const string LoginRateLimitPolicy = "LoginPolicy";

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

    options.AddPolicy(LoginRateLimitPolicy, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            // Đếm riêng theo IP: 1 người nhập sai nhiều lần không làm khóa cả trường.
            partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 5,                  // 5 lần thử...
                Window = TimeSpan.FromMinutes(1), // ...trong mỗi 1 phút
                QueueLimit = 0                    // vượt ngưỡng là từ chối ngay, không xếp hàng
            }));

    // Giữ đúng khuôn ApiResponse<T> cho cả response 429 (D38).
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.ContentType = "application/json";
        await context.HttpContext.Response.WriteAsJsonAsync(
            ApiResponse<object>.Fail("Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 1 phút rồi thử lại."),
            cancellationToken);
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()    // gồm cả Authorization — frontend đính "Bearer <token>" ở mọi request
              .AllowAnyMethod());  // GET/POST/PUT/DELETE + preflight OPTIONS

    // Cố ý KHÔNG gọi AllowCredentials: dự án không dùng cookie, token đi trong
    // header Authorization (D20). Bật lên sẽ cấm luôn việc dùng wildcard sau này
    // mà không đem lại lợi ích gì.
});

var app = builder.Build();
app.UseExceptionHandler();

// D38: bọc nốt các response do framework sinh ra mà KHÔNG có body — 404 (route không
// tồn tại), 405 (sai HTTP method), 415 (sai Content-Type). Không đụng tới response đã
// có body sẵn (ApiResponse từ Controller, 401/403 ở JwtBearerEvents phía trên).
app.UseStatusCodePages(async statusCodeContext =>
{
    var response = statusCodeContext.HttpContext.Response;
    response.ContentType = "application/json";

    var message = response.StatusCode switch
    {
        StatusCodes.Status404NotFound => "Không tìm thấy đường dẫn yêu cầu.",
        StatusCodes.Status405MethodNotAllowed => "Phương thức HTTP không được hỗ trợ cho đường dẫn này.",
        StatusCodes.Status415UnsupportedMediaType => "Định dạng dữ liệu không được hỗ trợ (cần Content-Type: application/json).",
        _ => "Yêu cầu không hợp lệ."
    };

    await response.WriteAsJsonAsync(ApiResponse<object>.Fail(message));
});
// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Nhà Trẻ API v1");
    });
}

app.UseHttpsRedirection();
app.UseCors(FrontendCorsPolicy); // phải đứng TRƯỚC Authentication/Authorization để preflight OPTIONS không bị chặn bởi 401
app.UseRateLimiter();            // đứng trước Authentication: chặn sớm, không tốn công verify token cho request bị từ chối
app.UseAuthentication();
app.UseMiddleware<NhaTre.API.Middleware.ActiveUserMiddleware>();
app.UseAuthorization();
app.MapControllers();
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
    await NhaTre.Infrastructure.Persistence.DbInitializer.SeedAsync(dbContext, passwordHasher);
}
app.Run();

Log.CloseAndFlush();
