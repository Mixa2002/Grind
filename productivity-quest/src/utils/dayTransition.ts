import { format } from 'date-fns';
import { storage } from './storage';
import { getPreviousEffectiveDate, shouldTemplateFireOnDate } from './date';
import {
  calcScheduledPenalty,
  calcFlexiblePenalty,
  calcHabitPenalty,
  calcScheduledTaskXP,
  getLevelFromXP,
  getXPForLevel,
} from './xp';
import type {
  DayData, DailyHabit, UserProfile, RecurringTemplate, ScheduledTask,
} from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DayTransitionSummary {
  date: string;
  xpLost: number;
  xpGained: number;       // from completed tasks (display only)
  completedCount: number;
  totalCount: number;
  brokenStreaks: { title: string; oldStreak: number }[];
  perfectDay: boolean;
}

// ─── Main export ─────────────────────────────────────────────────────────────

/**
 * Process every unprocessed past day (oldest first).
 * Also handles habits that missed days while the app was closed.
 */
export function processUnfinishedDays(
  profile: UserProfile,
  habits: DailyHabit[],
  currentEffectiveDate: string,
): { updatedProfile: UserProfile; updatedHabits: DailyHabit[]; summaries: DayTransitionSummary[] } {
  // Build list of unprocessed dates, oldest first
  const userStartDate = profile.createdAt.slice(0, 10);
  const datesToProcess: string[] = [];
  let checkDate = getPreviousEffectiveDate(currentEffectiveDate);

  for (let i = 0; i < 60; i++) {
    if (checkDate < userStartDate) break;
    const stored = storage.get<DayData>(`day_${checkDate}`);
    if (stored?.processed) break;           // found already-processed day → stop
    datesToProcess.unshift(checkDate);      // prepend so we get oldest first
    checkDate = getPreviousEffectiveDate(checkDate);
  }

  if (datesToProcess.length === 0) {
    return { updatedProfile: profile, updatedHabits: habits, summaries: [] };
  }

  let currentProfile: UserProfile = { ...profile };
  let currentHabits: DailyHabit[] = habits.map(h => ({ ...h, completionLog: { ...h.completionLog } }));
  const summaries: DayTransitionSummary[] = [];
  let runningConsecutivePerfect = profile.consecutivePerfectDays;

  for (const date of datesToProcess) {
    const { updatedProfile, updatedHabits, updatedDayData, summary } = processSingleDay(
      date, currentProfile, currentHabits,
    );

    // Consecutive perfect days must be threaded across days
    if (summary.perfectDay) {
      runningConsecutivePerfect++;
    } else {
      runningConsecutivePerfect = 0;
    }

    currentProfile = { ...updatedProfile, consecutivePerfectDays: runningConsecutivePerfect };
    currentHabits = updatedHabits;
    summaries.push(summary);

    storage.set(`day_${date}`, updatedDayData);
  }

  return { updatedProfile: currentProfile, updatedHabits: currentHabits, summaries };
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function processSingleDay(
  date: string,
  profile: UserProfile,
  habits: DailyHabit[],
): {
  updatedProfile: UserProfile;
  updatedHabits: DailyHabit[];
  updatedDayData: DayData;
  summary: DayTransitionSummary;
} {
  const storedDay = storage.get<DayData>(`day_${date}`);
  const dayData: DayData = storedDay ?? {
    date, scheduledTasks: [], flexibleTasks: [], processed: false, perfectDay: false,
  };

  let xpLost = 0;
  let xpGained = 0;
  let completedCount = 0;
  const brokenStreaks: { title: string; oldStreak: number }[] = [];

  // Deep-copy habits so we can mutate
  const updatedHabits = habits.map(h => ({ ...h, completionLog: { ...h.completionLog } }));

  // Scheduled tasks
  for (const task of dayData.scheduledTasks) {
    if (task.completed) {
      xpGained += task.xpValue;
      completedCount++;
    } else {
      xpLost += calcScheduledPenalty(task.xpValue);
    }
  }

  // Flexible tasks
  for (const task of dayData.flexibleTasks) {
    if (task.completed) {
      xpGained += task.xpValue;
      completedCount++;
    } else {
      xpLost += calcFlexiblePenalty(task.xpValue);
    }
  }

  // Habits
  for (let i = 0; i < updatedHabits.length; i++) {
    const habit = updatedHabits[i];
    const wasCompleted = habit.completionLog[date] === true;

    if (wasCompleted) {
      completedCount++;
      // Streak was already incremented by toggleHabit during the session — don't touch.
    } else {
      xpLost += calcHabitPenalty(habit.difficulty);
      const oldStreak = habit.currentStreak;
      if (oldStreak > 0) {
        brokenStreaks.push({ title: habit.title, oldStreak });
        updatedHabits[i] = {
          ...habit,
          longestStreak: Math.max(habit.longestStreak, oldStreak),
          currentStreak: 0,
        };
      }
    }
  }

  const totalCount =
    dayData.scheduledTasks.length + dayData.flexibleTasks.length + habits.length;

  const allScheduled = dayData.scheduledTasks.every(t => t.completed);
  const allFlexible  = dayData.flexibleTasks.every(t => t.completed);
  const allHabits    = habits.every(h => h.completionLog[date] === true);
  const perfectDay   = totalCount > 0 && allScheduled && allFlexible && allHabits;

  // Apply XP loss
  let updatedProfile: UserProfile = { ...profile, xpHistory: [...profile.xpHistory] };
  if (xpLost > 0) {
    const minXP = getXPForLevel(profile.level);
    updatedProfile.totalXP = Math.max(minXP, profile.totalXP - xpLost);
    updatedProfile.level = getLevelFromXP(updatedProfile.totalXP);

    const histIdx = updatedProfile.xpHistory.findIndex(h => h.date === date);
    if (histIdx >= 0) {
      updatedProfile.xpHistory[histIdx] = {
        ...updatedProfile.xpHistory[histIdx],
        lost: updatedProfile.xpHistory[histIdx].lost + xpLost,
      };
    } else {
      updatedProfile.xpHistory.push({ date, gained: xpGained, lost: xpLost });
    }
  }

  if (perfectDay) {
    updatedProfile.perfectDays = (profile.perfectDays ?? 0) + 1;
    // consecutivePerfectDays is handled by the outer loop
  }

  const updatedDayData: DayData = { ...dayData, processed: true, perfectDay };

  return {
    updatedProfile,
    updatedHabits,
    updatedDayData,
    summary: { date, xpLost, xpGained, completedCount, totalCount, brokenStreaks, perfectDay },
  };
}

// ─── New day setup ────────────────────────────────────────────────────────────

/**
 * Create a fresh DayData pre-populated with any recurring templates
 * that fire on the given date.
 */
export function generateNewDayData(
  effectiveDate: string,
  templates: RecurringTemplate[],
): DayData {
  const matching = templates.filter(t => t.active && shouldTemplateFireOnDate(t, effectiveDate));

  const scheduledTasks: ScheduledTask[] = matching.map(t => ({
    id: crypto.randomUUID(),
    title: t.title,
    date: effectiveDate,
    startTime: t.startTime,
    endTime: t.endTime,
    difficulty: t.difficulty,
    completed: false,
    xpValue: calcScheduledTaskXP(t.difficulty, t.startTime, t.endTime, false),
    category: t.category,
    color: t.color,
    recurringTemplateId: t.id,
    addedLate: false,
  }));

  return { date: effectiveDate, scheduledTasks, flexibleTasks: [], processed: false, perfectDay: false };
}

/** Summarise the previous effective date for display in the yesterday-review step. */
export function getPreviousDaySummary(
  effectiveDate: string,
  habits: DailyHabit[],
): DayTransitionSummary | null {
  const prevDate = getPreviousEffectiveDate(effectiveDate);
  const prevDay = storage.get<DayData>(`day_${prevDate}`);
  if (!prevDay) return null;

  let xpGained = 0, xpLost = 0, completedCount = 0;
  const brokenStreaks: { title: string; oldStreak: number }[] = [];

  for (const t of prevDay.scheduledTasks) {
    if (t.completed) { xpGained += t.xpValue; completedCount++; }
    else xpLost += calcScheduledPenalty(t.xpValue);
  }
  for (const t of prevDay.flexibleTasks) {
    if (t.completed) { xpGained += t.xpValue; completedCount++; }
    else xpLost += calcFlexiblePenalty(t.xpValue);
  }
  for (const h of habits) {
    if (h.completionLog[prevDate]) completedCount++;
    else if ((h.completionLog[prevDate] ?? false) === false) {
      // Include only if habit existed before that day
      const created = h.createdAt.slice(0, 10);
      if (created <= prevDate) {
        xpLost += calcHabitPenalty(h.difficulty);
      }
    }
  }

  const totalCount =
    prevDay.scheduledTasks.length + prevDay.flexibleTasks.length +
    habits.filter(h => h.createdAt.slice(0, 10) <= prevDate).length;

  return {
    date: prevDate,
    xpGained,
    xpLost,
    completedCount,
    totalCount,
    brokenStreaks,
    perfectDay: prevDay.perfectDay,
  };
}

// Re-export for formatting in the modal
export { format };
