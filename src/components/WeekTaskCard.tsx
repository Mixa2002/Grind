import { memo, useCallback } from 'react';
import type { Task } from '../types';
import { formatTime } from '../utils';
import { useStore } from '../stores/useStore';

interface WeekTaskCardProps {
  task: Task;
  dateISO: string;
}

const WeekTaskCard = memo<WeekTaskCardProps>(function WeekTaskCard({ task, dateISO }) {
  const toggleTaskDone = useStore((s) => s.toggleTaskDone);
  const deleteTask = useStore((s) => s.deleteTask);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    deleteTask(task.id).catch(() => {
      // Swallow errors if component unmounts during deletion
    });
  }, [deleteTask, task.id]);

  const isDone = task.completions[dateISO] === true;
  const hardnessBorderClass = `hardness-border-${task.hardness}`;

  const durationLabel = `${task.duration} min`;

  return (
    <div
      className={`group relative rounded-lg border px-2.5 py-2 mb-1.5 text-left hover-lift ${hardnessBorderClass} ${
        isDone ? 'opacity-50' : 'opacity-100'
      }`}
      style={
        isDone
          ? { backgroundColor: 'rgba(199, 234, 187, 0.3)', borderColor: 'var(--border-light)' }
          : { backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-light)' }
      }
    >
      {/* Delete button */}
      <button
        type="button"
        onClick={handleDelete}
        className="absolute top-1 right-1 w-5 h-5 rounded-full text-xs items-center justify-center hidden group-hover:flex transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.08)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.backgroundColor = 'transparent'; }}
        aria-label={`Delete ${task.title}`}
      >
        &times;
      </button>

      {/* Clickable area for toggling done */}
      <button
        type="button"
        onClick={() => toggleTaskDone(task.id, dateISO)}
        className="w-full text-left"
        aria-label={`${task.title}, ${formatTime(task.startTime)}, ${isDone ? 'completed' : 'not completed'}`}
      >
        {/* Time */}
        <span className="block text-[11px] leading-tight" style={{ color: 'var(--text-secondary)' }}>
          {formatTime(task.startTime)}
        </span>

        {/* Title */}
        <span
          className={`block text-sm font-medium truncate leading-snug ${
            isDone ? 'line-through' : ''
          }`}
          style={{ color: 'var(--text-primary)' }}
        >
          {task.title}
        </span>

        {/* Duration + Hardness row */}
        <span className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{durationLabel}</span>
          <span className="text-[10px] font-semibold leading-none" style={{ color: 'var(--accent)' }}>Lv.{task.hardness}</span>
        </span>

        {/* Repeatable badge */}
        {task.repeatable && (
          <span
            className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded leading-none"
            style={{ backgroundColor: 'rgba(132, 177, 121, 0.15)', color: 'var(--accent)', borderWidth: '1px', borderColor: 'rgba(132, 177, 121, 0.25)' }}
          >
            repeat
          </span>
        )}
      </button>
    </div>
  );
});

WeekTaskCard.displayName = 'WeekTaskCard';

export default WeekTaskCard;
