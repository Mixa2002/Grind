import { useMemo } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { storage } from '../../utils/storage';
import type { DayData } from '../../types';

const HOUR_HEIGHT = 56; // px per hour
const START_HOUR  = 6;  // 6 AM
const END_HOUR    = 23; // 11 PM
const HOURS       = END_HOUR - START_HOUR;

function timeToFraction(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h + m / 60;
}

function getTop(startTime: string): number {
  return (timeToFraction(startTime) - START_HOUR) * HOUR_HEIGHT;
}

function getHeight(startTime: string, endTime: string): number {
  return Math.max(18, (timeToFraction(endTime) - timeToFraction(startTime)) * HOUR_HEIGHT);
}

interface Props {
  weekStart: Date;      // Monday (or Sunday)
  effectiveDate: string;
  onDayClick: (dayStr: string) => void;
}

export function WeekView({ weekStart, effectiveDate, onDayClick }: Props) {
  const days = useMemo(() =>
    Array.from({ length: 7 }, (_, i) => {
      const d   = addDays(weekStart, i);
      const str = format(d, 'yyyy-MM-dd');
      const data = storage.get<DayData>(`day_${str}`);
      return { d, str, data };
    }),
  [weekStart]);

  const hours = Array.from({ length: HOURS }, (_, i) => START_HOUR + i);

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
      {/* Time gutter */}
      <div style={{
        width: 44, flexShrink: 0,
        borderRight: '1px solid #1e293b',
        paddingTop: 36, // header height
        overflowY: 'hidden',
        userSelect: 'none',
      }}>
        {hours.map(h => (
          <div key={h} style={{
            height: HOUR_HEIGHT, display: 'flex', alignItems: 'flex-start',
            paddingTop: 4, paddingRight: 6,
            justifyContent: 'flex-end',
            fontSize: '0.6rem', color: '#475569',
          }}>
            {h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`}
          </div>
        ))}
      </div>

      {/* Day columns */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex' }}>
        {days.map(({ d, str, data }) => {
          const isToday  = str === effectiveDate;
          const isFuture = str > effectiveDate;
          const label    = format(d, 'EEE');
          const dayNum   = format(d, 'd');

          return (
            <div
              key={str}
              onClick={() => onDayClick(str)}
              style={{
                flex: 1, minWidth: 0,
                borderRight: '1px solid #1e293b',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {/* Day header */}
              <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                height: 36, background: '#0a1628',
                borderBottom: '1px solid #1e293b',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 1,
              }}>
                <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase' }}>{label}</div>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: isToday ? '#f59e0b' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: isToday ? 700 : 400,
                  color: isToday ? '#020617' : isFuture ? '#475569' : '#94a3b8',
                }}>
                  {dayNum}
                </div>
              </div>

              {/* Hour grid lines */}
              <div style={{ position: 'relative', height: HOURS * HOUR_HEIGHT }}>
                {hours.map(h => (
                  <div key={h} style={{
                    position: 'absolute', left: 0, right: 0,
                    top: (h - START_HOUR) * HOUR_HEIGHT,
                    borderTop: '1px solid #1e293b11',
                    pointerEvents: 'none',
                  }} />
                ))}

                {/* Half-hour lines */}
                {hours.map(h => (
                  <div key={`${h}.5`} style={{
                    position: 'absolute', left: 0, right: 0,
                    top: (h - START_HOUR + 0.5) * HOUR_HEIGHT,
                    borderTop: '1px dashed #1e293b22',
                    pointerEvents: 'none',
                  }} />
                ))}

                {/* Task blocks */}
                {(data?.scheduledTasks ?? []).map(task => {
                  const top    = getTop(task.startTime);
                  const height = getHeight(task.startTime, task.endTime);
                  if (top < 0 || top > HOURS * HOUR_HEIGHT) return null;
                  return (
                    <div
                      key={task.id}
                      title={`${task.title} (${task.startTime}–${task.endTime})`}
                      style={{
                        position: 'absolute', left: 2, right: 2,
                        top, height,
                        background: `${task.color ?? '#f59e0b'}22`,
                        borderLeft: `3px solid ${task.color ?? '#f59e0b'}`,
                        borderRadius: 4,
                        padding: '2px 4px',
                        overflow: 'hidden',
                        pointerEvents: 'none',
                        opacity: task.completed ? 0.45 : 1,
                      }}
                    >
                      <div style={{
                        fontSize: '0.62rem', color: task.color ?? '#f59e0b',
                        fontWeight: 600, lineHeight: 1.2,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {task.title}
                      </div>
                    </div>
                  );
                })}

                {/* Current time line — only on today */}
                {isToday && <CurrentTimeLine />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CurrentTimeLine() {
  const now = new Date();
  const fraction = now.getHours() + now.getMinutes() / 60;
  const top = (fraction - START_HOUR) * HOUR_HEIGHT;
  if (top < 0 || top > HOURS * HOUR_HEIGHT) return null;
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, top,
      height: 2, background: '#f59e0b',
      zIndex: 5, pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute', left: -4, top: -4,
        width: 8, height: 8, borderRadius: '50%', background: '#f59e0b',
      }} />
    </div>
  );
}

export function getWeekStart(date: Date): Date {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday
}
