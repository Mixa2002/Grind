import { useStore } from '../stores/useStore';
import { getCurrentWeekDates, getWeekDayName, getHabitDayPercentage, formatDateISO } from '../utils';

function formatDateShort(date: Date): string {
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
}

export default function WeekPage() {
  const { habits, isLoading } = useStore();
  const weekDates = getCurrentWeekDates();

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">This Week</h1>

      {habits.length === 0 ? (
        <p className="text-gray-400">No habits to track.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Habit</th>
                {weekDates.map((date, i) => (
                  <th key={i} className="p-2 text-center">
                    <div>{getWeekDayName(date)}</div>
                    <div className="text-xs text-gray-400">{formatDateShort(date)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map((habit) => (
                <tr key={habit.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-2 font-medium">{habit.name}</td>
                  {weekDates.map((date) => {
                    const iso = formatDateISO(date);
                    const done = habit.completions[iso] === true;
                    return (
                      <td key={iso} className="p-2 text-center">
                        {done ? '\u2705' : '\u2796'}
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr className="border-t-2 border-gray-300 dark:border-gray-600">
                <td className="p-2 font-medium text-gray-500">Completion</td>
                {weekDates.map((date) => {
                  const iso = formatDateISO(date);
                  return (
                    <td key={iso} className="p-2 text-center text-xs text-gray-500">
                      {getHabitDayPercentage(habits, iso)}%
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
