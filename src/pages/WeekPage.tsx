import { useState, useMemo } from 'react';
import { useStore } from '../stores/useStore';
import {
  getCurrentWeekDates,
  getWeekDayName,
  getTasksForDate,
  formatDateISO,
  getTodayISO,
} from '../utils';
import TaskFormModal from '../components/TaskFormModal';
import WeekTaskCard from '../components/WeekTaskCard';

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
] as const;

function formatWeekRange(dates: Date[]): string {
  const first = dates[0];
  const last = dates[dates.length - 1];
  const startMonth = MONTH_NAMES_SHORT[first.getMonth()];
  const endMonth = MONTH_NAMES_SHORT[last.getMonth()];
  const startDay = first.getDate();
  const endDay = last.getDate();
  const year = last.getFullYear();

  if (first.getMonth() === last.getMonth()) {
    return `${startMonth} ${startDay} \u2013 ${endMonth} ${endDay}, ${year}`;
  }
  return `${startMonth} ${startDay} \u2013 ${endMonth} ${endDay}, ${year}`;
}

export default function WeekPage() {
  const { tasks, isLoading } = useStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState(getTodayISO());

  const weekDates = useMemo(() => getCurrentWeekDates(), []);
  const todayISO = getTodayISO();

  const tasksByDay = useMemo(() => {
    return weekDates.map((date) => ({
      date,
      iso: formatDateISO(date),
      dayName: getWeekDayName(date),
      dayNumber: date.getDate(),
      tasks: getTasksForDate(tasks, date).sort((a, b) => a.startTime - b.startTime),
    }));
  }, [tasks, weekDates]);

  const openModalForDate = (iso: string) => {
    setModalDate(iso);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      {/* Header */}
      <div className="px-6 pt-4 pb-3">
        <h1 className="text-xl font-bold text-white">
          {formatWeekRange(weekDates)}
        </h1>
      </div>

      {/* Day Columns */}
      <div className="flex-1 overflow-x-auto overscroll-contain px-4 pb-4">
        <div className="flex gap-2 min-w-max h-full">
          {tasksByDay.map((day) => {
            const isToday = day.iso === todayISO;

            return (
              <div
                key={day.iso}
                className={`flex flex-col ${isToday ? 'bg-amber-950/10 rounded-lg' : ''}`}
                style={{ minWidth: '160px', width: '160px' }}
              >
                {/* Column Header */}
                <div
                  className={`flex items-center justify-between rounded-lg px-3 py-2 mb-2 ${
                    isToday
                      ? 'bg-amber-900/30 border border-amber-600/60'
                      : 'bg-gray-800/60 border border-gray-700/40'
                  }`}
                >
                  <div>
                    <span
                      className={`text-sm font-semibold ${
                        isToday ? 'text-amber-300' : 'text-gray-300'
                      }`}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`ml-1.5 text-sm ${
                        isToday ? 'text-amber-400 font-bold' : 'text-gray-400'
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModalForDate(day.iso)}
                    className={`w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center transition-colors ${
                      isToday
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    }`}
                    aria-label={`Add task for ${day.dayName} ${day.dayNumber}`}
                  >
                    +
                  </button>
                </div>

                {/* Tasks List */}
                <div className="flex-1 overflow-y-auto pr-0.5">
                  {day.tasks.length === 0 ? (
                    <div className="flex flex-col items-center mt-4 opacity-60">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-gray-600 mb-1" aria-hidden="true">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <p className="text-center text-sm text-gray-600">
                        No tasks
                      </p>
                    </div>
                  ) : (
                    day.tasks.map((task) => (
                      <WeekTaskCard
                        key={`${task.id}-${day.iso}`}
                        task={task}
                        dateISO={day.iso}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      <TaskFormModal
        isOpen={modalOpen}
        onClose={closeModal}
        defaultDate={modalDate}
        source="week"
      />
    </div>
  );
}
