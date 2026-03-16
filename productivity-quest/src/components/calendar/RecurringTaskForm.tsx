import { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { DifficultySelector } from '../shared/DifficultySelector';
import { calcScheduledTaskXP } from '../../utils/xp';
import { getNextEffectiveDate, shouldTemplateFireOnDate } from '../../utils/date';
import type { RecurringTemplate, Difficulty } from '../../types';

const COLORS = [
  '#f59e0b', '#3b82f6', '#34d399', '#a78bfa',
  '#f43f5e', '#06b6d4', '#f97316', '#84cc16',
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getNextOccurrences(
  recurrence: RecurringTemplate['recurrence'],
  createdAt: string,
  count = 5,
): string[] {
  const results: string[] = [];
  let current = format(new Date(), 'yyyy-MM-dd');
  const stub = { recurrence, createdAt };
  for (let i = 0; i < 400 && results.length < count; i++) {
    if (shouldTemplateFireOnDate(stub, current)) results.push(current);
    current = getNextEffectiveDate(current);
  }
  return results;
}

interface Props {
  initial?: RecurringTemplate | null;
  onSave: (t: RecurringTemplate) => void;
  onClose: () => void;
}

export function RecurringTaskForm({ initial, onSave, onClose }: Props) {
  const isEdit = !!initial;

  const [title,    setTitle]    = useState(initial?.title    ?? '');
  const [start,    setStart]    = useState(initial?.startTime ?? '09:00');
  const [end,      setEnd]      = useState(initial?.endTime   ?? '10:00');
  const [diff,     setDiff]     = useState<Difficulty>(initial?.difficulty ?? 2);
  const [color,    setColor]    = useState(initial?.color    ?? '#f59e0b');
  const [rType,    setRType]    = useState<RecurringTemplate['recurrence']['type']>(
    initial?.recurrence.type ?? 'weekly'
  );
  const [weekDays, setWeekDays] = useState<number[]>(initial?.recurrence.daysOfWeek ?? [1]);
  const [interval, setInterval] = useState(initial?.recurrence.interval ?? 2);
  const [dayOfMon, setDayOfMon] = useState(initial?.recurrence.dayOfMonth ?? 1);

  const recurrence: RecurringTemplate['recurrence'] = {
    type: rType,
    ...(rType === 'weekly'  ? { daysOfWeek: weekDays } : {}),
    ...(rType === 'everyN'  ? { interval }              : {}),
    ...(rType === 'monthly' ? { dayOfMonth: dayOfMon }  : {}),
  };

  const createdAt = initial?.createdAt ?? new Date().toISOString();
  const xpPreview = calcScheduledTaskXP(diff, start, end, false);
  const previews  = getNextOccurrences(recurrence, createdAt);

  const canSave = title.trim() && end > start &&
    (rType !== 'weekly' || weekDays.length > 0);

  const handleSave = () => {
    if (!canSave) return;
    const template: RecurringTemplate = {
      id:         initial?.id ?? crypto.randomUUID(),
      title:      title.trim(),
      startTime:  start,
      endTime:    end,
      difficulty: diff,
      color,
      recurrence,
      active:     initial?.active ?? true,
      createdAt,
    };
    onSave(template);
    onClose();
  };

  const toggleWeekDay = (d: number) => {
    setWeekDays(prev =>
      prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]
    );
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10100,
      background: 'rgba(2,6,23,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.22 }}
        style={{
          width: '100%', maxWidth: 500,
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 14, overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
            {isEdit ? 'Edit Recurring Task' : 'New Recurring Task'}
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '80vh', overflowY: 'auto' }}>
          {/* Title */}
          <div>
            <label style={lbl}>Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Task title..."
              style={inp}
            />
          </div>

          {/* Times */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Start</label>
              <input type="time" value={start} onChange={e => setStart(e.target.value)} style={inp} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>End</label>
              <input type="time" value={end} onChange={e => setEnd(e.target.value)} style={inp} />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label style={lbl}>Difficulty</label>
            <DifficultySelector value={diff} onChange={setDiff} />
          </div>

          {/* Color */}
          <div>
            <label style={lbl}>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map(c => (
                <button
                  key={c} type="button" onClick={() => setColor(c)}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: c,
                    border: color === c ? '3px solid #fff' : '2px solid transparent', cursor: 'pointer',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recurrence type */}
          <div>
            <label style={lbl}>Recurrence</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['daily', 'weekly', 'everyN', 'monthly'] as const).map(t => (
                <button
                  key={t} type="button" onClick={() => setRType(t)}
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: '0.72rem', fontWeight: 600,
                    border: `1.5px solid ${rType === t ? '#f59e0b' : '#334155'}`,
                    background: rType === t ? '#f59e0b22' : 'transparent',
                    color: rType === t ? '#f59e0b' : '#64748b', cursor: 'pointer',
                  }}
                >
                  {t === 'everyN' ? 'Every N' : t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Recurrence detail */}
          {rType === 'weekly' && (
            <div>
              <label style={lbl}>Days of week</label>
              <div style={{ display: 'flex', gap: 5 }}>
                {DAYS.map((d, i) => (
                  <button
                    key={i} type="button" onClick={() => toggleWeekDay(i)}
                    style={{
                      width: 34, height: 28, borderRadius: 6, fontSize: '0.68rem', fontWeight: 700,
                      border: `1.5px solid ${weekDays.includes(i) ? '#f59e0b' : '#334155'}`,
                      background: weekDays.includes(i) ? '#f59e0b22' : 'transparent',
                      color: weekDays.includes(i) ? '#f59e0b' : '#64748b', cursor: 'pointer',
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {rType === 'everyN' && (
            <div>
              <label style={lbl}>Every N days</label>
              <input
                type="number" min={2} max={365} value={interval}
                onChange={e => setInterval(Math.max(2, parseInt(e.target.value) || 2))}
                style={{ ...inp, width: 100 }}
              />
            </div>
          )}

          {rType === 'monthly' && (
            <div>
              <label style={lbl}>Day of month</label>
              <input
                type="number" min={1} max={31} value={dayOfMon}
                onChange={e => setDayOfMon(Math.min(31, Math.max(1, parseInt(e.target.value) || 1)))}
                style={{ ...inp, width: 100 }}
              />
            </div>
          )}

          {/* XP preview */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            background: '#1e293b', borderRadius: 8, padding: '10px 14px',
          }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>XP per occurrence</span>
            <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b' }}>
              {xpPreview} XP
            </span>
          </div>

          {/* Next occurrences */}
          {previews.length > 0 && (
            <div>
              <label style={lbl}>Next occurrences</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {previews.map(d => (
                  <span key={d} style={{
                    background: '#1e293b', border: '1px solid #334155', borderRadius: 6,
                    padding: '3px 8px', fontSize: '0.72rem', color: '#94a3b8',
                  }}>
                    {format(new Date(d + 'T12:00:00'), 'EEE MMM d')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid #1e293b',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button onClick={onClose} style={cancelBtn}>Cancel</button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{ ...saveBtn, opacity: canSave ? 1 : 0.4 }}
          >
            {isEdit ? 'Save Changes' : 'Create Template'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const lbl: React.CSSProperties = {
  display: 'block', fontSize: '0.62rem', color: '#64748b',
  marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em',
};
const inp: React.CSSProperties = {
  width: '100%', padding: '7px 10px', background: '#1e293b',
  border: '1px solid #334155', borderRadius: 6, color: '#f8fafc',
  fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
};
const cancelBtn: React.CSSProperties = {
  padding: '7px 16px', background: 'transparent', border: '1px solid #334155',
  borderRadius: 7, color: '#64748b', fontSize: '0.8rem', cursor: 'pointer',
};
const saveBtn: React.CSSProperties = {
  padding: '7px 18px', background: '#f59e0b', border: 'none',
  borderRadius: 7, color: '#020617', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
};
