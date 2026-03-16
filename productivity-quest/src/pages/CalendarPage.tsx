import { useState } from 'react';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { WeekView, getWeekStart } from '../components/calendar/WeekView';
import { MonthView } from '../components/calendar/MonthView';
import { TemplatesPanel } from '../components/calendar/TemplatesPanel';
import { RecurringTaskForm } from '../components/calendar/RecurringTaskForm';
import { DayDetailModal } from '../components/calendar/DayDetailModal';
import type { AppState } from '../hooks/useAppState';

type ViewMode = 'week' | 'month';

interface Props {
  state: AppState;
  isMobile?: boolean;
}

const navBtnStyle: React.CSSProperties = {
  padding: '4px 7px', background: 'transparent',
  border: '1px solid #334155', borderRadius: 6,
  color: '#94a3b8', cursor: 'pointer',
  display: 'flex', alignItems: 'center',
};

export function CalendarPage({ state, isMobile }: Props) {
  const [viewMode,        setViewMode]        = useState<ViewMode>('week');
  const [weekStart,       setWeekStart]       = useState(() => getWeekStart(new Date()));
  const [monthDate,       setMonthDate]       = useState(() => new Date());
  const [editingTemplate, setEditingTemplate] = useState<import('../types').RecurringTemplate | null | undefined>(undefined);
  // undefined = closed; null = new; RecurringTemplate = edit
  const [selectedDay,     setSelectedDay]     = useState<string | null>(null);

  const navLabel = viewMode === 'week'
    ? `${format(weekStart, 'MMM d')} – ${format(new Date(weekStart.getTime() + 6 * 86400000), 'MMM d, yyyy')}`
    : format(monthDate, 'MMMM yyyy');

  const goBack = () => {
    if (viewMode === 'week')  setWeekStart(prev => subWeeks(prev, 1));
    else                      setMonthDate(prev => subMonths(prev, 1));
  };

  const goForward = () => {
    if (viewMode === 'week')  setWeekStart(prev => addWeeks(prev, 1));
    else                      setMonthDate(prev => addMonths(prev, 1));
  };

  const goToday = () => {
    setWeekStart(getWeekStart(new Date()));
    setMonthDate(new Date());
  };

  return (
    <div style={{
      marginLeft: isMobile ? 0 : 200,
      marginTop: 60,
      height: isMobile ? 'calc(100vh - 60px - 56px)' : 'calc(100vh - 60px)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Toolbar */}
      <div style={{
        padding: '10px 16px', borderBottom: '1px solid #1e293b',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        background: '#0a1628',
      }}>
        {/* View toggle */}
        <div style={{ display: 'flex', gap: 1, background: '#1e293b', borderRadius: 7, padding: 2 }}>
          {(['week', 'month'] as ViewMode[]).map(v => (
            <button
              key={v} onClick={() => setViewMode(v)}
              style={{
                padding: '4px 12px', borderRadius: 5, border: 'none',
                background: viewMode === v ? '#f59e0b' : 'transparent',
                color: viewMode === v ? '#020617' : '#64748b',
                fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <button onClick={goBack}    style={navBtnStyle}><ChevronLeft  size={14} /></button>
        <button onClick={goForward} style={navBtnStyle}><ChevronRight size={14} /></button>
        <button onClick={goToday}   style={{ ...navBtnStyle, padding: '4px 10px', fontSize: '0.72rem' }}>Today</button>

        {/* Label */}
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', flex: 1 }}>
          {navLabel}
        </span>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', padding: 12, gap: 12 }}>
        {/* Calendar view */}
        <div style={{
          flex: 1, minWidth: 0,
          background: '#0f172a',
          border: '1px solid #1e293b',
          borderRadius: 12, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          {viewMode === 'week' ? (
            <WeekView
              weekStart={weekStart}
              effectiveDate={state.effectiveDate}
              onDayClick={setSelectedDay}
            />
          ) : (
            <MonthView
              month={monthDate}
              habits={state.habits}
              effectiveDate={state.effectiveDate}
              onDayClick={setSelectedDay}
            />
          )}
        </div>

        {/* Templates panel */}
        <TemplatesPanel
          templates={state.templates}
          onNew={() => setEditingTemplate(null)}
          onEdit={t => setEditingTemplate(t)}
          onDelete={state.deleteTemplate}
          onToggle={state.toggleTemplate}
        />
      </div>

      {/* Recurring template form */}
      {editingTemplate !== undefined && (
        <RecurringTaskForm
          initial={editingTemplate}
          onSave={state.saveTemplate}
          onClose={() => setEditingTemplate(undefined)}
        />
      )}

      {/* Day detail modal */}
      {selectedDay && (
        <DayDetailModal
          dayStr={selectedDay}
          habits={state.habits}
          effectiveDate={state.effectiveDate}
          onLateComplete={state.lateCompleteTask}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
