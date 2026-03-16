import { format, subDays, addDays, differenceInMinutes, parse, getDay } from "date-fns";

// THE most important function in the app. Every date check goes through this.
export function getEffectiveDate(now: Date, resetHour: number): string {
  const h = now.getHours();
  if (h < resetHour) {
    return format(subDays(now, 1), "yyyy-MM-dd");
  }
  return format(now, "yyyy-MM-dd");
}

export function getPreviousEffectiveDate(effectiveDate: string): string {
  return format(subDays(new Date(effectiveDate + "T12:00:00"), 1), "yyyy-MM-dd");
}

export function getNextEffectiveDate(effectiveDate: string): string {
  return format(addDays(new Date(effectiveDate + "T12:00:00"), 1), "yyyy-MM-dd");
}

export function getDurationMinutes(startTime: string, endTime: string): number {
  const start = parse(startTime, "HH:mm", new Date());
  const end = parse(endTime, "HH:mm", new Date());
  return Math.max(0, differenceInMinutes(end, start));
}

export function getDayOfWeek(dateStr: string): number {
  return getDay(new Date(dateStr + "T12:00:00")); // 0=Sun
}

export function shouldTemplateFireOnDate(
  template: { recurrence: { type: string; daysOfWeek?: number[]; interval?: number; dayOfMonth?: number }; createdAt: string },
  dateStr: string
): boolean {
  const r = template.recurrence;
  if (r.type === "daily") return true;
  if (r.type === "weekly" && r.daysOfWeek) {
    return r.daysOfWeek.includes(getDayOfWeek(dateStr));
  }
  if (r.type === "monthly" && r.dayOfMonth) {
    const day = new Date(dateStr + "T12:00:00").getDate();
    return day === r.dayOfMonth;
  }
  if (r.type === "everyN" && r.interval) {
    const created = new Date(template.createdAt);
    const target = new Date(dateStr + "T12:00:00");
    const diffDays = Math.floor((target.getTime() - created.getTime()) / (86400000));
    return diffDays >= 0 && diffDays % r.interval === 0;
  }
  return false;
}

export function formatTime12h(time24: string): string {
  const [h, m] = time24.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}
