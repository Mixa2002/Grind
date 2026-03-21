import { create } from 'zustand';
import type { Task, Habit } from '../types';
import { dataService } from '../services/dataService';

interface AppStore {
  tasks: Task[];
  habits: Habit[];
  isLoading: boolean;
  loadError: string | null;

  loadData(): Promise<void>;
  addTask(task: Omit<Task, 'id' | 'completions' | 'createdAt' | 'updatedAt'>): Promise<void>;
  updateTask(id: string, updates: Partial<Task>): Promise<void>;
  deleteTask(id: string): Promise<void>;
  toggleTaskDone(taskId: string, date: string): Promise<void>;
  addHabit(name: string): Promise<void>;
  deleteHabit(id: string): Promise<void>;
  toggleHabitCompletion(habitId: string, date: string): Promise<void>;
}

export const useStore = create<AppStore>((set, get) => ({
  tasks: [],
  habits: [],
  isLoading: true,
  loadError: null,

  async loadData() {
    set({ tasks: [], habits: [], isLoading: true, loadError: null });
    try {
      const [tasks, habits] = await Promise.all([
        dataService.getTasks(),
        dataService.getHabits(),
      ]);
      set({ tasks, habits, isLoading: false });
    } catch (err) {
      set({ isLoading: false, loadError: err instanceof Error ? err.message : 'Failed to load data' });
    }
  },

  async addTask(taskData) {
    const now = new Date().toISOString();
    const task: Task = {
      ...taskData,
      id: crypto.randomUUID(),
      completions: {},
      createdAt: now,
      updatedAt: now,
    };
    const saved = await dataService.saveTask(task);
    set({ tasks: [...get().tasks, saved] });
  },

  async updateTask(id, updates) {
    const updated = await dataService.updateTask(id, updates);
    set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) });
  },

  async deleteTask(id) {
    await dataService.deleteTask(id);
    set({ tasks: get().tasks.filter((t) => t.id !== id) });
  },

  async toggleTaskDone(taskId, date) {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const completions = { ...task.completions };
    if (completions[date]) {
      delete completions[date];
    } else {
      completions[date] = true;
    }
    // Optimistic update so rapid toggles read the latest intent
    const optimistic = { ...task, completions };
    set({ tasks: get().tasks.map((t) => (t.id === taskId ? optimistic : t)) });
    try {
      const updated = await dataService.updateTask(taskId, { completions });
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? updated : t)) });
    } catch {
      // Revert on failure
      set({ tasks: get().tasks.map((t) => (t.id === taskId ? task : t)) });
    }
  },

  async addHabit(name) {
    const now = new Date().toISOString();
    const habit: Habit = {
      id: crypto.randomUUID(),
      name,
      completions: {},
      createdAt: now,
      updatedAt: now,
    };
    const saved = await dataService.saveHabit(habit);
    set({ habits: [...get().habits, saved] });
  },

  async deleteHabit(id) {
    await dataService.deleteHabit(id);
    set({ habits: get().habits.filter((h) => h.id !== id) });
  },

  async toggleHabitCompletion(habitId, date) {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return;
    const completions = { ...habit.completions };
    if (completions[date]) {
      delete completions[date];
    } else {
      completions[date] = true;
    }
    // Optimistic update so rapid toggles read the latest intent
    const optimistic = { ...habit, completions };
    set({ habits: get().habits.map((h) => (h.id === habitId ? optimistic : h)) });
    try {
      const updated = await dataService.updateHabit(habitId, { completions });
      set({ habits: get().habits.map((h) => (h.id === habitId ? updated : h)) });
    } catch {
      // Revert on failure
      set({ habits: get().habits.map((h) => (h.id === habitId ? habit : h)) });
    }
  },
}));
