/** D57, D21 mục 1: nhãn bắt buộc trên mọi màn hình có tài khoản giả; mã QR vẫn là VietQR thật. */
export function MockBankNotice() {
  return (
    <p role="note" className="flex items-start gap-2.5 rounded-xl border border-warning-border bg-warning-bg px-3.5 py-3 text-xs leading-relaxed text-amber-800 sm:text-sm">
      <svg aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" />
      </svg>
      <span>
        <strong className="font-semibold">Môi trường giả lập — không có giao dịch tiền thật.</strong>{" "}
        Không quét mã QR bằng ứng dụng ngân hàng thật.
      </span>
    </p>
  );
}
