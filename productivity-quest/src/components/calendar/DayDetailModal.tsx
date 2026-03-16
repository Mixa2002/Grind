import { motion } from 'framer-motion';
import { X, Clock, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { storage } from '../../utils/storage';
import { formatTime12h } from '../../utils/date';
import type { DayData, DailyHabit } from '../../types';

interface Props {
  dayStr: string;        // 'YYYY-MM-DD'
  habits: DailyHabit[];
  effectiveDate: string;
  onLateComplete: (dayStr: string, taskId: string, type: 'scheduled' | 'flexible') => void;
  onClose: () => void;
}

const isPast = (dayStr: string, effectiveDate: string) => dayStr < effectiveDate;

export function DayDetailModal({ dayStr, habits, effectiveDate, onLateComplete, onClose }: Props) {
  const dayData = storage.get<DayData>(`day_${dayStr}`);
  const isToday = dayStr === effectiveDate;
  const past = isPast(dayStr, effectiveDate);
  const label = isToday ? 'Today' : format(new Date(dayStr + 'T12:00:00'), 'EEEE, MMM d, yyyy');

  const totalTasks = (dayData?.scheduledTasks.length ?? 0) + (dayData?.flexibleTasks.length ?? 0);
  const completedTasks = (dayData?.scheduledTasks.filter(t => t.completed).length ?? 0)
    + (dayData?.flexibleTasks.filter(t => t.completed).length ?? 0);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10200,
      background: 'rgba(2,6,23,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        style={{
          width: '100%', maxWidth: 480,
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 14, overflow: 'hidden',
          maxHeight: '85vh', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>{label}</div>
            {totalTasks > 0 && (
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 2 }}>
                {completedTasks}/{totalTasks} tasks completed
                {dayData?.perfectDay && <span style={{ color: '#f59e0b', marginLeft: 6 }}>⭐ Perfect Day</span>}
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Scheduled Tasks */}
          {(dayData?.scheduledTasks.length ?? 0) > 0 && (
            <section>
              <div style={sectionLabel}>Scheduled</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dayData!.scheduledTasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: '#1e293b',
                    border: `1px solid ${task.color ?? '#334155'}22`,
                    opacity: task.completed ? 0.6 : 1,
                  }}>
                    <div style={{
                      width: 3, borderRadius: 2, alignSelf: 'stretch',
                      background: task.color ?? '#f59e0b', flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.82rem', color: '#f8fafc', fontWeight: 500,
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2, display: 'flex', gap: 8 }}>
                        <span><Clock size={10} style={{ display: 'inline', marginRight: 2 }} />
                          {formatTime12h(task.startTime)}–{formatTime12h(task.endTime)}
                        </span>
                        <span><Zap size={10} style={{ display: 'inline', marginRight: 2 }} />{task.xpValue} XP</span>
                      </div>
                    </div>
                    {task.completed && (
                      <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600 }}>✓ Done</span>
                    )}
                    {!task.completed && past && (
                      <button
                        onClick={() => onLateComplete(dayStr, task.id, 'scheduled')}
                        style={lateBtn}
                      >
                        Late (+{Math.round(task.xpValue * 0.5)} XP)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Flexible Tasks */}
          {(dayData?.flexibleTasks.length ?? 0) > 0 && (
            <section>
              <div style={sectionLabel}>Quests</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dayData!.flexibleTasks.map(task => (
                  <div key={task.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: '#1e293b', border: '1px solid #334155',
                    opacity: task.completed ? 0.6 : 1,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '0.82rem', color: '#f8fafc', fontWeight: 500,
                        textDecoration: task.completed ? 'line-through' : 'none',
                      }}>
                        {task.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b', marginTop: 2 }}>
                        <Zap size={10} style={{ display: 'inline', marginRight: 2 }} />{task.xpValue} XP
                      </div>
                    </div>
                    {task.completed && (
                      <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600 }}>✓ Done</span>
                    )}
                    {!task.completed && past && (
                      <button
                        onClick={() => onLateComplete(dayStr, task.id, 'flexible')}
                        style={lateBtn}
                      >
                        Late (+{Math.round(task.xpValue * 0.5)} XP)
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Habits */}
          {habits.length > 0 && (
            <section>
              <div style={sectionLabel}>Habits</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {habits.map(habit => {
                  const done = habit.completionLog[dayStr] === true;
                  return (
                    <div key={habit.id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      background: '#1e293b', border: '1px solid #334155',
                      opacity: done ? 0.6 : 1,
                    }}>
                      <div style={{ flex: 1, fontSize: '0.82rem', color: '#f8fafc', fontWeight: 500 }}>
                        {habit.title}
                      </div>
                      {done
                        ? <span style={{ fontSize: '0.68rem', color: '#34d399', fontWeight: 600 }}>✓ Done</span>
                        : <span style={{ fontSize: '0.68rem', color: '#ef4444' }}>✗ Missed</span>
                      }
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Empty state */}
          {!dayData && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📅</div>
              <div style={{ fontSize: '0.8rem' }}>No data for this day</div>
            </div>
          )}
          {dayData && totalTasks === 0 && habits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#334155' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>📋</div>
              <div style={{ fontSize: '0.8rem' }}>No tasks planned for this day</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: '0.62rem', color: '#64748b', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.08em',
  marginBottom: 6,
};
const lateBtn: React.CSSProperties = {
  padding: '3px 8px', background: '#f59e0b22', border: '1px solid #f59e0b44',
  borderRadius: 5, color: '#f59e0b', fontSize: '0.68rem',
  fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
};
