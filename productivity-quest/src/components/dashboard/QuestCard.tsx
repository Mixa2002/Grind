import { useState } from 'react';
import { Trash2, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { DifficultyBadge } from '../shared/DifficultySelector';
import type { FlexibleTask } from '../../types';

interface QuestCardProps {
  task: FlexibleTask;
  onToggle: (id: string, pos: { x: number; y: number }) => void;
  onDelete: (id: string) => void;
}

export function QuestCard({ task, onToggle, onDelete }: QuestCardProps) {
  const [hovered, setHovered] = useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).closest('[data-card]')!.getBoundingClientRect();
    onToggle(task.id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      data-card="true"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        background: task.completed ? '#0f172a' : '#1e293b',
        border: `1px solid ${task.completed ? '#1e293b' : '#334155'}`,
        borderRadius: 10,
        marginBottom: 6,
        transition: 'all 0.2s',
        opacity: task.completed ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        style={{
          width: 20, height: 20,
          borderRadius: 5,
          border: `2px solid ${task.completed ? '#34d399' : '#475569'}`,
          background: task.completed ? '#34d399' : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all 0.15s',
        }}
      >
        {task.completed && <Check size={12} color="#020617" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.85rem',
          fontWeight: 500,
          color: task.completed ? '#64748b' : '#f8fafc',
          textDecoration: task.completed ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {task.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
          <DifficultyBadge difficulty={task.difficulty} />
          <span style={{
            fontSize: '0.7rem',
            fontFamily: "'Orbitron', sans-serif",
            color: task.completed ? '#64748b' : '#f59e0b',
            fontWeight: 700,
          }}>
            {task.xpValue} XP
          </span>
          {task.addedLate && (
            <span style={{ fontSize: '0.6rem', color: '#64748b', background: '#0f172a', borderRadius: 3, padding: '1px 4px' }}>
              Late 75%
            </span>
          )}
        </div>
      </div>

      {/* Delete button */}
      {hovered && !task.completed && (
        <button
          onClick={() => onDelete(task.id)}
          style={{
            width: 24, height: 24,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            color: '#475569',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#f43f5e')}
          onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
        >
          <Trash2 size={14} />
        </button>
      )}
    </motion.div>
  );
}
