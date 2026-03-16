import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { HabitCard } from './HabitCard';
import { DifficultySelector } from '../shared/DifficultySelector';
import { getBaseXP } from '../../utils/xp';
import type { Difficulty } from '../../types';
import type { AppState } from '../../hooks/useAppState';

interface Props {
  state: Pick<AppState, 'habits' | 'effectiveDate' | 'addHabit' | 'toggleHabit' | 'editHabit' | 'deleteHabit'>;
}

export function HabitsColumn({ state }: Props) {
  const { habits, effectiveDate, addHabit, toggleHabit, editHabit, deleteHabit } = state;
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(2);

  const completedCount = habits.filter(h => h.completionLog[effectiveDate] === true).length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addHabit({ title: title.trim(), difficulty });
    setTitle('');
    setDifficulty(2);
    setShowForm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #1e293b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: '#f8fafc' }}>Habits</h2>
          <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>
            {completedCount}/{habits.length} today
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{
            width: 28, height: 28, borderRadius: 6,
            border: '1px solid #334155',
            background: showForm ? '#f59e0b22' : 'transparent',
            color: showForm ? '#f59e0b' : '#64748b',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
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
            autoFocus
            type="text"
            placeholder="Habit name..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 10px',
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
              {getBaseXP(difficulty)}+ XP
            </span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                flex: 1, padding: '5px',
                background: 'transparent', border: '1px solid #334155',
                borderRadius: 5, color: '#64748b', fontSize: '0.75rem', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              style={{
                flex: 2, padding: '5px',
                background: '#f59e0b', border: 'none',
                borderRadius: 5, color: '#020617', fontSize: '0.75rem', fontWeight: 700,
                cursor: 'pointer',
                opacity: !title.trim() ? 0.4 : 1,
              }}
            >
              Add Habit
            </button>
          </div>
        </form>
      )}

      {/* Habits list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
        {habits.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#334155', fontSize: '0.8rem', marginTop: 32 }}>
            No habits yet.<br />
            <span style={{ fontSize: '0.7rem' }}>Build your daily rituals.</span>
          </div>
        ) : (
          habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              effectiveDate={effectiveDate}
              onToggle={toggleHabit}
              onEdit={editHabit}
              onDelete={deleteHabit}
            />
          ))
        )}
      </div>
    </div>
  );
}
