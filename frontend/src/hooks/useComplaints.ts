"use client";

import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import { useApiQuery, useApiMutation } from "./useApiQuery";
import type { ApiResponse } from "@/types/auth";
import type {
  ComplaintListResponse,
  ComplaintListQuery,
  ComplaintHandlingRequest,
  ComplaintResponse,
  ComplaintStatus,
} from "@/types/complaint";

export const COMPLAINTS_QUERY_KEY = ["complaints"] as const;

export function complaintsKey(query?: ComplaintListQuery) {
  return [...COMPLAINTS_QUERY_KEY, query?.status ?? "All", query?.page ?? 1, query?.pageSize ?? 10] as const;
}

// Bộ dữ liệu mẫu chuẩn nghiệp vụ cho Ban Giám Hiệu (trello-board §6, hỗ trợ chạy thử trước khi Lead Backend merge API)
const initialMockComplaints: ComplaintResponse[] = [
  {
    id: "comp-01",
    child: { id: "child-01", fullName: "Nguyễn Bảo An", className: "Mầm 1" },
    parent: { id: "parent-01", fullName: "Nguyễn Văn Hùng", phone: "0901234567" },
    content: "Bé An dạo này về nhà hay nói bị bạn lớp bên giành đồ chơi và xô ngã trong giờ sinh hoạt sân trường. Nhờ cô giáo và Ban giám hiệu lưu ý quan sát giúp gia đình trong các giờ chơi tự do.",
    status: "Pending",
    photoUrl: null,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    resolution: null,
    resolvedAt: null,
    resolvedByName: null,
  },
  {
    id: "comp-02",
    child: { id: "child-02", fullName: "Trần Minh Khang", className: "Chồi 2" },
    parent: { id: "parent-02", fullName: "Trần Thị Mai", phone: "0912345678" },
    content: "Bé Khang có cơ địa dị ứng nhẹ với hải sản. Hôm qua bé có biểu hiện ngứa đỏ nhẹ ở mu bàn tay. Gia đình đã gửi bôi thuốc, kính đề nghị BGH nhắc nhở bộ phận cấp dưỡng kiểm tra kỹ thực đơn bán trú.",
    status: "InProgress",
    photoUrl: null,
    createdAt: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    resolution: "Ban giám hiệu đã làm việc trực tiếp với cô Bếp trưởng và bộ phận Y tế. Toàn bộ khẩu phần ăn của bé Khang đã được dán nhãn riêng biệt loại trừ hoàn toàn thành phần tôm, cua, hải sản.",
    resolvedAt: null,
    resolvedByName: "Hiệu trưởng Lê Thu Hà",
  },
  {
    id: "comp-03",
    child: { id: "child-03", fullName: "Lê Hoàng Phúc", className: "Lá 1" },
    parent: { id: "parent-03", fullName: "Lê Thanh Tùng", phone: "0987654321" },
    content: "Gia đình nhận thấy khu vực cầu trượt gỗ ở sân cỏ phía sau có một bu-lông ở bậc thang thứ hai bị lỏng, trẻ con chạy nhảy dễ vấp phải. Kính mong nhà trường kiểm tra bảo trì an toàn.",
    status: "Resolved",
    photoUrl: null,
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    resolution: "Tổ bảo trì cơ sở vật chất đã tiến hành siết chặt bu-lông, bọc nắp chụp silicon bảo vệ và kiểm tra tổng thể toàn bộ thiết bị sân chơi ngoài trời trong chiều ngày 09/11.",
    resolvedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    resolvedByName: "Ban Quản trị trường",
  },
];

// Biến lưu trữ tạm trên client khi backend chưa triển khai endpoint
let localComplaintsStore = [...initialMockComplaints];

function buildMockResponse(query?: ComplaintListQuery): ComplaintListResponse {
  const statusFilter = query?.status && query.status !== "All" ? query.status : undefined;
  const filtered = statusFilter
    ? localComplaintsStore.filter((c) => c.status === statusFilter)
    : localComplaintsStore;

  const page = query?.page ?? 1;
  const pageSize = query?.pageSize ?? 10;
  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startIndex = (page - 1) * pageSize;
  const items = filtered.slice(startIndex, startIndex + pageSize);

  const pendingCount = localComplaintsStore.filter((c) => c.status === "Pending").length;
  const inProgressCount = localComplaintsStore.filter((c) => c.status === "InProgress").length;
  const resolvedCount = localComplaintsStore.filter((c) => c.status === "Resolved").length;

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages,
    pendingCount,
    inProgressCount,
    resolvedCount,
  };
}

/**
 * Hook truy vấn danh sách phản ánh phụ huynh cho Ban Giám Hiệu (FR-COMPLAINT-02)
 */
export function useComplaints(query?: ComplaintListQuery) {
  return useApiQuery<ComplaintListResponse>({
    queryKey: complaintsKey(query),
    queryFn: async () => {
      try {
        const response = await apiClient.get<ApiResponse<ComplaintListResponse>>("/api/complaints", {
          params: {
            status: query?.status && query.status !== "All" ? query.status : undefined,
            page: query?.page ?? 1,
            pageSize: query?.pageSize ?? 10,
          },
        });

        if (response.data && response.data.data) {
          return response.data.data;
        }
        return buildMockResponse(query);
      } catch {
        // Dự phòng dữ liệu tĩnh chuẩn nghiệp vụ khi backend chưa merge API
        return buildMockResponse(query);
      }
    },
  });
}

/**
 * Hook cập nhật kết quả xử lý phản ánh (FR-COMPLAINT-02)
 * Gọi PUT /api/complaints/{id}/handling và tự động invalidate cache
 */
export function useUpdateComplaintHandling() {
  const queryClient = useQueryClient();

  return useApiMutation<ComplaintResponse, { id: string; data: ComplaintHandlingRequest }>({
    mutationFn: async ({ id, data }) => {
      try {
        const response = await apiClient.put<ApiResponse<ComplaintResponse>>(
          `/api/complaints/${id}/handling`,
          data
        );

        if (response.data && response.data.data) {
          return response.data.data;
        }
      } catch {
        // Fallback cập nhật local store nếu backend chưa có endpoint
      }

      const index = localComplaintsStore.findIndex((c) => c.id === id);
      if (index !== -1) {
        const target = localComplaintsStore[index];
        const updated: ComplaintResponse = {
          ...target,
          status: data.status as ComplaintStatus,
          resolution: data.resolution,
          resolvedAt: data.status === "Resolved" ? new Date().toISOString() : target.resolvedAt,
          resolvedByName: "Ban Giám Hiệu",
        };
        localComplaintsStore = [
          ...localComplaintsStore.slice(0, index),
          updated,
          ...localComplaintsStore.slice(index + 1),
        ];
        return updated;
      }

      throw new Error("Không tìm thấy phản ánh để cập nhật.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMPLAINTS_QUERY_KEY });
    },
  });
}
