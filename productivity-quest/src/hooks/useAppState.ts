import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { storage } from '../utils/storage';
import { getEffectiveDate, getPreviousEffectiveDate, shouldTemplateFireOnDate } from '../utils/date';
import {
  getLevelFromXP, getXPForLevel, getLevelTitle,
  calcScheduledTaskXP, calcFlexibleTaskXP, calcHabitXP,
  BONUSES, getBaseXP,
} from '../utils/xp';
import { checkNewAchievements, type Achievement } from '../utils/achievements';
import {
  processUnfinishedDays,
  generateNewDayData,
  type DayTransitionSummary,
} from '../utils/dayTransition';
import type {
  UserProfile, DayData, DailyHabit, ScheduledTask, FlexibleTask,
  Difficulty, RecurringTemplate,
} from '../types';

// ─── Public types ─────────────────────────────────────────────────────────────

export type { DayTransitionSummary };

export interface XPFloatItem {
  id: string;
  amount: number;
  x: number;
  y: number;
}

export interface LevelUpInfo {
  level: number;
  title: string;
}

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function createDefaultProfile(): UserProfile {
  return {
    id: crypto.randomUUID(),
    displayName: 'Hero',
    level: 0,
    totalXP: 0,
    dayResetHour: 5,
    createdAt: new Date().toISOString(),
    achievements: [],
    xpHistory: [],
    totalTasksCompleted: 0,
    perfectDays: 0,
    consecutivePerfectDays: 0,
    earlyBirdCount: 0,
    brutalTasksCompleted: 0,
    lastPlannedDate: '',
  };
}

/** One-time synchronous bootstrap — runs inside useState() initializer. */
function bootstrapAppState() {
  const storedProfile = storage.get<UserProfile>('profile') ?? createDefaultProfile();
  const storedHabits  = storage.get<DailyHabit[]>('habits') ?? [];
  const effectiveDate = getEffectiveDate(new Date(), storedProfile.dayResetHour);

  // Process any unfinished past days
  const { updatedProfile, updatedHabits, summaries } = processUnfinishedDays(
    storedProfile, storedHabits, effectiveDate,
  );

  // Persist processed results immediately so they survive a refresh mid-modal
  if (summaries.length > 0) {
    storage.set('profile', updatedProfile);
    storage.set('habits', updatedHabits);
  }

  // Get or generate today's DayData
  const existingDay  = storage.get<DayData>(`day_${effectiveDate}`);
  const templates    = storage.get<RecurringTemplate[]>('templates') ?? [];
  const dayData      = existingDay ?? generateNewDayData(effectiveDate, templates);
  if (!existingDay) storage.set(`day_${effectiveDate}`, dayData);

  const needsPlanning = updatedProfile.lastPlannedDate !== effectiveDate;

  return { profile: updatedProfile, habits: updatedHabits, dayData, summaries, needsPlanning, effectiveDate };
}

function applyXPGain(
  profile: UserProfile,
  habits: DailyHabit[],
  xpAmount: number,
  difficulty?: Difficulty,
): { newProfile: UserProfile; didLevelUp: boolean; achievementXP: number; newAchievements: Achievement[] } {
  const today = format(new Date(), 'yyyy-MM-dd');
  const updated: UserProfile = { ...profile, xpHistory: [...profile.xpHistory] };

  updated.totalXP = profile.totalXP + xpAmount;

  const histIdx = updated.xpHistory.findIndex(h => h.date === today);
  if (histIdx >= 0) {
    updated.xpHistory[histIdx] = {
      ...updated.xpHistory[histIdx],
      gained: updated.xpHistory[histIdx].gained + xpAmount,
    };
  } else {
    updated.xpHistory.push({ date: today, gained: xpAmount, lost: 0 });
  }

  const prevLevel = profile.level;
  updated.level = getLevelFromXP(updated.totalXP);
  updated.totalTasksCompleted = profile.totalTasksCompleted + 1;
  if (difficulty === 5) updated.brutalTasksCompleted = (profile.brutalTasksCompleted ?? 0) + 1;

  const newAchievs = checkNewAchievements(updated, habits);
  let achievementXP = 0;
  if (newAchievs.length > 0) {
    updated.achievements = [...updated.achievements, ...newAchievs.map(a => a.id)];
    achievementXP = newAchievs.reduce((sum, a) => sum + a.xpReward, 0);
    if (achievementXP > 0) {
      updated.totalXP += achievementXP;
      updated.level = getLevelFromXP(updated.totalXP);
    }
  }

  return { newProfile: updated, didLevelUp: updated.level > prevLevel, achievementXP, newAchievements: newAchievs };
}

function applyXPLoss(profile: UserProfile, xpAmount: number): UserProfile {
  const today = format(new Date(), 'yyyy-MM-dd');
  const updated: UserProfile = { ...profile, xpHistory: [...profile.xpHistory] };
  const minXP = getXPForLevel(profile.level);
  updated.totalXP = Math.max(minXP, profile.totalXP - xpAmount);
  updated.totalTasksCompleted = Math.max(0, profile.totalTasksCompleted - 1);
  const histIdx = updated.xpHistory.findIndex(h => h.date === today);
  if (histIdx >= 0) {
    updated.xpHistory[histIdx] = {
      ...updated.xpHistory[histIdx],
      gained: Math.max(0, updated.xpHistory[histIdx].gained - xpAmount),
    };
  }
  return updated;
}

function checkIsPerfectDay(dayData: DayData, habits: DailyHabit[], effectiveDate: string): boolean {
  const hasItems =
    dayData.scheduledTasks.length > 0 ||
    dayData.flexibleTasks.length > 0 ||
    habits.length > 0;
  if (!hasItems) return false;
  return (
    dayData.scheduledTasks.every(t => t.completed) &&
    dayData.flexibleTasks.every(t => t.completed) &&
    habits.every(h => h.completionLog[effectiveDate] === true)
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAppState() {
  // Single synchronous bootstrap — runs only once per mount
  const [boot] = useState(bootstrapAppState);

  const [profile,               setProfile]               = useState<UserProfile>(boot.profile);
  const [habits,                setHabits]                = useState<DailyHabit[]>(boot.habits);
  const [dayData,               setDayData]               = useState<DayData>(boot.dayData);
  const [showPlanningModal,     setShowPlanningModal]     = useState<boolean>(boot.needsPlanning);
  const [transitionSummaries,   setTransitionSummaries]   = useState<DayTransitionSummary[]>(boot.summaries);
  const [xpFloats,              setXPFloats]              = useState<XPFloatItem[]>([]);
  const [levelUpInfo,           setLevelUpInfo]           = useState<LevelUpInfo | null>(null);
  const [perfectDayCelebration, setPerfectDayCelebration] = useState(false);
  const [achievementQueue,      setAchievementQueue]      = useState<Achievement[]>([]);

  // effectiveDate is derived from current profile (changes if user changes reset hour)
  const effectiveDate = getEffectiveDate(new Date(), profile.dayResetHour);

  // ── Persistence ───────────────────────────────────────────────────────────
  useEffect(() => { storage.set('profile', profile); }, [profile]);
  useEffect(() => { storage.set('habits',  habits);  }, [habits]);
  useEffect(() => { storage.set(`day_${dayData.date}`, dayData); }, [dayData]);

  // ── Stale-closure ref for the 60-second interval ──────────────────────────
  const liveRef = useRef({ profile, habits, dayData });
  useEffect(() => { liveRef.current = { profile, habits, dayData }; });

  useEffect(() => {
    const id = setInterval(() => {
      const { profile: p, habits: h, dayData: d } = liveRef.current;
      const newDate = getEffectiveDate(new Date(), p.dayResetHour);
      if (newDate === d.date) return;                // no date change yet

      const { updatedProfile, updatedHabits, summaries } = processUnfinishedDays(p, h, newDate);
      storage.set('profile', updatedProfile);
      storage.set('habits',  updatedHabits);

      const templates  = storage.get<RecurringTemplate[]>('templates') ?? [];
      const existing   = storage.get<DayData>(`day_${newDate}`);
      const newDayData = existing ?? generateNewDayData(newDate, templates);
      if (!existing) storage.set(`day_${newDate}`, newDayData);

      setProfile(updatedProfile);
      setHabits(updatedHabits);
      setDayData(newDayData);
      setTransitionSummaries(summaries);
      if (updatedProfile.lastPlannedDate !== newDate) setShowPlanningModal(true);
    }, 60_000);
    return () => clearInterval(id);
  }, []); // set up once; uses ref for live values

  // ── Animation helpers ─────────────────────────────────────────────────────
  const spawnXPFloat = useCallback((
    amount: number,
    x = window.innerWidth * 0.65,
    y = window.innerHeight * 0.35,
  ) => {
    const id = crypto.randomUUID();
    setXPFloats(prev => [...prev, { id, amount, x, y }]);
    setTimeout(() => setXPFloats(prev => prev.filter(f => f.id !== id)), 1800);
  }, []);

  const triggerLevelUp = useCallback((level: number) => {
    setTimeout(() => {
      setLevelUpInfo({ level, title: getLevelTitle(level) });
      setTimeout(() => setLevelUpInfo(null), 3200);
    }, 600);
  }, []);

  // ── Perfect day handler ───────────────────────────────────────────────────
  const handlePerfectDay = useCallback((newProfile: UserProfile): UserProfile => {
    const prevDate = getPreviousEffectiveDate(effectiveDate);
    const prevDay  = storage.get<DayData>(`day_${prevDate}`);
    const wasPrevPerfect = prevDay?.perfectDay ?? false;

    const updated: UserProfile = { ...newProfile };
    updated.totalXP += BONUSES.PERFECT_DAY;
    updated.level = getLevelFromXP(updated.totalXP);
    updated.perfectDays = (newProfile.perfectDays ?? 0) + 1;
    updated.consecutivePerfectDays = wasPrevPerfect
      ? (newProfile.consecutivePerfectDays ?? 0) + 1
      : 1;

    setPerfectDayCelebration(true);
    setTimeout(() => setPerfectDayCelebration(false), 3500);
    spawnXPFloat(BONUSES.PERFECT_DAY);
    return updated;
  }, [effectiveDate, spawnXPFloat]);

  // ── Lock-in planning ──────────────────────────────────────────────────────
  const lockInPlan = useCallback((plannedDayData: DayData) => {
    storage.set(`day_${plannedDayData.date}`, plannedDayData);
    setDayData(plannedDayData);
    setProfile(prev => {
      const updated = { ...prev, lastPlannedDate: plannedDayData.date };
      storage.set('profile', updated);
      return updated;
    });
    setShowPlanningModal(false);
  }, []);

  // ── Scheduled tasks ───────────────────────────────────────────────────────
  const addScheduledTask = useCallback((
    data: Pick<ScheduledTask, 'title' | 'startTime' | 'endTime' | 'difficulty' | 'category' | 'color'>,
  ) => {
    const addedLate = profile.lastPlannedDate === effectiveDate;
    const xpValue = calcScheduledTaskXP(data.difficulty, data.startTime, data.endTime, addedLate);
    const newTask: ScheduledTask = {
      id: crypto.randomUUID(), date: effectiveDate, completed: false, xpValue, addedLate, ...data,
    };
    setDayData(prev => ({ ...prev, scheduledTasks: [...prev.scheduledTasks, newTask] }));
  }, [profile.lastPlannedDate, effectiveDate]);

  const toggleScheduledTask = useCallback((taskId: string, pos?: { x: number; y: number }) => {
    const task = dayData.scheduledTasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.completed) {
      const newScheduled = dayData.scheduledTasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
      const newDayData   = { ...dayData, scheduledTasks: newScheduled };
      const { newProfile, didLevelUp, achievementXP, newAchievements } = applyXPGain(profile, habits, task.xpValue, task.difficulty as Difficulty);
      let finalProfile = newProfile;
      let finalDayData = newDayData;
      if (checkIsPerfectDay(newDayData, habits, effectiveDate) && !dayData.perfectDay) {
        finalDayData = { ...newDayData, perfectDay: true };
        finalProfile = handlePerfectDay(newProfile);
      }
      setProfile(finalProfile);
      setDayData(finalDayData);
      spawnXPFloat(task.xpValue + achievementXP, pos?.x, pos?.y);
      if (didLevelUp) triggerLevelUp(finalProfile.level);
      if (newAchievements.length > 0) {
        setAchievementQueue(prev => [...prev, ...newAchievements]);
        setTimeout(() => setAchievementQueue(prev => prev.filter(a => !newAchievements.some((n: Achievement) => n.id === a.id))), 4000);
      }
    } else {
      const newScheduled = dayData.scheduledTasks.map(t => t.id === taskId ? { ...t, completed: false } : t);
      setProfile(applyXPLoss(profile, task.xpValue));
      setDayData(prev => ({ ...prev, scheduledTasks: newScheduled, perfectDay: false }));
      spawnXPFloat(-task.xpValue, pos?.x, pos?.y);
    }
  }, [profile, habits, dayData, effectiveDate, spawnXPFloat, triggerLevelUp, handlePerfectDay]);

  const deleteScheduledTask = useCallback((taskId: string) => {
    setDayData(prev => ({ ...prev, scheduledTasks: prev.scheduledTasks.filter(t => t.id !== taskId) }));
  }, []);

  // ── Flexible tasks ────────────────────────────────────────────────────────
  const addFlexibleTask = useCallback((data: Pick<FlexibleTask, 'title' | 'difficulty'>) => {
    const addedLate = profile.lastPlannedDate === effectiveDate;
    const xpValue   = calcFlexibleTaskXP(data.difficulty, addedLate);
    const newTask: FlexibleTask = {
      id: crypto.randomUUID(), date: effectiveDate, completed: false, xpValue, addedLate, ...data,
    };
    setDayData(prev => ({ ...prev, flexibleTasks: [...prev.flexibleTasks, newTask] }));
  }, [profile.lastPlannedDate, effectiveDate]);

  const toggleFlexibleTask = useCallback((taskId: string, pos?: { x: number; y: number }) => {
    const task = dayData.flexibleTasks.find(t => t.id === taskId);
    if (!task) return;
    if (!task.completed) {
      const newFlexible = dayData.flexibleTasks.map(t => t.id === taskId ? { ...t, completed: true } : t);
      const newDayData  = { ...dayData, flexibleTasks: newFlexible };
      const { newProfile, didLevelUp, achievementXP, newAchievements } = applyXPGain(profile, habits, task.xpValue, task.difficulty as Difficulty);
      let finalProfile = newProfile;
      let finalDayData = newDayData;
      if (checkIsPerfectDay(newDayData, habits, effectiveDate) && !dayData.perfectDay) {
        finalDayData = { ...newDayData, perfectDay: true };
        finalProfile = handlePerfectDay(newProfile);
      }
      setProfile(finalProfile);
      setDayData(finalDayData);
      spawnXPFloat(task.xpValue + achievementXP, pos?.x, pos?.y);
      if (didLevelUp) triggerLevelUp(finalProfile.level);
      if (newAchievements.length > 0) {
        setAchievementQueue(prev => [...prev, ...newAchievements]);
        setTimeout(() => setAchievementQueue(prev => prev.filter(a => !newAchievements.some((n: Achievement) => n.id === a.id))), 4000);
      }
    } else {
      const newFlexible = dayData.flexibleTasks.map(t => t.id === taskId ? { ...t, completed: false } : t);
      setProfile(applyXPLoss(profile, task.xpValue));
      setDayData(prev => ({ ...prev, flexibleTasks: newFlexible, perfectDay: false }));
      spawnXPFloat(-task.xpValue, pos?.x, pos?.y);
    }
  }, [profile, habits, dayData, effectiveDate, spawnXPFloat, triggerLevelUp, handlePerfectDay]);

  const deleteFlexibleTask = useCallback((taskId: string) => {
    setDayData(prev => ({ ...prev, flexibleTasks: prev.flexibleTasks.filter(t => t.id !== taskId) }));
  }, []);

  // ── Habits ────────────────────────────────────────────────────────────────
  const addHabit = useCallback((data: Pick<DailyHabit, 'title' | 'difficulty'>) => {
    const newHabit: DailyHabit = {
      id: crypto.randomUUID(),
      title: data.title,
      difficulty: data.difficulty,
      baseXP: getBaseXP(data.difficulty),
      currentStreak: 0,
      longestStreak: 0,
      completionLog: {},
      createdAt: new Date().toISOString(),
    };
    setHabits(prev => [...prev, newHabit]);
  }, []);

  const toggleHabit = useCallback((habitId: string, pos?: { x: number; y: number }) => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;
    const isCompleted = habit.completionLog[effectiveDate] === true;

    if (!isCompleted) {
      const xp         = calcHabitXP(habit.difficulty, habit.currentStreak);
      const newStreak  = habit.currentStreak + 1;
      let milestoneBonus = 0;
      if (newStreak === 7)   milestoneBonus += BONUSES.STREAK_7;
      if (newStreak === 30)  milestoneBonus += BONUSES.STREAK_30;
      if (newStreak === 100) milestoneBonus += BONUSES.STREAK_100;
      if (newStreak === 365) milestoneBonus += BONUSES.STREAK_365;
      const totalXP = xp + milestoneBonus;

      const updatedHabit: DailyHabit = {
        ...habit, currentStreak: newStreak,
        longestStreak: Math.max(habit.longestStreak, newStreak),
        completionLog: { ...habit.completionLog, [effectiveDate]: true },
      };
      const newHabits = habits.map(h => h.id === habitId ? updatedHabit : h);
      const { newProfile, didLevelUp, achievementXP, newAchievements } = applyXPGain(profile, newHabits, totalXP, habit.difficulty as Difficulty);

      let finalProfile = newProfile;
      let finalDayData = dayData;
      if (checkIsPerfectDay(dayData, newHabits, effectiveDate) && !dayData.perfectDay) {
        finalDayData = { ...dayData, perfectDay: true };
        finalProfile = handlePerfectDay(newProfile);
      }
      setHabits(newHabits);
      setProfile(finalProfile);
      setDayData(finalDayData);
      spawnXPFloat(totalXP + achievementXP, pos?.x, pos?.y);
      if (didLevelUp) triggerLevelUp(finalProfile.level);
      if (newAchievements.length > 0) {
        setAchievementQueue(prev => [...prev, ...newAchievements]);
        setTimeout(() => setAchievementQueue(prev => prev.filter(a => !newAchievements.some((n: Achievement) => n.id === a.id))), 4000);
      }
    } else {
      const xp = calcHabitXP(habit.difficulty, habit.currentStreak - 1);
      const updatedHabit: DailyHabit = {
        ...habit,
        currentStreak: Math.max(0, habit.currentStreak - 1),
        completionLog: { ...habit.completionLog, [effectiveDate]: false },
      };
      setHabits(habits.map(h => h.id === habitId ? updatedHabit : h));
      setProfile(applyXPLoss(profile, xp));
      setDayData(prev => ({ ...prev, perfectDay: false }));
      spawnXPFloat(-xp, pos?.x, pos?.y);
    }
  }, [profile, habits, dayData, effectiveDate, spawnXPFloat, triggerLevelUp, handlePerfectDay]);

  const editHabit = useCallback((
    habitId: string,
    updates: Partial<Pick<DailyHabit, 'title' | 'difficulty'>>,
  ) => {
    setHabits(prev => prev.map(h =>
      h.id === habitId
        ? { ...h, ...updates, baseXP: updates.difficulty ? getBaseXP(updates.difficulty) : h.baseXP }
        : h
    ));
  }, []);

  const deleteHabit = useCallback((habitId: string) => {
    setHabits(prev => prev.filter(h => h.id !== habitId));
  }, []);

  // ── Profile updates ───────────────────────────────────────────────────────
  const updateProfile = useCallback((updates: Partial<Pick<UserProfile, 'displayName' | 'dayResetHour'>>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  }, []);

  // ── Recurring templates ───────────────────────────────────────────────────
  const [templates, setTemplates] = useState<RecurringTemplate[]>(() =>
    storage.get<RecurringTemplate[]>('templates') ?? []
  );
  useEffect(() => { storage.set('templates', templates); }, [templates]);

  const saveTemplate = useCallback((template: RecurringTemplate) => {
    const isNew = !templates.some(t => t.id === template.id);
    setTemplates(prev =>
      isNew ? [...prev, template] : prev.map(t => t.id === template.id ? template : t)
    );
    // New template that fires today + planning already locked → add as late task
    if (isNew && template.active && shouldTemplateFireOnDate(template, effectiveDate)) {
      if (profile.lastPlannedDate === effectiveDate) {
        const xpValue = calcScheduledTaskXP(template.difficulty, template.startTime, template.endTime, true);
        const newTask: ScheduledTask = {
          id: crypto.randomUUID(),
          title: template.title,
          date: effectiveDate,
          startTime: template.startTime,
          endTime: template.endTime,
          difficulty: template.difficulty,
          completed: false,
          xpValue,
          category: template.category,
          color: template.color,
          recurringTemplateId: template.id,
          addedLate: true,
        };
        setDayData(prev => ({ ...prev, scheduledTasks: [...prev.scheduledTasks, newTask] }));
      }
    }
  }, [templates, effectiveDate, profile.lastPlannedDate]);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
  }, []);

  const toggleTemplate = useCallback((id: string) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !t.active } : t));
  }, []);

  // ── Late-complete past tasks from the calendar ────────────────────────────
  const lateCompleteTask = useCallback((
    dayStr: string,
    taskId: string,
    taskType: 'scheduled' | 'flexible',
  ) => {
    if (dayStr >= effectiveDate) return; // only past days
    const pastDay = storage.get<DayData>(`day_${dayStr}`);
    if (!pastDay) return;

    let xpEarned = 0;
    let updatedDay: DayData;

    if (taskType === 'scheduled') {
      const task = pastDay.scheduledTasks.find(t => t.id === taskId);
      if (!task || task.completed) return;
      xpEarned = Math.round(task.xpValue * 0.5);
      updatedDay = { ...pastDay, scheduledTasks: pastDay.scheduledTasks.map(t => t.id === taskId ? { ...t, completed: true } : t) };
    } else {
      const task = pastDay.flexibleTasks.find(t => t.id === taskId);
      if (!task || task.completed) return;
      xpEarned = Math.round(task.xpValue * 0.5);
      updatedDay = { ...pastDay, flexibleTasks: pastDay.flexibleTasks.map(t => t.id === taskId ? { ...t, completed: true } : t) };
    }

    storage.set(`day_${dayStr}`, updatedDay);
    setProfile(prev => {
      const updated = { ...prev, totalXP: prev.totalXP + xpEarned, totalTasksCompleted: prev.totalTasksCompleted + 1 };
      updated.level = getLevelFromXP(updated.totalXP);
      return updated;
    });
    spawnXPFloat(xpEarned);
  }, [effectiveDate, spawnXPFloat]);

  return {
    profile, habits, dayData, effectiveDate,
    xpFloats, levelUpInfo, perfectDayCelebration,
    showPlanningModal, transitionSummaries,
    // Actions
    lockInPlan,
    addScheduledTask, toggleScheduledTask, deleteScheduledTask,
    addFlexibleTask,  toggleFlexibleTask,  deleteFlexibleTask,
    addHabit, toggleHabit, editHabit, deleteHabit,
    templates, saveTemplate, deleteTemplate, toggleTemplate,
    lateCompleteTask,
    updateProfile,
    achievementQueue,
    dismissAchievement: (id: string) => setAchievementQueue(prev => prev.filter(a => a.id !== id)),
    dismissLevelUp: () => setLevelUpInfo(null),
  };
}

export type AppState = ReturnType<typeof useAppState>;
