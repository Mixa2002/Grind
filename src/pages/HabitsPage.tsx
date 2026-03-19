import { useState } from 'react';
import { useStore } from '../stores/useStore';
import { getHabitStreak } from '../utils';

export default function HabitsPage() {
  const { habits, isLoading, addHabit, deleteHabit } = useStore();
  const [name, setName] = useState('');

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addHabit(trimmed);
    setName('');
  };

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Habits</h1>

      <div className="flex gap-2 mb-6">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="New habit..."
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add
        </button>
      </div>

      {habits.length === 0 ? (
        <p className="text-gray-400">No habits yet. Add one above.</p>
      ) : (
        <ul className="space-y-2">
          {habits.map((habit) => (
            <li
              key={habit.id}
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <div>
                <p className="font-medium">{habit.name}</p>
                <p className="text-sm text-gray-500">{getHabitStreak(habit)} day streak</p>
              </div>
              <button
                onClick={() => deleteHabit(habit.id)}
                className="text-red-500 hover:text-red-700 text-sm"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
