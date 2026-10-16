import { useEffect, useRef } from "react";

export interface UseFocusTrapOptions {
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  /**
   * Phần tử ưu tiên nhận focus khi mở modal.
   * Nếu không truyền, hook sẽ tự động focus vào phần tử focusable đầu tiên bên trong container.
   */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

/**
 * Hook quản lý bẫy focus (Focus Trap) và khôi phục focus (Return Focus) cho Modal/Dialog.
 * Đạt chuẩn Accessibility (a11y) và bám sát quy chuẩn review PR #36:
 * 1. Tự động đưa focus vào bên trong modal ngay khi mở (kể cả mở bằng chuột qua requestAnimationFrame).
 * 2. Giữ vòng lặp Tab / Shift+Tab hoàn toàn bên trong modal, không để lọt ra bảng phía sau.
 * 3. Đóng bằng phím Escape (khi không ở trạng thái loading).
 * 4. Khóa cuộn trang (body overflow) khi modal mở và khôi phục lại khi đóng.
 * 5. Khôi phục focus về đúng phần tử kích hoạt trước đó (activeElement) khi modal đóng.
 */
export function useFocusTrap({
  isOpen,
  isLoading = false,
  onClose,
  initialFocusRef,
}: UseFocusTrapOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    // Lưu lại phần tử đang có focus trước khi mở modal để khôi phục khi đóng
    previousActiveElement.current = document.activeElement as HTMLElement | null;

    // Khóa cuộn trang
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Đưa focus vào trong modal qua requestAnimationFrame
    const focusFrame = requestAnimationFrame(() => {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else if (containerRef.current) {
        const dialog = containerRef.current;
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            "a[href], button, input, select, textarea, [tabindex], [contenteditable='true']"
          )
        ).filter(
          (el) =>
            el.tabIndex >= 0 &&
            !el.matches(":disabled") &&
            !el.closest("[hidden], [inert]") &&
            el.getClientRects().length > 0 &&
            window.getComputedStyle(el).visibility !== "hidden"
        );

        if (focusable.length > 0) {
          focusable[0].focus();
        } else {
          dialog.focus();
        }
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;

      // Phím Escape: đóng modal khi không bận gửi request
      if (e.key === "Escape" && !isLoading) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }

      if (e.key !== "Tab") return;

      const dialog = containerRef.current;
      if (!dialog) return;

      // Lấy danh sách phần tử focusable đang hợp lệ và hiển thị
      const focusable = Array.from(
        dialog.querySelectorAll<HTMLElement>(
          "a[href], button, input, select, textarea, [tabindex], [contenteditable='true']"
        )
      )
        .filter(
          (element) =>
            element.tabIndex >= 0 &&
            !element.matches(":disabled") &&
            !element.closest("[hidden], [inert]") &&
            element.getClientRects().length > 0 &&
            window.getComputedStyle(element).visibility !== "hidden"
        )
        .sort(
          (a, b) =>
            (a.tabIndex > 0 ? a.tabIndex : Infinity) -
            (b.tabIndex > 0 ? b.tabIndex : Infinity)
        );

      const first = focusable[0];
      const last = focusable.at(-1);
      const active = document.activeElement;

      // Nếu không có phần tử nào hoặc các nút đều bị disabled (khi loading)
      if (!first || !last) {
        e.preventDefault();
        dialog.focus();
      } else if (!dialog.contains(active) || active === dialog) {
        // Nếu focus đang ở ngoài dialog (mở bằng chuột), kéo ngay focus vào trong dialog
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
      } else if (e.shiftKey && active === first) {
        // Shift + Tab từ phần tử đầu tiên -> nhảy về phần tử cuối cùng
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        // Tab từ phần tử cuối cùng -> nhảy về phần tử đầu tiên
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;

      // Khôi phục focus về nút đã mở modal
      requestAnimationFrame(() => {
        previousActiveElement.current?.focus?.();
      });
    };
  }, [isOpen, isLoading, initialFocusRef]);

  return { containerRef };
}
