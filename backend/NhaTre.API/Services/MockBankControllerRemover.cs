using System.Reflection;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.AspNetCore.Mvc.Controllers;
using NhaTre.API.Controllers;

namespace NhaTre.API.Services;

// D57, AC-SEC-04: khi không chạy Development hoặc chưa bật MockBank:Enabled, Program.cs thêm provider này vào
// sau provider mặc định của MVC. Provider mặc định đã quét assembly và liệt kê mọi controller; provider này gỡ
// MockBankController khỏi danh sách đó, nên route của nó không được đăng ký: request trả 404 như đường dẫn lạ,
// Swagger không liệt kê. Cách này khác một filter trả 404, vì với filter endpoint vẫn nằm trong danh sách route
public sealed class MockBankControllerRemover : IApplicationFeatureProvider<ControllerFeature>
{
    public void PopulateFeature(IEnumerable<ApplicationPart> parts, ControllerFeature feature)
        => feature.Controllers.Remove(typeof(MockBankController).GetTypeInfo());
}
