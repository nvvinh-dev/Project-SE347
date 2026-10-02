export const APP_NAME = "Quản Lý Nhà Trẻ";

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  exact?: boolean;
}

export const accountantNav: NavItem[] = [
  { title: "Tổng quan", href: "/accountant", icon: "dashboard", exact: true },
  { title: "Hồ sơ trẻ", href: "/accountant/students", icon: "students" },
  { title: "Học phí & Hóa đơn", href: "/accountant/tuition", icon: "tuition" },
  { title: "Thực đơn tuần", href: "/accountant/menu", icon: "menu" },
  { title: "Thông báo nghỉ học", href: "/accountant/notifications", icon: "notifications" },
];

export const parentNav: NavItem[] = [
  { title: "Tổng quan", href: "/parent", icon: "home", exact: true },
  { title: "Điểm danh", href: "/parent/attendance", icon: "attendance" },
  { title: "Sức khỏe & Sự cố", href: "/parent/health", icon: "health" },
  { title: "Người đón trẻ", href: "/parent/pickups", icon: "pickups" },
  { title: "Thực đơn tuần", href: "/parent/menu", icon: "menu" },
  { title: "Ảnh hoạt động", href: "/parent/photos", icon: "photos" },
  { title: "Hóa đơn học phí", href: "/parent/tuition", icon: "tuition" },
  { title: "Thông báo", href: "/parent/notifications", icon: "notifications" },
];

export const adminNav: NavItem[] = [
  { title: "Tổng quan", href: "/admin/dashboard", icon: "dashboard", exact: true },
  { title: "Quản lý tài khoản", href: "/admin/users", icon: "teachers" },
  { title: "Xếp lớp & Phân công", href: "/admin/classes", icon: "students" },
];

export const teacherNav: NavItem[] = [
  { title: "Điểm danh vào lớp", href: "/teacher/attendance", icon: "attendance", exact: true },
  { title: "Lịch sử điểm danh", href: "/teacher/attendance-history", icon: "history" },
  { title: "Đón trẻ buổi chiều", href: "/teacher/pickup", icon: "pickups" },
  { title: "Lưu ý sức khỏe lớp", href: "/teacher/class-children", icon: "students" },
  { title: "Sức khỏe & Sự cố", href: "/teacher/incidents", icon: "health" },
  { title: "Ảnh hoạt động lớp", href: "/teacher/media", icon: "photos" },
];

export const medicalNav: NavItem[] = [
  { title: "Theo dõi thể chất", href: "/medical/health", icon: "health", exact: true },
  { title: "Sổ lưu ý & Dị ứng", href: "/medical/health-notes", icon: "notes" },
  { title: "Hồ sơ sức khỏe & Sự cố", href: "/medical/health-history", icon: "history" },
  { title: "Thông báo", href: "/medical/notifications", icon: "notifications" },
];