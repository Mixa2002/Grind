import { Plus, Pencil, Trash2, Power } from 'lucide-react';
import type { RecurringTemplate } from '../../types';

function describeRecurrence(r: RecurringTemplate['recurrence']): string {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  switch (r.type) {
    case 'daily':   return 'Every day';
    case 'weekly':  return (r.daysOfWeek ?? []).map(d => DAYS[d]).join(', ') || 'Weekly';
    case 'everyN':  return `Every ${r.interval ?? 2} days`;
    case 'monthly': return `Monthly on the ${r.dayOfMonth ?? 1}${ordinal(r.dayOfMonth ?? 1)}`;
    default:        return '';
  }
}

function ordinal(n: number): string {
  if (n >= 11 && n <= 13) return 'th';
  switch (n % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

interface Props {
  templates: RecurringTemplate[];
  onNew: () => void;
  onEdit: (t: RecurringTemplate) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

export function TemplatesPanel({ templates, onNew, onEdit, onDelete, onToggle }: Props) {
  return (
    <div style={{
      width: 260, flexShrink: 0,
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: 12, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f8fafc' }}>
          Recurring Templates
        </span>
        <button
          onClick={onNew}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 10px', background: '#f59e0b', border: 'none',
            borderRadius: 6, color: '#020617', fontSize: '0.72rem',
            fontWeight: 700, cursor: 'pointer',
          }}
        >
          <Plus size={12} /> New
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        {templates.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '32px 16px',
            color: '#334155', fontSize: '0.78rem',
          }}>
            <div style={{ fontSize: '1.8rem', marginBottom: 8 }}>🔄</div>
            No recurring templates yet.<br />
            Create one to auto-populate your calendar.
          </div>
        )}

        {templates.map(t => (
          <div key={t.id} style={{
            borderRadius: 8, padding: '10px 12px',
            background: '#1e293b',
            border: `1px solid ${t.color ?? '#334155'}33`,
            marginBottom: 6,
            opacity: t.active ? 1 : 0.5,
            transition: 'opacity 0.2s',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              {/* Color dot */}
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: t.color ?? '#f59e0b',
                marginTop: 5, flexShrink: 0,
              }} />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: '0.8rem', color: '#f8fafc', fontWeight: 600,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {t.title}
                </div>
                <div style={{ fontSize: '0.67rem', color: '#64748b', marginTop: 2 }}>
                  {describeRecurrence(t.recurrence)}
                </div>
                <div style={{ fontSize: '0.67rem', color: '#475569', marginTop: 1 }}>
                  {t.startTime} – {t.endTime}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 4, marginTop: 8, justifyContent: 'flex-end' }}>
              <IconBtn
                icon={<Power size={12} />}
                title={t.active ? 'Pause' : 'Activate'}
                color={t.active ? '#34d399' : '#64748b'}
                onClick={() => onToggle(t.id)}
              />
              <IconBtn
                icon={<Pencil size={12} />}
                title="Edit"
                color="#94a3b8"
                onClick={() => onEdit(t)}
              />
              <IconBtn
                icon={<Trash2 size={12} />}
                title="Delete"
                color="#ef4444"
                onClick={() => {
                  if (window.confirm(`Delete "${t.title}"?`)) onDelete(t.id);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function IconBtn({
  icon, title, color, onClick,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        padding: '3px 6px', background: 'transparent',
        border: `1px solid ${color}44`, borderRadius: 5,
        color, cursor: 'pointer', lineHeight: 1,
        display: 'flex', alignItems: 'center',
      }}
    >
      {icon}
    </button>
  );
}
