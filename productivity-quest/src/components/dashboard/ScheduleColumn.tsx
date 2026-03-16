import { useState, useEffect, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { TimelineBlock, getBlockTop } from './TimelineBlock';
import { DifficultySelector } from '../shared/DifficultySelector';
import { calcScheduledTaskXP } from '../../utils/xp';
import type { Difficulty } from '../../types';
import type { AppState } from '../../hooks/useAppState';

const TIMELINE_START = 6;
const TIMELINE_END = 24;
const PX_PER_HOUR = 80;
const TOTAL_HEIGHT = (TIMELINE_END - TIMELINE_START) * PX_PER_HOUR;

const HOURS = Array.from({ length: TIMELINE_END - TIMELINE_START }, (_, i) => TIMELINE_START + i);

const TASK_COLORS = [
  { label: 'Amber', value: '#f59e0b' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#34d399' },
  { label: 'Purple', value: '#a78bfa' },
  { label: 'Rose', value: '#f43f5e' },
  { label: 'Cyan', value: '#06b6d4' },
];

interface Props {
  state: Pick<AppState, 'dayData' | 'profile' | 'effectiveDate' | 'addScheduledTask' | 'toggleScheduledTask' | 'deleteScheduledTask'>;
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function getCurrentTimePx(): number | null {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  if (h < TIMELINE_START || h >= TIMELINE_END) return null;
  return (h - TIMELINE_START + m / 60) * PX_PER_HOUR;
}

const defaultForm = {
  title: '',
  startTime: '09:00',
  endTime: '10:00',
  difficulty: 2 as Difficulty,
  color: '#f59e0b',
};

export function ScheduleColumn({ state }: Props) {
  const { dayData, profile, effectiveDate, addScheduledTask, toggleScheduledTask } = state;
  const [timePx, setTimePx] = useState<number | null>(getCurrentTimePx);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setTimePx(getCurrentTimePx()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Scroll to current time on mount
  useEffect(() => {
    if (scrollRef.current && timePx !== null) {
      scrollRef.current.scrollTop = Math.max(0, timePx - 120);
    }
  }, []);

  const isLate = profile.lastPlannedDate === effectiveDate;
  const xpPreview = calcScheduledTaskXP(form.difficulty, form.startTime, form.endTime, isLate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || form.endTime <= form.startTime) return;
    addScheduledTask({
      title: form.title.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      difficulty: form.difficulty,
      color: form.color,
    });
    setForm(defaultForm);
    setShowForm(false);
  };

  // Sort: incomplete first, then by start time
  const sorted = [...dayData.scheduledTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Schedule</h2>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>
            {dayData.scheduledTasks.filter(t => t.completed).length}/{dayData.scheduledTasks.length} done
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid #334155',
            background: showForm ? '#f59e0b22' : 'transparent',
            color: showForm ? '#f59e0b' : '#64748b',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{
          padding: '12px 14px',
          borderBottom: '1px solid #1e293b',
          background: '#0f172a',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          <input
            autoFocus
            type="text"
            placeholder="Task title..."
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            style={inputStyle}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Start</label>
              <input
                type="time"
                value={form.startTime}
                onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>End</label>
              <input
                type="time"
                value={form.endTime}
                onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Difficulty</label>
            <DifficultySelector
              value={form.difficulty}
              onChange={d => setForm(f => ({ ...f, difficulty: d }))}
              size="sm"
            />
          </div>
          <div>
            <label style={labelStyle}>Color</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {TASK_COLORS.map(c => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c.value }))}
                  style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: c.value,
                    border: form.color === c.value ? `2px solid #fff` : '2px solid transparent',
                    cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontFamily: "'Orbitron', sans-serif", fontWeight: 700 }}>
              {xpPreview} XP{isLate ? ' (Late 75%)' : ''}
            </span>
            <button
              type="submit"
              disabled={!form.title.trim() || form.endTime <= form.startTime}
              style={{
                padding: '5px 14px',
                borderRadius: 6,
                border: 'none',
                background: '#f59e0b',
                color: '#020617',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: !form.title.trim() || form.endTime <= form.startTime ? 0.4 : 1,
              }}
            >
              Add
            </button>
          </div>
          {isLate && (
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>
              ⚠ Added after planning — 75% XP
            </p>
          )}
        </form>
      )}

      {/* Timeline scroll area */}
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', position: 'relative' }}>
        <div style={{ position: 'relative', height: TOTAL_HEIGHT, margin: '0 0 0 0' }}>
          {/* Hour grid lines */}
          {HOURS.map(h => (
            <div key={h} style={{
              position: 'absolute',
              top: (h - TIMELINE_START) * PX_PER_HOUR,
              left: 0, right: 0,
              display: 'flex',
              alignItems: 'flex-start',
              pointerEvents: 'none',
            }}>
              <span style={{
                width: 44,
                textAlign: 'right',
                fontSize: '0.6rem',
                color: '#334155',
                paddingRight: 6,
                paddingTop: 2,
                flexShrink: 0,
              }}>
                {formatHour(h)}
              </span>
              <div style={{
                flex: 1,
                height: '1px',
                background: '#1e293b',
                marginTop: 6,
              }} />
            </div>
          ))}

          {/* Current time indicator */}
          {timePx !== null && (
            <div style={{
              position: 'absolute',
              top: timePx,
              left: 52,
              right: 8,
              height: 2,
              background: '#f59e0b',
              boxShadow: '0 0 6px #f59e0b',
              pointerEvents: 'none',
              zIndex: 10,
            }}>
              <div style={{
                position: 'absolute',
                left: -5,
                top: -4,
                width: 10, height: 10,
                borderRadius: '50%',
                background: '#f59e0b',
                boxShadow: '0 0 8px #f59e0b',
              }} />
            </div>
          )}

          {/* Task blocks */}
          {sorted.map(task => (
            <TimelineBlock
              key={task.id}
              task={task}
              onToggle={(id, pos) => toggleScheduledTask(id, pos)}
            />
          ))}

          {/* Empty state */}
          {dayData.scheduledTasks.length === 0 && (
            <div style={{
              position: 'absolute',
              top: getBlockTop('09:00') + 10,
              left: 52, right: 8,
              textAlign: 'center',
              color: '#334155',
              fontSize: '0.75rem',
            }}>
              No tasks scheduled
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '6px 10px',
  background: '#1e293b',
  border: '1px solid #334155',
  borderRadius: 6,
  color: '#f8fafc',
  fontSize: '0.8rem',
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.65rem',
  color: '#64748b',
  marginBottom: 4,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
};
