import type { ApiError } from "@/lib/axios";

interface ShareFeedbackProps {
  error: ApiError;
  uncertain: boolean;
}

export default function ShareFeedback({ error, uncertain }: ShareFeedbackProps) {
  const details = error.errors?.filter((item) => item && item !== error.message) ?? [];
  const tone = uncertain
    ? "border-warning-border bg-warning-bg text-warning"
    : "border-danger-border bg-danger-bg text-danger";

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm shadow-xs ${tone}`}
    >
      <svg
        aria-hidden="true"
        className="mt-0.5 h-5 w-5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d={
            uncertain
              ? "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              : "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          }
        />
      </svg>
      <div className="min-w-0 flex-1">
        {uncertain ? (
          <>
            <p className="font-semibold">Chưa xác định được kết quả chia sẻ</p>
            <p className="mt-1 leading-relaxed text-foreground/80">
              Kết nối bị gián đoạn hoặc máy chủ chưa phản hồi. Ảnh có thể đã được chia sẻ và phụ huynh có thể đã nhận
              thông báo. Hệ thống không tự gửi lại; chỉ chia sẻ lại khi bạn chắc chắn ảnh chưa được đăng.
            </p>
          </>
        ) : (
          <>
            <p className="font-semibold">{error.message}</p>
            {details.length > 0 && (
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-foreground/80">
                {details.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
