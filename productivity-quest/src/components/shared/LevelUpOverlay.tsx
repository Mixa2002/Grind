import { motion, AnimatePresence } from 'framer-motion';
import type { LevelUpInfo } from '../../hooks/useAppState';

const PARTICLE_COUNT = 28;

const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  angle: (i / PARTICLE_COUNT) * 360,
  distance: 90 + (i % 3) * 40,
  color: ['#f59e0b', '#fbbf24', '#34d399', '#a78bfa', '#f43f5e', '#06b6d4'][i % 6],
  size: 6 + (i % 3) * 4,
}));

interface LevelUpOverlayProps {
  info: LevelUpInfo | null;
  onDismiss: () => void;
}

export function LevelUpOverlay({ info, onDismiss }: LevelUpOverlayProps) {
  return (
    <AnimatePresence>
      {info && (
        <motion.div
          key="levelup-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onDismiss}
          style={{
            position: 'fixed', inset: 0, zIndex: 10000,
            background: 'rgba(2,6,23,0.88)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {/* Particles */}
          {particles.map(p => {
            const rad = (p.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * p.distance;
            const ty = Math.sin(rad) * p.distance;
            return (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: tx, y: ty, opacity: 0, scale: 0 }}
                transition={{ duration: 1.2, delay: 0.3, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  background: p.color,
                  boxShadow: `0 0 8px ${p.color}`,
                }}
              />
            );
          })}

          {/* Card */}
          <motion.div
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', damping: 14, stiffness: 200 }}
            onClick={e => e.stopPropagation()}
            style={{
              textAlign: 'center',
              padding: '48px 64px',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '2px solid #f59e0b',
              borderRadius: 20,
              boxShadow: '0 0 60px #f59e0b44, 0 0 120px #f59e0b22',
            }}
          >
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '1rem',
                letterSpacing: '0.3em',
                color: '#94a3b8',
                marginBottom: 8,
                textTransform: 'uppercase',
              }}
            >
              Level Up!
            </motion.p>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring', damping: 10, stiffness: 180 }}
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '5rem',
                fontWeight: 900,
                color: '#f59e0b',
                lineHeight: 1,
                textShadow: '0 0 30px #f59e0b, 0 0 60px #f59e0b88',
              }}
            >
              {info.level}
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '1.1rem',
                letterSpacing: '0.2em',
                color: '#fbbf24',
                marginTop: 12,
                textTransform: 'uppercase',
              }}
            >
              {info.title}
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ color: '#475569', fontSize: '0.75rem', marginTop: 24 }}
            >
              Click anywhere to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
