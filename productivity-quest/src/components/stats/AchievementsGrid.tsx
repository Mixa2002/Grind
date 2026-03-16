import { ACHIEVEMENTS } from '../../utils/achievements';
import type { UserProfile } from '../../types';

// Lucide icon map — emoji fallback kept intentionally simple
const ICON_MAP: Record<string, string> = {
  Footprints: '👣', Target: '🎯', Swords: '⚔️', Hammer: '🔨', Gem: '💎',
  Flame: '🔥', FlameKindling: '🪵', Zap: '⚡', Crown: '👑',
  Star: '⭐', Trophy: '🏆', TrendingUp: '📈', Shield: '🛡️',
  Award: '🥇', Sunrise: '🌅', Skull: '💀',
};

interface Props {
  profile: UserProfile;
}

export function AchievementsGrid({ profile }: Props) {
  const earned   = ACHIEVEMENTS.filter(a => profile.achievements.includes(a.id));
  const locked   = ACHIEVEMENTS.filter(a => !profile.achievements.includes(a.id));
  const sorted   = [...earned.reverse(), ...locked];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
      gap: 10,
    }}>
      {sorted.map(a => {
        const isEarned = profile.achievements.includes(a.id);
        const icon = ICON_MAP[a.icon] ?? '🏅';
        return (
          <div
            key={a.id}
            style={{
              background: isEarned ? '#1e293b' : '#0f1729',
              border: `1px solid ${isEarned ? '#f59e0b44' : '#1e293b'}`,
              borderRadius: 10,
              padding: '14px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 6, textAlign: 'center',
              opacity: isEarned ? 1 : 0.55,
              transition: 'all 0.2s',
              position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Glow for earned */}
            {isEarned && (
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse at 50% 0%, #f59e0b08, transparent 70%)',
                pointerEvents: 'none',
              }} />
            )}

            <div style={{ fontSize: isEarned ? '2rem' : '1.6rem', filter: isEarned ? 'none' : 'grayscale(1)' }}>
              {isEarned ? icon : '🔒'}
            </div>

            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isEarned ? '#f8fafc' : '#475569' }}>
              {a.title}
            </div>

            <div style={{ fontSize: '0.65rem', color: '#64748b', lineHeight: 1.4 }}>
              {a.description}
            </div>

            {isEarned ? (
              <div style={{
                fontSize: '0.65rem', fontFamily: "'Orbitron', sans-serif",
                color: '#f59e0b', fontWeight: 700, marginTop: 2,
              }}>
                +{a.xpReward} XP
              </div>
            ) : (
              <div style={{
                fontSize: '0.6rem', color: '#334155',
                background: '#1e293b', borderRadius: 4,
                padding: '2px 6px', marginTop: 2,
              }}>
                Locked
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
