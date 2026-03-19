export interface Task {
  id: string;
  title: string;
  date: string;
  startTime: number;
  duration: number;
  hardness: number;
  repeatable: boolean;
  repeatDays: string[];
  source: 'day' | 'week' | 'month';
  completions: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

export interface Habit {
  id: string;
  name: string;
  completions: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}
