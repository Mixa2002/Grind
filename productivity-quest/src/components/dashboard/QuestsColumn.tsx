import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { QuestCard } from './QuestCard';
import { DifficultySelector } from '../shared/DifficultySelector';
import { calcFlexibleTaskXP } from '../../utils/xp';
import type { Difficulty } from '../../types';
import type { AppState } from '../../hooks/useAppState';

interface Props {
  state: Pick<AppState, 'dayData' | 'profile' | 'effectiveDate' | 'addFlexibleTask' | 'toggleFlexibleTask' | 'deleteFlexibleTask'>;
}

export function QuestsColumn({ state }: Props) {
  const { dayData, profile, effectiveDate, addFlexibleTask, toggleFlexibleTask, deleteFlexibleTask } = state;
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  const isLate = profile.lastPlannedDate === effectiveDate;
  const xpPreview = calcFlexibleTaskXP(difficulty, isLate);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addFlexibleTask({ title: title.trim(), difficulty });
    setTitle('');
  };

  // Incomplete first, then completed (sinks to bottom)
  const incomplete = dayData.flexibleTasks.filter(t => !t.completed);
  const completed = dayData.flexibleTasks.filter(t => t.completed);
  const sorted = [...incomplete, ...completed];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
        flexShrink: 0,
      }}>
        <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Quests</h2>
        <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>
          {dayData.flexibleTasks.filter(t => t.completed).length}/{dayData.flexibleTasks.length} done
        </p>
      </div>

      {/* Quick-add form */}
      <form onSubmit={handleSubmit} style={{
        padding: '10px 14px',
        borderBottom: '1px solid #1e293b',
        background: '#0f172a',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}>
        <input
          type="text"
          placeholder="Add a quest... (Enter to submit)"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 10px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: 6,
            color: '#f8fafc',
            fontSize: '0.8rem',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <DifficultySelector value={difficulty} onChange={setDifficulty} size="sm" />
          <span style={{
            fontSize: '0.72rem',
            fontFamily: "'Orbitron', sans-serif",
            color: '#f59e0b',
            fontWeight: 700,
          }}>
            {xpPreview} XP{isLate ? ' (75%)' : ''}
          </span>
        </div>
        {isLate && (
          <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>
            ⚠ Added after planning — 75% XP
          </p>
        )}
      </form>

      {/* Task list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {dayData.flexibleTasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#334155', fontSize: '0.8rem', marginTop: 32 }}>
            No quests for today.<br />
            <span style={{ fontSize: '0.7rem' }}>Add one above.</span>
          </div>
        ) : (
          <AnimatePresence>
            {sorted.map(task => (
              <QuestCard
                key={task.id}
                task={task}
                onToggle={toggleFlexibleTask}
                onDelete={deleteFlexibleTask}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
