import { useState } from 'react';
import { Check, Flame, Settings, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DifficultyBadge, DifficultySelector } from '../shared/DifficultySelector';
import { calcHabitXP, getStreakMultiplier } from '../../utils/xp';
import type { DailyHabit, Difficulty } from '../../types';

interface HabitCardProps {
  habit: DailyHabit;
  effectiveDate: string;
  onToggle: (id: string, pos: { x: number; y: number }) => void;
  onEdit: (id: string, updates: Partial<Pick<DailyHabit, 'title' | 'difficulty'>>) => void;
  onDelete: (id: string) => void;
}

function getNextMilestone(streak: number): { days: number; label: string } | null {
  const milestones = [7, 30, 100, 365];
  const next = milestones.find(m => streak < m);
  if (!next) return null;
  return { days: next - streak, label: `${next}-day` };
}

function FlameIcon({ streak }: { streak: number }) {
  if (streak === 0) return <span style={{ color: '#334155', fontSize: '0.75rem' }}>–</span>;

  const size = streak >= 100 ? 20 : streak >= 30 ? 18 : 16;
  const color = streak >= 30 ? '#f59e0b' : streak >= 7 ? '#fbbf24' : '#94a3b8';

  return (
    <Flame
      size={size}
      color={color}
      style={{
        filter: streak >= 30 ? `drop-shadow(0 0 4px ${color}88)` : 'none',
      }}
    />
  );
}

export function HabitCard({ habit, effectiveDate, onToggle, onEdit, onDelete }: HabitCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [editTitle, setEditTitle] = useState(habit.title);
  const [editDiff, setEditDiff] = useState<Difficulty>(habit.difficulty);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isCompleted = habit.completionLog[effectiveDate] === true;
  const xp = calcHabitXP(habit.difficulty, habit.currentStreak);
  const multiplier = getStreakMultiplier(habit.currentStreak);
  const nextMilestone = getNextMilestone(habit.currentStreak);

  const has100Streak = habit.currentStreak >= 100;
  const has30Streak = habit.currentStreak >= 30;

  const handleToggle = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).closest('[data-habit-card]')!.getBoundingClientRect();
    onToggle(habit.id, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
  };

  const handleEditSave = () => {
    if (editTitle.trim()) {
      onEdit(habit.id, { title: editTitle.trim(), difficulty: editDiff });
    }
    setShowEdit(false);
  };

  return (
    <div
      data-habit-card="true"
      style={{
        marginBottom: 8,
        borderRadius: 10,
        border: `1.5px solid ${
          has100Streak ? '#f59e0b'
          : has30Streak ? '#f59e0b66'
          : isCompleted ? '#334155'
          : '#334155'
        }`,
        background: isCompleted ? '#0f172a' : '#1e293b',
        boxShadow: has100Streak
          ? '0 0 16px #f59e0b44'
          : has30Streak
          ? '0 0 8px #f59e0b22'
          : 'none',
        transition: 'all 0.2s',
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          style={{
            width: 22, height: 22,
            borderRadius: 6,
            border: `2px solid ${isCompleted ? '#34d399' : '#475569'}`,
            background: isCompleted ? '#34d399' : 'transparent',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.15s',
          }}
        >
          {isCompleted && <Check size={13} color="#020617" strokeWidth={3} />}
        </button>

        {/* Title + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: isCompleted ? '#64748b' : '#f8fafc',
            textDecoration: isCompleted ? 'line-through' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {habit.title}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }}>
            <DifficultyBadge difficulty={habit.difficulty} />
            <span style={{
              fontSize: '0.65rem',
              fontFamily: "'Orbitron', sans-serif",
              color: isCompleted ? '#64748b' : '#f59e0b',
              fontWeight: 700,
            }}>
              {habit.baseXP}
              {multiplier > 1 && (
                <span style={{ color: '#94a3b8' }}>
                  {' '}×{multiplier.toFixed(1)} = <span style={{ color: '#f59e0b' }}>{xp}</span>
                </span>
              )}
              {' '}XP
            </span>
          </div>
        </div>

        {/* Streak */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FlameIcon streak={habit.currentStreak} />
            <span style={{
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.85rem',
              fontWeight: 700,
              color: habit.currentStreak >= 30 ? '#f59e0b'
                : habit.currentStreak >= 7 ? '#fbbf24'
                : habit.currentStreak > 0 ? '#94a3b8'
                : '#334155',
            }}>
              {habit.currentStreak}
            </span>
          </div>
          {habit.longestStreak > 0 && (
            <span style={{ fontSize: '0.55rem', color: '#475569' }}>
              Best: {habit.longestStreak}
            </span>
          )}
        </div>

        {/* Gear */}
        <button
          onClick={() => { setShowEdit(v => !v); setEditTitle(habit.title); setEditDiff(habit.difficulty); }}
          style={{
            width: 22, height: 22,
            borderRadius: 4, border: 'none',
            background: 'transparent',
            color: showEdit ? '#f59e0b' : '#475569',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Settings size={13} />
        </button>
      </div>

      {/* Milestone progress */}
      {nextMilestone && habit.currentStreak > 0 && (
        <div style={{
          padding: '0 12px 8px',
          fontSize: '0.62rem',
          color: '#475569',
        }}>
          {nextMilestone.days} day{nextMilestone.days !== 1 ? 's' : ''} to {nextMilestone.label} milestone
        </div>
      )}

      {/* Edit panel */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{
              padding: '10px 12px',
              borderTop: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: 5,
                  color: '#f8fafc',
                  fontSize: '0.8rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
              <DifficultySelector value={editDiff} onChange={setEditDiff} size="sm" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => setConfirmDelete(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 8px',
                    background: 'transparent',
                    border: '1px solid #334155',
                    borderRadius: 5,
                    color: '#64748b',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f43f5e'; e.currentTarget.style.borderColor = '#f43f5e'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#334155'; }}
                >
                  <Trash2 size={11} /> Delete
                </button>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setShowEdit(false)}
                    style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #334155', borderRadius: 5, color: '#64748b', fontSize: '0.7rem', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleEditSave}
                    style={{ padding: '4px 10px', background: '#f59e0b', border: 'none', borderRadius: 5, color: '#020617', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Save
                  </button>
                </div>
              </div>

              {/* Delete confirmation */}
              {confirmDelete && (
                <div style={{
                  background: '#f43f5e18',
                  border: '1px solid #f43f5e44',
                  borderRadius: 6,
                  padding: '8px 10px',
                  fontSize: '0.72rem',
                  color: '#f8fafc',
                }}>
                  <p style={{ margin: '0 0 8px' }}>
                    This will permanently reset your {habit.currentStreak}-day streak.
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      style={{ flex: 1, padding: '4px', background: 'transparent', border: '1px solid #334155', borderRadius: 4, color: '#94a3b8', fontSize: '0.7rem', cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => onDelete(habit.id)}
                      style={{ flex: 1, padding: '4px', background: '#f43f5e', border: 'none', borderRadius: 4, color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
