import type { Task } from '../types';
import { formatTime, getTodayISO } from '../utils';
import { useStore } from '../stores/useStore';

const HARDNESS_COLORS: Record<number, string> = {
  1: 'bg-green-900/70 border-green-700',
  2: 'bg-teal-900/70 border-teal-700',
  3: 'bg-amber-900/70 border-amber-700',
  4: 'bg-orange-900/70 border-orange-700',
  5: 'bg-red-900/70 border-red-700',
};

const HARDNESS_DONE_COLORS: Record<number, string> = {
  1: 'bg-green-950/40 border-green-900/50',
  2: 'bg-teal-950/40 border-teal-900/50',
  3: 'bg-amber-950/40 border-amber-900/50',
  4: 'bg-orange-950/40 border-orange-900/50',
  5: 'bg-red-950/40 border-red-900/50',
};

interface TaskBlockProps {
  task: Task;
  pixelsPerMinute: number;
  gridStartMinute: number;
  gridEndMinute: number;
  columnIndex: number;
  totalColumns: number;
}

export default function TaskBlock({
  task,
  pixelsPerMinute,
  gridStartMinute,
  gridEndMinute,
  columnIndex,
  totalColumns,
}: TaskBlockProps) {
  const toggleTaskDone = useStore((s) => s.toggleTaskDone);
  const todayISO = getTodayISO();
  const isDone = task.completions[todayISO] === true;

  const topOffset = (task.startTime - gridStartMinute) * pixelsPerMinute;
  const clippedEnd = Math.min(task.startTime + task.duration, gridEndMinute);
  const visualDuration = clippedEnd - task.startTime;
  const height = visualDuration * pixelsPerMinute;

  const widthPercent = 100 / totalColumns;
  const leftPercent = columnIndex * widthPercent;

  const colorClass = isDone
    ? HARDNESS_DONE_COLORS[task.hardness] ?? HARDNESS_DONE_COLORS[3]
    : HARDNESS_COLORS[task.hardness] ?? HARDNESS_COLORS[3];

  const endTime = task.startTime + task.duration;
  const stars = '★'.repeat(task.hardness);

  return (
    <button
      type="button"
      onClick={() => toggleTaskDone(task.id, todayISO)}
      className={`absolute rounded-lg border px-2 py-1 overflow-hidden cursor-pointer text-left transition-opacity ${colorClass} ${isDone ? 'opacity-50' : 'opacity-100'}`}
      style={{
        top: `${topOffset}px`,
        height: `${Math.max(height, 20)}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
      }}
      aria-label={`${task.title}, ${formatTime(task.startTime)} to ${formatTime(endTime)}, hardness ${task.hardness}${isDone ? ', completed' : ''}`}
    >
      <span
        className={`block text-sm font-semibold text-white truncate ${isDone ? 'line-through' : ''}`}
      >
        {task.title}
      </span>
      {height >= 36 && (
        <span className="block text-xs text-white/70 truncate">
          {formatTime(task.startTime)} – {formatTime(endTime)}
        </span>
      )}
      {height >= 52 && (
        <span className="block text-xs text-amber-400/80 mt-0.5">{stars}</span>
      )}
    </button>
  );
}
