import { memo } from 'react';
import type { Task } from '../types';
import { formatTime, getTodayISO } from '../utils';
import { useStore } from '../stores/useStore';

// Green palette hardness colors for light theme
const HARDNESS_BG: Record<number, string> = {
  1: '#C7EABB',
  2: '#A2CB8B',
  3: '#84B179',
  4: '#6B9960',
  5: '#4A7A3D',
};

const HARDNESS_BORDER: Record<number, string> = {
  1: '#A2CB8B',
  2: '#84B179',
  3: '#6B9960',
  4: '#4A7A3D',
  5: '#3A6630',
};

// Text color: light text for darker blocks, dark text for lighter blocks
const HARDNESS_TEXT: Record<number, string> = {
  1: '#2D3A29',
  2: '#2D3A29',
  3: '#ffffff',
  4: '#ffffff',
  5: '#ffffff',
};

const HARDNESS_SUBTEXT: Record<number, string> = {
  1: 'rgba(45, 58, 41, 0.7)',
  2: 'rgba(45, 58, 41, 0.7)',
  3: 'rgba(255, 255, 255, 0.75)',
  4: 'rgba(255, 255, 255, 0.75)',
  5: 'rgba(255, 255, 255, 0.75)',
};

interface TaskBlockProps {
  task: Task;
  pixelsPerMinute: number;
  gridStartMinute: number;
  gridEndMinute: number;
  columnIndex: number;
  totalColumns: number;
  animationIndex?: number;
}

const TaskBlock = memo<TaskBlockProps>(function TaskBlock({
  task,
  pixelsPerMinute,
  gridStartMinute,
  gridEndMinute,
  columnIndex,
  totalColumns,
  animationIndex = 0,
}) {
  const toggleTaskDone = useStore((s) => s.toggleTaskDone);
  const todayISO = getTodayISO();
  const isDone = task.completions[todayISO] === true;

  const topOffset = (task.startTime - gridStartMinute) * pixelsPerMinute;
  const clippedEnd = Math.min(task.startTime + task.duration, gridEndMinute);
  const visualDuration = clippedEnd - task.startTime;
  const height = visualDuration * pixelsPerMinute;

  const widthPercent = 100 / totalColumns;
  const leftPercent = columnIndex * widthPercent;

  const h = task.hardness;
  const bg = HARDNESS_BG[h] ?? HARDNESS_BG[3];
  const border = HARDNESS_BORDER[h] ?? HARDNESS_BORDER[3];
  const textColor = HARDNESS_TEXT[h] ?? HARDNESS_TEXT[3];
  const subTextColor = HARDNESS_SUBTEXT[h] ?? HARDNESS_SUBTEXT[3];

  const endTime = task.startTime + task.duration;
  const stars = '\u2605'.repeat(task.hardness);

  const hardnessBorderClass = `hardness-border-${task.hardness}`;

  return (
    <button
      type="button"
      onClick={() => toggleTaskDone(task.id, todayISO)}
      className={`absolute rounded-lg px-2 py-1 overflow-hidden cursor-pointer text-left transition-opacity animate-task-fade-in ${hardnessBorderClass} ${isDone ? 'opacity-40' : 'opacity-100'}`}
      style={{
        top: `${topOffset}px`,
        height: `${Math.max(height, 20)}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
        animationDelay: `${animationIndex * 50}ms`,
        backgroundColor: isDone ? 'rgba(199, 234, 187, 0.4)' : bg,
        border: `1px solid ${isDone ? 'var(--border-light)' : border}`,
      }}
      aria-label={`${task.title}, ${formatTime(task.startTime)} to ${formatTime(endTime)}, hardness ${task.hardness}${isDone ? ', completed' : ''}`}
    >
      <span
        className={`block text-sm font-semibold truncate ${isDone ? 'line-through' : ''}`}
        style={{ color: isDone ? 'var(--text-secondary)' : textColor }}
      >
        {task.title}
      </span>
      {height >= 36 && (
        <span className="block text-xs truncate" style={{ color: isDone ? 'var(--text-secondary)' : subTextColor }}>
          {formatTime(task.startTime)} – {formatTime(endTime)}
        </span>
      )}
      {height >= 52 && (
        <span className="block text-xs mt-0.5" style={{ color: isDone ? 'var(--text-secondary)' : (h >= 3 ? 'rgba(232, 245, 189, 0.9)' : 'var(--accent)') }}>
          {stars}
        </span>
      )}
    </button>
  );
});

TaskBlock.displayName = 'TaskBlock';

export default TaskBlock;
