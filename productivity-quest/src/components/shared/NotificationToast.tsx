import { AnimatePresence, motion } from 'framer-motion';
import type { Achievement } from '../../utils/achievements';

interface Props {
  notifications: Achievement[];
  onDismiss: (id: string) => void;
}

export function NotificationToast({ notifications, onDismiss }: Props) {
  return (
    <div style={{
      position: 'fixed', top: 80, right: 20, zIndex: 9990,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 80, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 260 }}
            onClick={() => onDismiss(n.id)}
            style={{
              pointerEvents: 'all',
              cursor: 'pointer',
              background: '#0f172a',
              border: '1px solid #334155',
              borderLeft: '4px solid #f59e0b',
              borderRadius: 10,
              padding: '12px 16px',
              minWidth: 260, maxWidth: 320,
              display: 'flex', alignItems: 'center', gap: 12,
              boxShadow: '0 0 24px #f59e0b22, 0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: '#f59e0b22',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.2rem', flexShrink: 0,
            }}>
              🏆
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Achievement Unlocked!
              </div>
              <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: 700, marginTop: 1 }}>
                {n.title}
              </div>
              <div style={{
                fontSize: '0.72rem', fontFamily: "'Orbitron', sans-serif",
                color: '#f59e0b', fontWeight: 700, marginTop: 2,
              }}>
                +{n.xpReward} XP
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
