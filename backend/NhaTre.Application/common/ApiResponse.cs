namespace NhaTre.Application.Common;

public class ApiResponse<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public string? Message { get; init; }
    public IReadOnlyList<string>? Errors { get; init; }

    public static ApiResponse<T> Ok(T data, string? message = null)
        => new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message)
        => new() { Success = false, Message = message };

    public static ApiResponse<T> Fail(IReadOnlyList<string> errors, string message = "Dữ liệu không hợp lệ.")
        => new() { Success = false, Message = message, Errors = errors };
}