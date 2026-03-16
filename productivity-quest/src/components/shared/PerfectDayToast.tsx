import { motion, AnimatePresence } from 'framer-motion';

export function PerfectDayToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -60, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.8 }}
          transition={{ type: 'spring', damping: 14, stiffness: 220 }}
          style={{
            position: 'fixed',
            top: 80,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9998,
            background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
            color: '#020617',
            borderRadius: 14,
            padding: '16px 32px',
            textAlign: 'center',
            boxShadow: '0 0 40px #f59e0b88',
            pointerEvents: 'none',
          }}
        >
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 900,
            fontSize: '1.4rem',
            letterSpacing: '0.15em',
          }}>
            ⭐ PERFECT DAY! ⭐
          </div>
          <div style={{ fontSize: '0.85rem', fontWeight: 600, marginTop: 4 }}>
            +100 XP Bonus
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
