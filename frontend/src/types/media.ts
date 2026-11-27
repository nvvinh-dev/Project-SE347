// Phản chiếu DTO phụ huynh xem ảnh hoạt động (FR-MEDIA-02, D45, D53).

// Ảnh của lớp con đang học; `url` là URL ký hạn 60 phút, không kèm lớp, người tải lên hay khóa file.
export interface ParentActivityPhoto {
  id: string;
  uploadedAtUtc: string;
  url: string;
}

export interface ParentActivityPhotoPage {
  items: ParentActivityPhoto[];
  page: number;
  pageSize: number;
  totalCount: number;
}
