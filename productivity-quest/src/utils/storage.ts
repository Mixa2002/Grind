const PREFIX = "pq_";

export const storage = {
  get<T>(key: string): T | null {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    try { return JSON.parse(raw) as T; } catch { return null; }
  },
  set<T>(key: string, value: T): void {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  },
  remove(key: string): void {
    localStorage.removeItem(PREFIX + key);
  },
  keys(): string[] {
    return Object.keys(localStorage)
      .filter(k => k.startsWith(PREFIX))
      .map(k => k.slice(PREFIX.length));
  }
};

// Storage key conventions:
// "profile"          -> UserProfile
// "day_{YYYY-MM-DD}" -> DayData
// "habits"           -> DailyHabit[]
// "templates"        -> RecurringTemplate[]
