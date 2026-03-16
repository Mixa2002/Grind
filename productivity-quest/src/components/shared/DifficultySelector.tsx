import type { Difficulty } from '../../types';

interface Props {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  size?: 'sm' | 'md';
}

const LABELS: Record<Difficulty, string> = { 1: 'Trivial', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Brutal' };
const COLORS: Record<Difficulty, string> = {
  1: '#64748b',
  2: '#34d399',
  3: '#3b82f6',
  4: '#f59e0b',
  5: '#f43f5e',
};

export function DifficultySelector({ value, onChange, size = 'md' }: Props) {
  const pad = size === 'sm' ? '2px 7px' : '4px 10px';
  const fs = size === 'sm' ? '0.7rem' : '0.75rem';

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {([1, 2, 3, 4, 5] as Difficulty[]).map(d => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          title={LABELS[d]}
          style={{
            padding: pad,
            fontSize: fs,
            fontWeight: 600,
            borderRadius: 6,
            border: `1.5px solid ${value === d ? COLORS[d] : '#334155'}`,
            background: value === d ? `${COLORS[d]}22` : 'transparent',
            color: value === d ? COLORS[d] : '#64748b',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {d}
        </button>
      ))}
    </div>
  );
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const labels: Record<Difficulty, string> = { 1: 'Trivial', 2: 'Easy', 3: 'Medium', 4: 'Hard', 5: 'Brutal' };
  const colors: Record<Difficulty, string> = {
    1: '#64748b', 2: '#34d399', 3: '#3b82f6', 4: '#f59e0b', 5: '#f43f5e',
  };
  const c = colors[difficulty];
  return (
    <span style={{
      padding: '1px 6px',
      fontSize: '0.65rem',
      fontWeight: 700,
      borderRadius: 4,
      border: `1px solid ${c}`,
      color: c,
      background: `${c}18`,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
    }}>
      {labels[difficulty]}
    </span>
  );
}
