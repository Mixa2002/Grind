import { motion } from 'framer-motion';
import type { XPFloatItem } from '../../hooks/useAppState';

interface XPFloatLayerProps {
  floats: XPFloatItem[];
}

export function XPFloatLayer({ floats }: XPFloatLayerProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9999 }}>
      {floats.map(f => (
        <XPFloat key={f.id} item={f} />
      ))}
    </div>
  );
}

function XPFloat({ item }: { item: XPFloatItem }) {
  const isGain = item.amount > 0;
  const color = isGain ? '#f59e0b' : '#f43f5e';
  const label = isGain ? `+${item.amount} XP` : `${item.amount} XP`;

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: '-50%' }}
      animate={{ opacity: 0, y: isGain ? -70 : 40 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        left: item.x,
        top: item.y,
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 700,
        fontSize: '1.1rem',
        color,
        textShadow: `0 0 12px ${color}88`,
        whiteSpace: 'nowrap',
        userSelect: 'none',
      }}
    >
      {label}
    </motion.div>
  );
}
