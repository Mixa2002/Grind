import { getDurationMinutes } from "./date";
import type { Difficulty } from "../types";

// --- LEVELING (RuneScape-inspired curve) ---

const XP_TABLE: number[] = [];
(function buildTable() {
  XP_TABLE.push(0); // level 0
  let cumulative = 0;
  for (let i = 1; i <= 100; i++) {
    cumulative += Math.floor((i + 300 * Math.pow(2, i / 7)) / 4);
    XP_TABLE.push(Math.floor(cumulative));
  }
})();

export function getXPForLevel(level: number): number {
  return XP_TABLE[Math.min(level, 100)] ?? XP_TABLE[100];
}

export function getLevelFromXP(totalXP: number): number {
  for (let i = 1; i <= 100; i++) {
    if (totalXP < XP_TABLE[i]) return i - 1;
  }
  return 100;
}

export function getXPProgress(totalXP: number): { level: number; currentXP: number; nextLevelXP: number; percentage: number } {
  const level = getLevelFromXP(totalXP);
  const currentLevelXP = XP_TABLE[level] ?? 0;
  const nextLevelXP = XP_TABLE[level + 1] ?? XP_TABLE[100];
  const progress = totalXP - currentLevelXP;
  const needed = nextLevelXP - currentLevelXP;
  return {
    level,
    currentXP: progress,
    nextLevelXP: needed,
    percentage: needed > 0 ? Math.min(100, (progress / needed) * 100) : 100,
  };
}

// --- DIFFICULTY BASE XP (exponential scaling) ---

const DIFFICULTY_XP: Record<Difficulty, number> = {
  1: 15,
  2: 30,
  3: 60,
  4: 120,
  5: 250,
};

export function getBaseXP(difficulty: Difficulty): number {
  return DIFFICULTY_XP[difficulty];
}

// --- SCHEDULED TASK XP ---
// Formula: base * (0.5 + 0.5 * clamp(minutes/60, 0.5, 3.0))
// Short hard task ≈ long easy task. Difficulty always dominates.

export function calcScheduledTaskXP(difficulty: Difficulty, startTime: string, endTime: string, addedLate: boolean = false): number {
  const base = DIFFICULTY_XP[difficulty];
  const minutes = getDurationMinutes(startTime, endTime);
  const durationFactor = Math.min(3.0, Math.max(0.5, minutes / 60));
  const raw = Math.round(base * (0.5 + 0.5 * durationFactor));
  return addedLate ? Math.round(raw * 0.75) : raw;
}

// --- FLEXIBLE TASK XP ---

export function calcFlexibleTaskXP(difficulty: Difficulty, addedLate: boolean = false): number {
  const raw = DIFFICULTY_XP[difficulty];
  return addedLate ? Math.round(raw * 0.75) : raw;
}

// --- DAILY HABIT XP (streak multiplier) ---
// streakMultiplier = 1 + ln(1 + streak) * 0.4, capped at 3.0

export function getStreakMultiplier(streak: number): number {
  return Math.min(3.0, 1 + Math.log(1 + streak) * 0.4);
}

export function calcHabitXP(difficulty: Difficulty, currentStreak: number): number {
  const base = DIFFICULTY_XP[difficulty];
  const multiplier = getStreakMultiplier(currentStreak);
  return Math.round(base * multiplier);
}

// --- PENALTIES ---

export function calcScheduledPenalty(xpValue: number): number {
  return Math.round(xpValue * 0.75); // lose 75% of potential
}

export function calcFlexiblePenalty(xpValue: number): number {
  return Math.round(xpValue * 0.60); // lose 60% of potential
}

export function calcHabitPenalty(difficulty: Difficulty): number {
  return Math.round(DIFFICULTY_XP[difficulty] * 0.50); // lose 50% of base
}

// --- BONUSES ---

export const BONUSES = {
  PERFECT_DAY: 100,
  EARLY_BIRD_PERCENT: 0.15, // +15% on the task
  CONSISTENCY_5_DAYS: 200,
  STREAK_7: 100,
  STREAK_30: 500,
  STREAK_100: 2000,
  STREAK_365: 10000,
};

// --- LEVEL TITLES ---

export function getLevelTitle(level: number): string {
  if (level <= 5) return "Novice";
  if (level <= 10) return "Apprentice";
  if (level <= 15) return "Journeyman";
  if (level <= 20) return "Adept";
  if (level <= 25) return "Expert";
  if (level <= 30) return "Veteran";
  if (level <= 40) return "Master";
  if (level <= 50) return "Grandmaster";
  if (level <= 60) return "Champion";
  if (level <= 75) return "Legend";
  return "Mythic";
}
