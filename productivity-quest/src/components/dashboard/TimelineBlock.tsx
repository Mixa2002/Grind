import { Check } from 'lucide-react';
import { formatTime12h } from '../../utils/date';
import { DifficultyBadge } from '../shared/DifficultySelector';
import type { ScheduledTask } from '../../types';

const TIMELINE_START = 6; // 6 AM
const PX_PER_HOUR = 80;

export function getBlockTop(startTime: string): number {
  const [h, m] = startTime.split(':').map(Number);
  return (h - TIMELINE_START + m / 60) * PX_PER_HOUR;
}

export function getBlockHeight(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  const minutes = (eh * 60 + em) - (sh * 60 + sm);
  return Math.max(40, (minutes / 60) * PX_PER_HOUR);
}

interface TimelineBlockProps {
  task: ScheduledTask;
  onToggle: (id: string, pos: { x: number; y: number }) => void;
}

const DEFAULT_COLORS: Record<string, string> = {
  work: '#3b82f6',
  health: '#34d399',
  personal: '#a78bfa',
  learning: '#06b6d4',
  default: '#f59e0b',
};

export function TimelineBlock({ task, onToggle }: TimelineBlockProps) {
  const top = getBlockTop(task.startTime);
  const height = getBlockHeight(task.startTime, task.endTime);
  const baseColor = task.color ?? DEFAULT_COLORS[task.category ?? 'default'] ?? '#f59e0b';

  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onToggle(task.id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: 52,
        right: 8,
        top,
        height,
        borderRadius: 8,
        background: task.completed
          ? `${baseColor}18`
          : `${baseColor}28`,
        border: `1.5px solid ${task.completed ? baseColor + '44' : baseColor + '88'}`,
        padding: '6px 10px',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'all 0.2s',
        opacity: task.completed ? 0.6 : 1,
        boxSizing: 'border-box',
      }}
    >
      {/* Completed overlay */}
      {task.completed && (
        <div style={{
          position: 'absolute',
          top: 6, right: 8,
        }}>
          <Check size={14} color={baseColor} />
        </div>
      )}

      {/* Title */}
      <div style={{
        fontSize: '0.8rem',
        fontWeight: 600,
        color: task.completed ? '#64748b' : '#f8fafc',
        textDecoration: task.completed ? 'line-through' : 'none',
        lineHeight: 1.2,
        paddingRight: task.completed ? 18 : 0,
        whiteSpace: height < 50 ? 'nowrap' : 'normal',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {task.title}
      </div>

      {height >= 48 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          {/* Time */}
          <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>
            {formatTime12h(task.startTime)} – {formatTime12h(task.endTime)}
          </span>

          <DifficultyBadge difficulty={task.difficulty} />

          {/* XP */}
          <span style={{
            fontSize: '0.65rem',
            fontFamily: "'Orbitron', sans-serif",
            color: '#f59e0b',
            fontWeight: 700,
          }}>
            {task.xpValue} XP
          </span>

          {task.addedLate && (
            <span style={{ fontSize: '0.6rem', color: '#64748b', background: '#1e293b', borderRadius: 3, padding: '1px 4px' }}>
              Late
            </span>
          )}
        </div>
      )}
    </div>
  );
}
