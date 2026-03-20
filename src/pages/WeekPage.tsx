import { useState, useMemo } from 'react';
import { useStore } from '../stores/useStore';
import {
  getCurrentWeekDates,
  getWeekDayName,
  getTasksForDate,
  formatDateISO,
  formatTime,
  getTodayISO,
} from '../utils';
import TaskFormModal from '../components/TaskFormModal';
import WeekTaskCard from '../components/WeekTaskCard';

const WEEK_GRID_START = 360; // 6 AM in minutes
const WEEK_GRID_END = 1320;  // 10 PM in minutes
const WEEK_HOURS: number[] = [];
for (let m = WEEK_GRID_START; m <= WEEK_GRID_END; m += 60) {
  WEEK_HOURS.push(m);
}

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
      <div className="flex items-center justify-center h-64" style={{ color: 'var(--text-secondary)' }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-49px)]">
      {/* Header */}
      <div className="px-6 pt-4 pb-3">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
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
                className={`flex flex-col ${isToday ? 'rounded-lg' : ''}`}
                style={{
                  minWidth: '160px',
                  width: '160px',
                  ...(isToday ? { backgroundColor: 'rgba(162, 203, 139, 0.15)' } : {}),
                }}
              >
                {/* Column Header */}
                <div
                  className="flex items-center justify-between rounded-lg px-3 py-2 mb-2"
                  style={
                    isToday
                      ? { backgroundColor: 'var(--accent)', color: '#ffffff' }
                      : { backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)' }
                  }
                >
                  <div>
                    <span
                      className="text-sm font-semibold"
                      style={{ color: isToday ? '#ffffff' : 'var(--text-primary)' }}
                    >
                      {day.dayName}
                    </span>
                    <span
                      className={`ml-1.5 text-sm ${isToday ? 'font-bold' : ''}`}
                      style={{ color: isToday ? 'var(--accent-tint)' : 'var(--text-secondary)' }}
                    >
                      {day.dayNumber}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => openModalForDate(day.iso)}
                    className="w-6 h-6 rounded-full text-sm font-bold flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: isToday ? 'rgba(255,255,255,0.25)' : 'var(--accent)',
                      color: '#ffffff',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = isToday ? 'rgba(255,255,255,0.35)' : 'var(--accent-light)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = isToday ? 'rgba(255,255,255,0.25)' : 'var(--accent)')
                    }
                    aria-label={`Add task for ${day.dayName} ${day.dayNumber}`}
                  >
                    +
                  </button>
                </div>

                {/* Tasks with hour markers */}
                <div className="flex-1 overflow-y-auto pr-0.5 relative">
                  {/* Hour marker lines */}
                  {WEEK_HOURS.map((minute) => {
                    const hourLabel = formatTime(minute);
                    const showLabel = minute % 120 === 0; // label every 2 hours
                    return (
                      <div key={minute} className="flex items-center" style={{ height: '28px' }}>
                        {showLabel && (
                          <span className="text-[9px] w-full text-center select-none leading-none" style={{ color: 'var(--text-secondary)' }}>
                            {hourLabel}
                          </span>
                        )}
                        <div className="absolute left-0 right-0" style={{ borderTop: '1px solid rgba(199, 234, 187, 0.4)', pointerEvents: 'none' }} />
                      </div>
                    );
                  })}

                  {/* Task cards overlaid */}
                  <div className="absolute inset-0 pt-0.5 overflow-y-auto">
                    {day.tasks.map((task) => (
                      <WeekTaskCard
                        key={`${task.id}-${day.iso}`}
                        task={task}
                        dateISO={day.iso}
                      />
                    ))}
                  </div>
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
