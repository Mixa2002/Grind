import { useMemo } from 'react';
import { format, subDays } from 'date-fns';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { storage } from '../utils/storage';
import { getLevelTitle } from '../utils/xp';
import { AchievementsGrid } from '../components/stats/AchievementsGrid';
import type { AppState } from '../hooks/useAppState';
import type { DayData } from '../types';

interface Props {
  state: AppState;
  isMobile?: boolean;
}

const CHART_STYLE = {
  background: '#1e293b', border: '1px solid #334155', borderRadius: 8,
  padding: '2px 8px', fontSize: '0.72rem', color: '#f8fafc',
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={CHART_STYLE}>
      <div style={{ color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: {p.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

export function StatsPage({ state, isMobile }: Props) {
  const { profile, habits, effectiveDate } = state;

  // ── Last 30 days XP data ──────────────────────────────────────────────────
  const xpData = useMemo(() => {
    const today = new Date(effectiveDate + 'T12:00:00');
    return Array.from({ length: 30 }, (_, i) => {
      const d = format(subDays(today, 29 - i), 'yyyy-MM-dd');
      const entry = profile.xpHistory.find(h => h.date === d);
      return {
        date: format(new Date(d + 'T12:00:00'), 'EEE d'),
        gained: entry?.gained ?? 0,
        lost:   entry?.lost   ?? 0,
        net:    (entry?.gained ?? 0) - (entry?.lost ?? 0),
      };
    });
  }, [profile.xpHistory, effectiveDate]);

  // ── Last 14 days task counts ──────────────────────────────────────────────
  const taskData = useMemo(() => {
    const today = new Date(effectiveDate + 'T12:00:00');
    return Array.from({ length: 14 }, (_, i) => {
      const d    = format(subDays(today, 13 - i), 'yyyy-MM-dd');
      const day  = storage.get<DayData>(`day_${d}`);
      const habitsDone = habits.filter(h => h.completionLog[d] === true).length;
      return {
        date:      format(new Date(d + 'T12:00:00'), 'EEE d'),
        scheduled: day?.scheduledTasks.filter(t => t.completed).length ?? 0,
        flexible:  day?.flexibleTasks.filter(t => t.completed).length  ?? 0,
        habits:    habitsDone,
      };
    });
  }, [habits, effectiveDate]);

  // ── Best streak ───────────────────────────────────────────────────────────
  const bestHabit = habits.reduce<typeof habits[0] | null>((best, h) => (
    !best || h.longestStreak > best.longestStreak ? h : best
  ), null);

  // ── Active streaks sorted ─────────────────────────────────────────────────
  const sortedHabits = [...habits].sort((a, b) => b.currentStreak - a.currentStreak);

  const nextMilestone = (streak: number) => {
    const milestones = [7, 30, 100, 365];
    const next = milestones.find(m => m > streak);
    return next ? `${next - streak}d to ${next}🔥` : 'MAX 🏆';
  };

  const hasAnyData = profile.xpHistory.some(h => h.gained > 0 || h.lost > 0);

  return (
    <div style={{
      marginLeft: isMobile ? 0 : 200,
      marginTop: 60,
      height: isMobile ? 'calc(100vh - 60px - 56px)' : 'calc(100vh - 60px)',
      overflowY: 'auto',
      padding: '20px',
      display: 'flex', flexDirection: 'column', gap: 20,
    }}>
      {/* ── Stats Cards ─── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 12,
      }}>
        {[
          { label: 'Total XP', value: profile.totalXP.toLocaleString(), sub: getLevelTitle(profile.level), color: '#f59e0b' },
          { label: 'Tasks Done', value: profile.totalTasksCompleted.toLocaleString(), sub: 'all time', color: '#34d399' },
          { label: 'Level', value: String(profile.level), sub: getLevelTitle(profile.level), color: '#a78bfa' },
          { label: 'Best Streak', value: bestHabit ? String(bestHabit.longestStreak) : '0', sub: bestHabit?.title ?? 'No habits yet', color: '#f97316' },
          { label: 'Perfect Days', value: String(profile.perfectDays ?? 0), sub: `${profile.consecutivePerfectDays ?? 0} in a row`, color: '#fbbf24' },
          { label: 'Achievements', value: String(profile.achievements.length), sub: `/ 16 unlocked`, color: '#06b6d4' },
        ].map(card => (
          <div key={card.label} style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 12, padding: '16px',
          }}>
            <div style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {card.label}
            </div>
            <div style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '1.8rem', fontWeight: 900,
              color: card.color, marginTop: 4, lineHeight: 1,
            }}>
              {card.value}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {!hasAnyData ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexDirection: 'column', gap: 12, color: '#334155',
        }}>
          <div style={{ fontSize: '3rem' }}>📊</div>
          <div style={{ fontSize: '0.9rem', color: '#475569' }}>
            Complete your first day to see stats here.
          </div>
        </div>
      ) : (
        <>
          {/* ── XP Over Time ── */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px' }}>
            <div style={sectionTitle}>XP Over Time (30 days)</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={xpData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gainGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="lossGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false}
                  interval={4} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v: string) => <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{v}</span>} />
                <Area type="monotone" dataKey="gained" name="XP Gained" stroke="#34d399" fill="url(#gainGrad)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="lost"   name="XP Lost"   stroke="#f43f5e" fill="url(#lossGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* ── Task Bar Chart ── */}
          <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px 20px' }}>
            <div style={sectionTitle}>Tasks Completed (14 days)</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={taskData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#475569', fontSize: 10 }} axisLine={false} tickLine={false} width={30} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8}
                  formatter={(v: string) => <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{v}</span>} />
                <Bar dataKey="scheduled" name="Scheduled" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="flexible"  name="Quests"     stackId="a" fill="#a78bfa" radius={[0, 0, 0, 0]} />
                <Bar dataKey="habits"    name="Habits"     stackId="a" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* ── Two column: Streaks + Achievements ── */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr', gap: 16, alignItems: 'start' }}>
            {/* Streaks */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px' }}>
              <div style={sectionTitle}>Active Streaks</div>
              {sortedHabits.length === 0 ? (
                <div style={{ color: '#334155', fontSize: '0.78rem', textAlign: 'center', padding: '20px 0' }}>
                  Add habits to track streaks.
                </div>
              ) : (
                sortedHabits.map(h => {
                  const streak = h.currentStreak;
                  const size   = streak >= 30 ? 18 : streak >= 7 ? 15 : 12;
                  return (
                    <div key={h.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 0', borderBottom: '1px solid #1e293b11',
                      opacity: streak === 0 ? 0.45 : 1,
                    }}>
                      <span style={{ fontSize: size, lineHeight: 1 }}>🔥</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.8rem', color: '#f8fafc', fontWeight: 500,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {h.title}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#475569' }}>{nextMilestone(streak)}</div>
                      </div>
                      <div style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontSize: '0.85rem', fontWeight: 700,
                        color: streak >= 30 ? '#f59e0b' : streak >= 7 ? '#f97316' : '#64748b',
                      }}>
                        {streak}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Achievements */}
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '16px' }}>
              <div style={sectionTitle}>Achievements ({profile.achievements.length}/16)</div>
              <AchievementsGrid profile={profile} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const sectionTitle: React.CSSProperties = {
  fontSize: '0.72rem', color: '#64748b',
  fontWeight: 700, textTransform: 'uppercase',
  letterSpacing: '0.08em', marginBottom: 12,
};
