export interface IncidentNotificationFields {
  childName: string;
  occurredAtLabel: string;
  description: string;
}

// Chỉ tách cách trình bày theo câu do máy chủ tạo; không suy ra định danh trẻ hay sự cố.
export function formatIncidentNotification(message: string): IncidentNotificationFields | null {
  const match = /^Giáo viên vừa ghi nhận sự cố của bé ([^\r\n]+), xảy ra lúc (\d{2}):(\d{2}) ngày (\d{2})\/(\d{2})\/(\d{4})\. Mô tả: ([\s\S]+)$/.exec(message);
  if (!match) return null;
  const [, childName, hour, minute, day, month, year, description] = match;
  if (!childName.trim() || childName.includes(", xảy ra lúc ") || !description.trim()) return null;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00+07:00`);
  if (Number.isNaN(date.getTime())) return null;
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (calendar.getUTCFullYear() !== Number(year) || calendar.getUTCMonth() !== Number(month) - 1 || calendar.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59) return null;
  return { childName, occurredAtLabel: `${hour}:${minute} - ${day}/${month}/${year}`, description };
}
