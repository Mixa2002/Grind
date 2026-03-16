export interface UserProfile {
  id: string;
  displayName: string;
  level: number;
  totalXP: number;
  dayResetHour: number; // 0-23, default 5
  createdAt: string;
  achievements: string[];
  xpHistory: { date: string; gained: number; lost: number }[];
  totalTasksCompleted: number;
  perfectDays: number;
  consecutivePerfectDays: number;
  earlyBirdCount: number;
  brutalTasksCompleted: number;
  lastPlannedDate: string; // effective date of last completed planning session
}

export interface ScheduledTask {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (effective date)
  startTime: string; // "HH:MM" 24h format
  endTime: string; // "HH:MM" 24h format
  difficulty: 1 | 2 | 3 | 4 | 5;
  completed: boolean;
  xpValue: number;
  category?: string;
  color?: string;
  recurringTemplateId?: string;
  addedLate?: boolean;
}

export interface FlexibleTask {
  id: string;
  title: string;
  date: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  completed: boolean;
  xpValue: number;
  addedLate?: boolean;
}

export interface DailyHabit {
  id: string;
  title: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  baseXP: number;
  currentStreak: number;
  longestStreak: number;
  completionLog: Record<string, boolean>; // "YYYY-MM-DD" -> true
  createdAt: string;
}

export interface RecurringTemplate {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  category?: string;
  color?: string;
  recurrence: {
    type: "weekly" | "daily" | "everyN" | "monthly";
    daysOfWeek?: number[]; // 0=Sun ... 6=Sat
    interval?: number;
    dayOfMonth?: number;
  };
  active: boolean;
  createdAt: string;
}

export interface DayData {
  date: string;
  scheduledTasks: ScheduledTask[];
  flexibleTasks: FlexibleTask[];
  processed: boolean; // true = day has been closed out, penalties applied
  perfectDay: boolean;
}

export type Difficulty = 1 | 2 | 3 | 4 | 5;
