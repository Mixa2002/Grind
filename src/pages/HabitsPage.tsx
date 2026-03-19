import { useState, useMemo, useCallback } from 'react';
import { useStore } from '../stores/useStore';
import {
  getHabitStreak,
  getHabitDayPercentage,
  getTodayISO,
  formatDateISO,
  getCurrentMonthDates,
} from '../utils';
import AddHabitModal from '../components/AddHabitModal';
import HabitProgressRing from '../components/HabitProgressRing';

const DAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export default function HabitsPage() {
  const { habits, isLoading, toggleHabitCompletion, deleteHabit } = useStore();
  const [modalOpen, setModalOpen] = useState(false);

  const todayISO = getTodayISO();
  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;

  const monthGrid = useMemo(() => getCurrentMonthDates(), []);

  const handleToggle = useCallback(
    (habitId: string) => {
      toggleHabitCompletion(habitId, todayISO);
    },
    [toggleHabitCompletion, todayISO],
  );

  const handleDelete = useCallback(
    (habitId: string, habitName: string) => {
      if (window.confirm(`Delete "${habitName}"? This cannot be undone.`)) {
        deleteHabit(habitId);
      }
    },
    [deleteHabit],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      {/* --- Today's Habits --- */}
      <div className="px-6 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">Today's Habits</h1>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-7 h-7 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold flex items-center justify-center transition-colors"
            aria-label="Add new habit"
          >
            +
          </button>
        </div>

        {habits.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">
            No habits yet. Tap + to start building your streaks.
          </p>
        ) : (
          <ul className="space-y-2">
            {habits.map((habit) => {
              const isDone = habit.completions[todayISO] === true;
              const streak = getHabitStreak(habit);

              return (
                <li
                  key={habit.id}
                  className={`group flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    isDone
                      ? 'border-l-green-500 border-l-[3px] border-y-gray-700 border-r-gray-700 bg-green-950/20'
                      : 'border-gray-700 bg-gray-900'
                  }`}
                >
                  {/* Toggle checkbox */}
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={isDone}
                    aria-label={`Mark ${habit.name} as ${isDone ? 'incomplete' : 'complete'}`}
                    onClick={() => handleToggle(habit.id)}
                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isDone
                        ? 'bg-green-600 border-green-600 text-white'
                        : 'border-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {isDone && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 7l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>

                  {/* Name */}
                  <span className={`flex-1 text-sm font-medium ${isDone ? 'text-gray-300' : 'text-gray-100'}`}>
                    {habit.name}
                  </span>

                  {/* Streak */}
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {streak > 0 && (
                      <>
                        <span className="mr-0.5" role="img" aria-label="streak">
                          🔥
                        </span>
                        {streak} {streak === 1 ? 'day' : 'days'}
                      </>
                    )}
                  </span>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => handleDelete(habit.id, habit.name)}
                    className="text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    aria-label={`Delete ${habit.name}`}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path
                        d="M5 2h6M2 4h12M6 4v8M10 4v8M3.5 4l.5 9a1 1 0 001 1h6a1 1 0 001-1l.5-9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* --- Monthly Completion Calendar --- */}
      {habits.length > 0 && (
        <div className="mt-3 border-t border-gray-800 px-4 pt-3 pb-4 overflow-y-auto">
          <h2 className="text-base font-semibold text-gray-200 mb-2 px-2">
            {monthLabel}
          </h2>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-gray-500 py-1"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div className="grid grid-cols-7">
            {monthGrid.map((entry) => {
              const iso = formatDateISO(entry.date);
              const isToday = iso === todayISO;
              const isFuture = iso > todayISO;

              if (!entry.isCurrentMonth) {
                return <div key={iso} className="flex flex-col items-center py-1" />;
              }

              const pct = isFuture ? 0 : getHabitDayPercentage(habits, iso);

              return (
                <div
                  key={iso}
                  className="flex flex-col items-center py-1"
                >
                  <span
                    className={`text-[10px] mb-0.5 ${
                      isToday
                        ? 'text-amber-400 font-semibold'
                        : 'text-gray-500'
                    }`}
                  >
                    {entry.date.getDate()}
                  </span>
                  <HabitProgressRing percentage={pct} isFuture={isFuture} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Habit Modal */}
      <AddHabitModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
