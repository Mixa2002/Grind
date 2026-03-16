import { useMemo } from 'react';
import { format, startOfMonth, startOfWeek, addDays, isSameMonth } from 'date-fns';
import { storage } from '../../utils/storage';
import type { DayData, DailyHabit } from '../../types';

interface Props {
  month: Date;          // any day within the desired month
  habits: DailyHabit[];
  effectiveDate: string;
  onDayClick: (dayStr: string) => void;
}

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function MonthView({ month, habits, effectiveDate, onDayClick }: Props) {
  const cells = useMemo(() => {
    const firstOfMonth = startOfMonth(month);
    const gridStart    = startOfWeek(firstOfMonth, { weekStartsOn: 1 });

    // 6 rows × 7 cols = 42 cells
    return Array.from({ length: 42 }, (_, i) => {
      const d   = addDays(gridStart, i);
      const str = format(d, 'yyyy-MM-dd');
      const inMonth = isSameMonth(d, month);
      const data: DayData | null = inMonth ? storage.get<DayData>(`day_${str}`) : null;

      const scheduled  = data?.scheduledTasks.length ?? 0;
      const flexible   = data?.flexibleTasks.length ?? 0;
      const total      = scheduled + flexible;
      const completed  = (data?.scheduledTasks.filter(t => t.completed).length ?? 0)
                       + (data?.flexibleTasks.filter(t => t.completed).length ?? 0);
      const hasHabitStreak = habits.some(h => h.currentStreak >= 3 && h.completionLog[str] === true);

      return { d, str, inMonth, data, total, completed, hasHabitStreak };
    });
  }, [month, habits]);

  // Split into rows
  const rows: typeof cells[] = [];
  for (let i = 0; i < 42; i += 7) rows.push(cells.slice(i, i + 7));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* DOW header */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
        borderBottom: '1px solid #1e293b',
      }}>
        {DOW.map(d => (
          <div key={d} style={{
            textAlign: 'center', padding: '8px 0',
            fontSize: '0.62rem', color: '#475569',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {rows.map((row, ri) => (
          <div key={ri} style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            flex: 1, borderBottom: ri < 5 ? '1px solid #1e293b' : 'none',
          }}>
            {row.map(({ d, str, inMonth, data, total, completed, hasHabitStreak }) => {
              const isToday  = str === effectiveDate;
              const isPast   = str < effectiveDate;
              const isFuture = str > effectiveDate;
              const perfect  = data?.perfectDay ?? false;
              const allDone  = total > 0 && completed === total;

              return (
                <div
                  key={str}
                  onClick={() => inMonth && onDayClick(str)}
                  style={{
                    borderRight: '1px solid #1e293b',
                    padding: '6px 7px',
                    cursor: inMonth ? 'pointer' : 'default',
                    background: isToday ? '#f59e0b08' : 'transparent',
                    transition: 'background 0.12s',
                    display: 'flex', flexDirection: 'column', gap: 3,
                    overflow: 'hidden',
                    opacity: inMonth ? 1 : 0.2,
                    minHeight: 0,
                  }}
                  onMouseEnter={e => { if (inMonth) (e.currentTarget as HTMLElement).style.background = '#1e293b'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isToday ? '#f59e0b08' : 'transparent'; }}
                >
                  {/* Day number */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: isToday ? 700 : 400,
                      background: isToday ? '#f59e0b' : 'transparent',
                      color: isToday ? '#020617' : isFuture ? '#475569' : inMonth ? '#94a3b8' : '#334155',
                      flexShrink: 0,
                    }}>
                      {format(d, 'd')}
                    </span>

                    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      {perfect && <span title="Perfect day" style={{ fontSize: '0.7rem' }}>⭐</span>}
                      {hasHabitStreak && !perfect && <span title="Streak active" style={{ fontSize: '0.7rem' }}>🔥</span>}
                    </div>
                  </div>

                  {/* Task dots */}
                  {total > 0 && (
                    <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {Array.from({ length: Math.min(total, 8) }, (_, i) => (
                        <div key={i} style={{
                          width: 5, height: 5, borderRadius: '50%',
                          background: i < completed
                            ? (allDone ? '#34d399' : '#f59e0b')
                            : (isPast ? '#ef444488' : '#334155'),
                        }} />
                      ))}
                      {total > 8 && (
                        <span style={{ fontSize: '0.55rem', color: '#475569', lineHeight: '5px' }}>+{total - 8}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
