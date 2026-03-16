import type { UserProfile, DailyHabit } from "../types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  icon: string; // Lucide icon name
  check: (profile: UserProfile, habits: DailyHabit[]) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_task", title: "First Step", description: "Complete your first task", xpReward: 50, icon: "Footprints",
    check: (p) => p.totalTasksCompleted >= 1 },
  { id: "tasks_50", title: "Half Century", description: "Complete 50 tasks", xpReward: 200, icon: "Target",
    check: (p) => p.totalTasksCompleted >= 50 },
  { id: "tasks_100", title: "Centurion", description: "Complete 100 tasks", xpReward: 300, icon: "Swords",
    check: (p) => p.totalTasksCompleted >= 100 },
  { id: "tasks_500", title: "Workhorse", description: "Complete 500 tasks", xpReward: 1000, icon: "Hammer",
    check: (p) => p.totalTasksCompleted >= 500 },
  { id: "tasks_1000", title: "Grinder", description: "Complete 1000 tasks", xpReward: 2000, icon: "Gem",
    check: (p) => p.totalTasksCompleted >= 1000 },
  { id: "streak_7", title: "One Week Warrior", description: "7-day streak on any habit", xpReward: 100, icon: "Flame",
    check: (_, h) => h.some(habit => habit.currentStreak >= 7) },
  { id: "streak_30", title: "Monthly Master", description: "30-day streak on any habit", xpReward: 500, icon: "FlameKindling",
    check: (_, h) => h.some(habit => habit.currentStreak >= 30) },
  { id: "streak_100", title: "Unstoppable", description: "100-day streak on any habit", xpReward: 2000, icon: "Zap",
    check: (_, h) => h.some(habit => habit.currentStreak >= 100) },
  { id: "streak_365", title: "Legendary Discipline", description: "365-day streak", xpReward: 10000, icon: "Crown",
    check: (_, h) => h.some(habit => habit.currentStreak >= 365) },
  { id: "perfect_day", title: "Flawless", description: "Achieve a perfect day", xpReward: 100, icon: "Star",
    check: (p) => p.perfectDays >= 1 },
  { id: "perfect_week", title: "Perfect Week", description: "7 consecutive perfect days", xpReward: 500, icon: "Trophy",
    check: (p) => p.consecutivePerfectDays >= 7 },
  { id: "level_10", title: "Getting Serious", description: "Reach level 10", xpReward: 200, icon: "TrendingUp",
    check: (p) => p.level >= 10 },
  { id: "level_25", title: "Dedicated", description: "Reach level 25", xpReward: 1000, icon: "Shield",
    check: (p) => p.level >= 25 },
  { id: "level_50", title: "Elite", description: "Reach level 50", xpReward: 5000, icon: "Award",
    check: (p) => p.level >= 50 },
  { id: "early_bird_10", title: "Morning Person", description: "Get Early Bird bonus 10 times", xpReward: 200, icon: "Sunrise",
    check: (p) => p.earlyBirdCount >= 10 },
  { id: "brutal_5", title: "Pain Seeker", description: "Complete 5 difficulty-5 tasks", xpReward: 500, icon: "Skull",
    check: (p) => p.brutalTasksCompleted >= 5 },
];

export function checkNewAchievements(profile: UserProfile, habits: DailyHabit[]): Achievement[] {
  return ACHIEVEMENTS.filter(a =>
    !profile.achievements.includes(a.id) && a.check(profile, habits)
  );
}
