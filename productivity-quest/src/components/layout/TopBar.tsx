import { format } from 'date-fns';
import { getXPProgress, getLevelTitle } from '../../utils/xp';
import type { UserProfile, DayData, DailyHabit } from '../../types';

interface TopBarProps {
  profile: UserProfile;
  dayData: DayData;
  habits: DailyHabit[];
  effectiveDate: string;
  isMobile?: boolean;
}

export function TopBar({ profile, dayData, habits, effectiveDate, isMobile }: TopBarProps) {
  const xp = getXPProgress(profile.totalXP);

  const totalTasks =
    dayData.scheduledTasks.length +
    dayData.flexibleTasks.length +
    habits.length;

  const completedTasks =
    dayData.scheduledTasks.filter(t => t.completed).length +
    dayData.flexibleTasks.filter(t => t.completed).length +
    habits.filter(h => h.completionLog[effectiveDate] === true).length;

  const isPerfect = dayData.perfectDay;
  const dateLabel = format(new Date(effectiveDate + 'T12:00:00'), 'EEE, MMM d');

  return (
    <header style={{
      height: 60,
      background: '#0f172a',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 20,
      position: 'fixed',
      top: 0,
      left: isMobile ? 0 : 200,
      right: 0,
      zIndex: 100,
    }}>
      {/* Level badge */}
      <div style={{
        fontFamily: "'Orbitron', sans-serif",
        background: '#f59e0b22',
        border: '1px solid #f59e0b',
        borderRadius: 8,
        padding: '4px 12px',
        fontSize: '0.75rem',
        fontWeight: 700,
        color: '#f59e0b',
        whiteSpace: 'nowrap',
      }}>
        LVL {xp.level}
      </div>

      {/* Title */}
      <span style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap' }}>
        {getLevelTitle(xp.level)}
      </span>

      {/* XP bar */}
      <div style={{ flex: 1, minWidth: 120, maxWidth: 300 }}>
        <div style={{
          height: 8,
          background: '#1e293b',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid #334155',
        }}>
          <div style={{
            height: '100%',
            width: `${xp.percentage}%`,
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            borderRadius: 4,
            transition: 'width 0.4s ease',
            boxShadow: '0 0 8px #f59e0b66',
          }} />
        </div>
        <div style={{
          fontSize: '0.65rem',
          color: '#64748b',
          marginTop: 2,
          fontFamily: "'Orbitron', sans-serif",
          letterSpacing: '0.05em',
        }}>
          {xp.currentXP.toLocaleString()} / {xp.nextLevelXP.toLocaleString()} XP
        </div>
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Perfect day tracker */}
      {totalTasks > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: isPerfect ? '#f59e0b22' : '#1e293b',
          border: `1px solid ${isPerfect ? '#f59e0b' : '#334155'}`,
          borderRadius: 8,
          padding: '4px 12px',
          fontSize: '0.8rem',
          color: isPerfect ? '#f59e0b' : '#94a3b8',
          fontWeight: 600,
          transition: 'all 0.3s',
        }}>
          {completedTasks}/{totalTasks}
          {isPerfect && <span>⭐</span>}
        </div>
      )}

      {/* Date */}
      <div style={{
        fontSize: '0.8rem',
        color: '#94a3b8',
        whiteSpace: 'nowrap',
        fontWeight: 500,
      }}>
        {dateLabel}
      </div>
    </header>
  );
}
