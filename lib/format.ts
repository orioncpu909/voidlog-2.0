import { dateKey, sessionStart } from "./schedule";

export function money(n: number): string {
  return `$${n % 1 === 0 ? n : n.toFixed(2)}`;
}

export function timeLabel(time: string): string {
  return sessionStart("2000-01-01", time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function timeRange(time: string, durationMin: number): string {
  const end = new Date(sessionStart("2000-01-01", time).getTime() + durationMin * 60000);
  return `${timeLabel(time)} – ${end.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

export function dayLabel(date: string, style: "short" | "long" = "short"): string {
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (date === dateKey(today)) return "Today";
  if (date === dateKey(tomorrow)) return "Tomorrow";
  const d = sessionStart(date, "12:00");
  return d.toLocaleDateString("en-US", style === "long" ? { weekday: "long", month: "long", day: "numeric" } : { weekday: "short", month: "short", day: "numeric" });
}

// "Today at 4:30 PM", "Tomorrow at 7:00 AM", "Wed, Oct 28 at 9:00 AM"
export function momentLabel(d: Date): string {
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const day = dayLabel(dateKey(d));
  return `${day === "Today" || day === "Tomorrow" ? day.toLowerCase() : day} at ${time}`;
}

export function hoursUntil(date: Date, now = new Date()): number {
  return (date.getTime() - now.getTime()) / 36e5;
}

export function shortDate(date: string): string {
  return sessionStart(date, "12:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
