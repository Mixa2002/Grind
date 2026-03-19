import { useEffect, useRef, useState, useMemo } from 'react';
import type { Task } from '../types';
import { formatTime } from '../utils';
import TaskBlock from './TaskBlock.tsx';

const GRID_START = 360; // 6:00 AM in minutes
const GRID_END = 1320; // 10:00 PM in minutes
const PIXELS_PER_MINUTE = 1.5;
const HOUR_LABEL_WIDTH = 56; // px reserved for hour labels

function computeOverlapColumns(tasks: Task[]): Map<string, { col: number; total: number }> {
  if (tasks.length === 0) return new Map();

  const sorted = [...tasks].sort((a, b) => a.startTime - b.startTime);

  // Build overlap groups: tasks that all share overlapping time
  const groups: Task[][] = [];
  let currentGroup: Task[] = [sorted[0]];
  let groupEnd = sorted[0].startTime + sorted[0].duration;

  for (let i = 1; i < sorted.length; i++) {
    const t = sorted[i];
    if (t.startTime < groupEnd) {
      currentGroup.push(t);
      groupEnd = Math.max(groupEnd, t.startTime + t.duration);
    } else {
      groups.push(currentGroup);
      currentGroup = [t];
      groupEnd = t.startTime + t.duration;
    }
  }
  groups.push(currentGroup);

  const result = new Map<string, { col: number; total: number }>();

  for (const group of groups) {
    // Greedily assign columns within the group
    const columns: number[] = [];
    const endTimes: number[] = [];

    for (const task of group) {
      let placed = false;
      for (let c = 0; c < columns.length; c++) {
        if (task.startTime >= endTimes[c]) {
          columns[c] = c;
          endTimes[c] = task.startTime + task.duration;
          result.set(task.id, { col: c, total: 0 });
          placed = true;
          break;
        }
      }
      if (!placed) {
        const col = columns.length;
        columns.push(col);
        endTimes.push(task.startTime + task.duration);
        result.set(task.id, { col, total: 0 });
      }
    }

    const totalCols = columns.length;
    for (const task of group) {
      const entry = result.get(task.id);
      if (entry) entry.total = totalCols;
    }
  }

  return result;
}

interface TimeGridProps {
  tasks: Task[];
}

export default function TimeGrid({ tasks }: TimeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentMinute, setCurrentMinute] = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });

  // Auto-scroll to current time on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const targetMinute = Math.max(nowMinutes - 60, GRID_START);
    const scrollTop = (targetMinute - GRID_START) * PIXELS_PER_MINUTE;
    el.scrollTo({ top: scrollTop, behavior: 'smooth' });
  }, []);

  // Update current time line every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setCurrentMinute(now.getHours() * 60 + now.getMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const totalHeight = (GRID_END - GRID_START) * PIXELS_PER_MINUTE;
  const hours = useMemo(() => {
    const h: number[] = [];
    for (let m = GRID_START; m < GRID_END; m += 60) {
      h.push(m);
    }
    return h;
  }, []);

  const overlapMap = useMemo(() => computeOverlapColumns(tasks), [tasks]);

  const showTimeLine = currentMinute >= GRID_START && currentMinute <= GRID_END;
  const timeLineTop = (currentMinute - GRID_START) * PIXELS_PER_MINUTE;

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto overscroll-contain"
      role="region"
      aria-label="Day schedule time grid"
    >
      <div className="relative" style={{ height: `${totalHeight}px` }}>
        {/* Hour lines and labels */}
        {hours.map((minute) => {
          const top = (minute - GRID_START) * PIXELS_PER_MINUTE;
          return (
            <div key={minute} className="absolute left-0 right-0" style={{ top: `${top}px` }}>
              <span
                className="absolute text-xs text-gray-500 select-none"
                style={{ width: `${HOUR_LABEL_WIDTH}px`, left: 0 }}
              >
                {formatTime(minute)}
              </span>
              <div
                className="absolute border-t border-gray-800/60"
                style={{ left: `${HOUR_LABEL_WIDTH}px`, right: 0 }}
              />
            </div>
          );
        })}

        {/* Task blocks */}
        <div
          className="absolute top-0 bottom-0"
          style={{ left: `${HOUR_LABEL_WIDTH}px`, right: 0 }}
        >
          {tasks.map((task, index) => {
            const layout = overlapMap.get(task.id) ?? { col: 0, total: 1 };
            return (
              <TaskBlock
                key={task.id}
                task={task}
                pixelsPerMinute={PIXELS_PER_MINUTE}
                gridStartMinute={GRID_START}
                gridEndMinute={GRID_END}
                columnIndex={layout.col}
                totalColumns={layout.total}
                animationIndex={index}
              />
            );
          })}
        </div>

        {/* Current time line */}
        {showTimeLine && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none"
            style={{ top: `${timeLineTop}px` }}
          >
            <div className="flex items-center">
              <div
                className="rounded-full bg-red-500"
                style={{ width: 6, height: 6, marginLeft: `${HOUR_LABEL_WIDTH - 3}px` }}
              />
              <div className="flex-1 h-px bg-red-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
