import type { Task, Habit } from '../types';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function getTodayISO(): string {
  return formatDateISO(new Date());
}

export function getWeekDayName(date: Date): string {
  return DAY_NAMES[date.getDay()];
}

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
}

export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTasksForDate(tasks: Task[], date: Date): Task[] {
  const iso = formatDateISO(date);
  const dayName = getWeekDayName(date);

  return tasks.filter((task) => {
    if (task.repeatable) {
      return task.repeatDays.includes(dayName);
    }
    return task.date === iso;
  });
}

export function getHabitStreak(habit: Habit): number {
  const today = new Date();
  const todayISO = formatDateISO(today);

  // Start from today if completed, otherwise start from yesterday
  const startFromToday = habit.completions[todayISO] === true;
  let streak = 0;
  const cursor = new Date(today);

  if (!startFromToday) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (true) {
    const iso = formatDateISO(cursor);
    if (habit.completions[iso] !== true) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getHabitDayPercentage(habits: Habit[], date: string): number {
  if (habits.length === 0) return 0;
  const completed = habits.filter((h) => h.completions[date] === true).length;
  return Math.round((completed / habits.length) * 100);
}

export function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function getCurrentMonthDates(): { date: Date; isCurrentMonth: boolean }[] {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();

  const firstOfMonth = new Date(year, month, 1);
  const lastOfMonth = new Date(year, month + 1, 0);

  // Find the Monday on or before the first of the month
  const startDay = firstOfMonth.getDay();
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - ((startDay + 6) % 7));

  // Find the Sunday on or after the last of the month
  const endDay = lastOfMonth.getDay();
  const gridEnd = new Date(lastOfMonth);
  if (endDay !== 0) {
    gridEnd.setDate(lastOfMonth.getDate() + (7 - endDay));
  }

  const result: { date: Date; isCurrentMonth: boolean }[] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    result.push({
      date: new Date(cursor),
      isCurrentMonth: cursor.getMonth() === month,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return result;
}
