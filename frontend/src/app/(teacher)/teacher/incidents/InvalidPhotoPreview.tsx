export default function InvalidPhotoPreview() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-danger-bg text-danger">
      <svg
        role="img"
        aria-label="Tệp ảnh không hợp lệ"
        className="h-6 w-6"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 12l6 6m0-6l-6 6"
        />
      </svg>
    </div>
  );
}
