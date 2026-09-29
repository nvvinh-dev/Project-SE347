export interface NavItem {
  title: string;
  href: string;
  icon: string;
}

export const accountantNav: NavItem[] = [
  { title: "Tổng quan", href: "/accountant", icon: "dashboard" },
  { title: "Hồ sơ trẻ", href: "/accountant/students", icon: "students" },
  { title: "Học phí & Hóa đơn", href: "/accountant/tuition", icon: "tuition" },
  { title: "Thực đơn tuần", href: "/accountant/menu", icon: "menu" },
  { title: "Thông báo nghỉ học", href: "/accountant/notifications", icon: "notifications" },
];

export const parentNav: NavItem[] = [
  { title: "Tổng quan", href: "/parent", icon: "home" },
  { title: "Điểm danh", href: "/parent/attendance", icon: "attendance" },
  { title: "Sức khỏe & Sự cố", href: "/parent/health", icon: "health" },
  { title: "Người đón trẻ", href: "/parent/pickups", icon: "pickups" },
  { title: "Thực đơn tuần", href: "/parent/menu", icon: "menu" },
  { title: "Ảnh hoạt động", href: "/parent/photos", icon: "photos" },
  { title: "Hóa đơn học phí", href: "/parent/tuition", icon: "tuition" },
  { title: "Thông báo", href: "/parent/notifications", icon: "notifications" },
];