export interface IncidentNotificationFields {
  childName: string;
  occurredAtLabel: string;
  description: string;
}

export function notificationPlainText(message: string): string {
  const entities: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
  return message
    .replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (entity, value: string) => {
      if (!value.startsWith("#")) return entities[value.toLowerCase()] ?? entity;
      const code = value[1].toLowerCase() === "x" ? parseInt(value.slice(2), 16) : Number(value.slice(1));
      return code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : "";
    })
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<br\s*\/?\s*>|<\/(?:p|div|li|h[1-6])\s*>/gi, "\n")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .trim();
}

// Chỉ tách cách trình bày theo câu do máy chủ tạo; không suy ra định danh trẻ hay sự cố.
export function formatIncidentNotification(message: string): IncidentNotificationFields | null {
  const match = /^Giáo viên vừa ghi nhận sự cố của bé ([^\r\n]+), xảy ra lúc (\d{2}):(\d{2}) ngày (\d{2})\/(\d{2})\/(\d{4})\. Mô tả: ([\s\S]+)$/.exec(notificationPlainText(message));
  if (!match) return null;
  const [, childName, hour, minute, day, month, year, description] = match;
  if (!childName.trim() || childName.includes(", xảy ra lúc ") || !description.trim()) return null;
  const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00+07:00`);
  if (Number.isNaN(date.getTime())) return null;
  const calendar = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (calendar.getUTCFullYear() !== Number(year) || calendar.getUTCMonth() !== Number(month) - 1 || calendar.getUTCDate() !== Number(day) || Number(hour) > 23 || Number(minute) > 59) return null;
  return { childName, occurredAtLabel: `${hour}:${minute} · ${day}/${month}/${year}`, description };
}
