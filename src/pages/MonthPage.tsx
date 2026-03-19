import { useStore } from '../stores/useStore';
import { getCurrentMonthDates, getHabitDayPercentage, formatDateISO } from '../utils';

export default function MonthPage() {
  const { habits, isLoading } = useStore();
  const now = new Date();
  const monthGrid = getCurrentMonthDates();

  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  if (isLoading) return <div className="p-6 text-gray-400">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{monthName}</h1>

      {habits.length === 0 ? (
        <p className="text-gray-400">No habits to track.</p>
      ) : (
        <div className="space-y-6">
          {habits.map((habit) => {
            const monthDates = monthGrid.filter((d) => d.isCurrentMonth);
            const completedDays = monthDates.filter(
              (d) => habit.completions[formatDateISO(d.date)] === true
            ).length;

            return (
              <div key={habit.id}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-medium">{habit.name}</h2>
                  <span className="text-sm text-gray-500">
                    {completedDays}/{monthDates.length} days
                  </span>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {monthGrid.map((entry) => {
                    const iso = formatDateISO(entry.date);
                    const done = habit.completions[iso] === true;
                    return (
                      <div
                        key={iso}
                        title={`${iso} — ${getHabitDayPercentage(habits, iso)}%`}
                        className={`w-full aspect-square rounded-sm ${
                          !entry.isCurrentMonth
                            ? 'bg-transparent'
                            : done
                              ? 'bg-green-500'
                              : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
