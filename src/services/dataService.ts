import type { Task, Habit } from '../types';

export interface DataService {
  getTasks(): Promise<Task[]>;
  saveTask(task: Task): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<void>;

  getHabits(): Promise<Habit[]>;
  saveHabit(habit: Habit): Promise<Habit>;
  updateHabit(id: string, updates: Partial<Habit>): Promise<Habit>;
  deleteHabit(id: string): Promise<void>;
}

const TASKS_KEY = 'grind_tasks';
const HABITS_KEY = 'grind_habits';

function readList<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeList<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

const localStorageService: DataService = {
  async getTasks() {
    return readList<Task>(TASKS_KEY);
  },

  async saveTask(task) {
    const tasks = readList<Task>(TASKS_KEY);
    tasks.push(task);
    writeList(TASKS_KEY, tasks);
    return task;
  },

  async updateTask(id, updates) {
    const tasks = readList<Task>(TASKS_KEY);
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error(`Task ${id} not found`);
    tasks[idx] = { ...tasks[idx], ...updates, updatedAt: new Date().toISOString() };
    writeList(TASKS_KEY, tasks);
    return tasks[idx];
  },

  async deleteTask(id) {
    const tasks = readList<Task>(TASKS_KEY);
    writeList(TASKS_KEY, tasks.filter((t) => t.id !== id));
  },

  async getHabits() {
    return readList<Habit>(HABITS_KEY);
  },

  async saveHabit(habit) {
    const habits = readList<Habit>(HABITS_KEY);
    habits.push(habit);
    writeList(HABITS_KEY, habits);
    return habit;
  },

  async updateHabit(id, updates) {
    const habits = readList<Habit>(HABITS_KEY);
    const idx = habits.findIndex((h) => h.id === id);
    if (idx === -1) throw new Error(`Habit ${id} not found`);
    habits[idx] = { ...habits[idx], ...updates, updatedAt: new Date().toISOString() };
    writeList(HABITS_KEY, habits);
    return habits[idx];
  },

  async deleteHabit(id) {
    const habits = readList<Habit>(HABITS_KEY);
    writeList(HABITS_KEY, habits.filter((h) => h.id !== id));
  },
};

export const dataService: DataService = localStorageService;
