/**
 * Tiện ích tính toán độ tuổi và quy tắc nhóm tuổi lớp học (BR-CLASS-03, D39 mục 3)
 * Logic tính toán tháng tuổi tròn đồng nhất với ClassAgeRules.cs ở backend (theo múi giờ Asia/Ho_Chi_Minh).
 */

/**
 * Tính số tháng tuổi tròn của trẻ từ ngày sinh đến ngày hiện tại theo giờ Việt Nam.
 * Trẻ đủ thêm một tháng vào ngày trùng ngày sinh trong tháng; với tháng không có ngày đó
 * (ví dụ sinh ngày 31, sinh 29/2), tính đủ tháng vào ngày cuối cùng của tháng (chuẩn AddMonths của .NET).
 */
export function calculateAgeInMonths(birthDateStr: string, referenceDate: Date = new Date()): number {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  if (isNaN(birthDate.getTime())) return 0;

  // Lấy năm, tháng, ngày của ngày tham chiếu theo múi giờ Việt Nam
  const vnFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });

  const nowParts = vnFormatter.formatToParts(referenceDate);
  const nowYear = parseInt(nowParts.find((p) => p.type === "year")?.value || "0", 10);
  const nowMonth = parseInt(nowParts.find((p) => p.type === "month")?.value || "0", 10);
  const nowDay = parseInt(nowParts.find((p) => p.type === "day")?.value || "0", 10);

  const birthParts = vnFormatter.formatToParts(birthDate);
  const bYear = parseInt(birthParts.find((p) => p.type === "year")?.value || "0", 10);
  const bMonth = parseInt(birthParts.find((p) => p.type === "month")?.value || "0", 10);
  const bDay = parseInt(birthParts.find((p) => p.type === "day")?.value || "0", 10);

  let months = (nowYear - bYear) * 12 + (nowMonth - bMonth);

  // Tính ngày tương ứng khi cộng `months` vào ngày sinh theo quy tắc DateTime.AddMonths của .NET
  // (nếu tháng đích có số ngày ít hơn bDay thì lấy ngày cuối cùng của tháng đó)
  const totalMonths = (bYear * 12 + (bMonth - 1)) + months;
  const targetYear = Math.floor(totalMonths / 12);
  const targetMonth = (totalMonths % 12) + 1;
  const daysInTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(bDay, daysInTargetMonth);

  const isTargetAfterNow =
    targetYear > nowYear ||
    (targetYear === nowYear && targetMonth > nowMonth) ||
    (targetYear === nowYear && targetMonth === nowMonth && targetDay > nowDay);

  if (isTargetAfterNow) {
    months--;
  }

  return Math.max(0, months);
}

/**
 * Kiểm tra xem số tháng tuổi có khớp với khoảng tuổi nửa mở [min, max) của lớp học hay không.
 * Trẻ đúng 48 tháng vào Lớp Chồi (không vào Lớp Mầm); đúng 60 tháng vào Lớp Lá (không vào Lớp Chồi).
 */
export function fitsAgeRange(
  ageInMonths: number,
  minAgeMonths: number | null,
  maxAgeMonths: number | null
): boolean {
  if (minAgeMonths === null || maxAgeMonths === null) return false;
  return ageInMonths >= minAgeMonths && ageInMonths < maxAgeMonths;
}

/**
 * Định dạng chuỗi ngày tháng từ YYYY-MM-DD sang DD/MM/YYYY
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-");
  if (year && month && day) {
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
  }
  return dateStr;
}

export interface GradeLevelTheme {
  key: "mam" | "choi" | "la";
  icon: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentBg: string;
  borderHover: string;
  sectionBg: string;
  sectionBorder: string;
  tooltipText: string;
}

/**
 * Lấy bộ màu và biểu tượng thống nhất cho 3 khối lớp cố định (Mầm / Chồi / Lá)
 */
export function getGradeLevelTheme(params: {
  gradeLevelId?: number | null;
  minAgeMonths?: number | null;
  maxAgeMonths?: number | null;
  name?: string | null;
}): GradeLevelTheme {
  const { gradeLevelId, minAgeMonths, maxAgeMonths, name } = params;
  const isMam =
    gradeLevelId === 1 || minAgeMonths === 36 || Boolean(name?.includes("Mầm"));
  const isChoi =
    !isMam &&
    (gradeLevelId === 2 || minAgeMonths === 48 || Boolean(name?.includes("Chồi")));

  if (isMam) {
    return {
      key: "mam",
      icon: "🌱",
      dotColor: "bg-[#55B38F]",
      badgeBg: "bg-[#E8F8F1]",
      badgeText: "text-[#1A624C]",
      badgeBorder: "border-[#A7E5D2]/60",
      accentBg: "bg-[#55B38F]",
      borderHover: "hover:border-[#55B38F]/50",
      sectionBg: "bg-[#E8F8F1]/45",
      sectionBorder: "border-[#A7E5D2]/60",
      tooltipText: `Bao gồm trẻ từ đủ ${minAgeMonths ?? 36} tháng đến dưới ${maxAgeMonths ?? 48} tháng tuổi. Tròn ${maxAgeMonths ?? 48} tháng thuộc Khối Chồi.`,
    };
  }

  if (isChoi) {
    return {
      key: "choi",
      icon: "🌿",
      dotColor: "bg-[#71C8E4]",
      badgeBg: "bg-[#EAF7FC]",
      badgeText: "text-[#17627D]",
      badgeBorder: "border-[#D5E3F2]",
      accentBg: "bg-[#71C8E4]",
      borderHover: "hover:border-[#71C8E4]/50",
      sectionBg: "bg-[#EAF7FC]/55",
      sectionBorder: "border-[#D5E3F2]",
      tooltipText: `Bao gồm trẻ từ đủ ${minAgeMonths ?? 48} tháng đến dưới ${maxAgeMonths ?? 60} tháng tuổi. Tròn ${maxAgeMonths ?? 60} tháng thuộc Khối Lá.`,
    };
  }

  return {
    key: "la",
    icon: "🍃",
    dotColor: "bg-[#E8916E]",
    badgeBg: "bg-[#FBE8E2]",
    badgeText: "text-[#8A4F42]",
    badgeBorder: "border-[#FAC4CD]/60",
    accentBg: "bg-[#E8916E]",
    borderHover: "hover:border-[#E8916E]/50",
    sectionBg: "bg-[#FBE8E2]/45",
    sectionBorder: "border-[#FAC4CD]/60",
    tooltipText: `Bao gồm trẻ từ đủ ${minAgeMonths ?? 60} tháng đến dưới ${maxAgeMonths ?? 72} tháng tuổi. Trẻ đủ ${maxAgeMonths ?? 72} tháng thuộc diện ra trường.`,
  };
}

/**
 * Định dạng tuổi hiển thị thân thiện cho người dùng
 * Ví dụ: "41 tháng (3 tuổi 5 tháng)"
 */
export function formatAgeFriendly(months: number): string {
  if (months <= 0) return "0 tháng";
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${months} tháng`;
  if (rem === 0) return `${months} tháng (${years} tuổi)`;
  return `${months} tháng (${years} tuổi ${rem} tháng)`;
}
