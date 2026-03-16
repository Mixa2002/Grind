import { LayoutDashboard, CalendarDays, BarChart2, Settings } from 'lucide-react';

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
  { icon: CalendarDays,    label: 'Calendar',  id: 'calendar'  },
  { icon: BarChart2,       label: 'Stats',     id: 'stats'     },
  { icon: Settings,        label: 'Settings',  id: 'settings'  },
];

interface SidebarProps {
  active?: string;
  onNavigate?: (page: string) => void;
  isMobile?: boolean;
}

export function Sidebar({ active = 'dashboard', onNavigate, isMobile }: SidebarProps) {
  if (isMobile) {
    return (
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: '#0f172a', borderTop: '1px solid #1e293b',
        display: 'flex',
      }}>
        {NAV.map(({ icon: Icon, label, id }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              onClick={() => onNavigate?.(id)}
              style={{
                flex: 1, padding: '8px 0', background: 'transparent', border: 'none',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                color: isActive ? '#f59e0b' : '#475569', cursor: 'pointer',
              }}
            >
              <Icon size={18} />
              <span style={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 400 }}>{label}</span>
            </button>
          );
        })}
      </nav>
    );
  }
  return (
    <aside style={{
      width: 200,
      background: '#0f172a',
      borderRight: '1px solid #1e293b',
      position: 'fixed',
      top: 0, left: 0, bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      zIndex: 200,
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e293b' }}>
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '0.8rem', fontWeight: 800,
          color: '#f59e0b', letterSpacing: '0.08em', lineHeight: 1.2,
        }}>
          PRODUCTIVITY<br />QUEST
        </div>
      </div>

      {/* Nav */}
      <nav style={{ padding: '12px 8px', flex: 1 }}>
        {NAV.map(({ icon: Icon, label, id }) => {
          const isActive = active === id;
          return (
            <div
              key={id}
              onClick={() => onNavigate?.(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 8,
                cursor: 'pointer', marginBottom: 2,
                background: isActive ? '#f59e0b18' : 'transparent',
                color: isActive ? '#f59e0b' : '#64748b',
                fontSize: '0.85rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#1e293b'; }}
              onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <Icon size={16} />
              {label}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
