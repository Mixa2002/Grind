import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppState } from './hooks/useAppState';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { ScheduleColumn } from './components/dashboard/ScheduleColumn';
import { QuestsColumn } from './components/dashboard/QuestsColumn';
import { HabitsColumn } from './components/dashboard/HabitsColumn';
import { XPFloatLayer } from './components/shared/XPFloat';
import { LevelUpOverlay } from './components/shared/LevelUpOverlay';
import { PerfectDayToast } from './components/shared/PerfectDayToast';
import { NotificationToast } from './components/shared/NotificationToast';
import { DailyPlanningModal } from './components/planning/DailyPlanningModal';
import { CalendarPage } from './pages/CalendarPage';
import { StatsPage } from './pages/StatsPage';
import { SettingsPage } from './pages/SettingsPage';

type Page = 'dashboard' | 'calendar' | 'stats' | 'settings';
type DashTab = 'schedule' | 'quests' | 'habits';

const COL_STYLE: React.CSSProperties = {
  flex: 1, minWidth: 0,
  background: '#0f172a',
  border: '1px solid #1e293b',
  borderRadius: 12, overflow: 'hidden',
  display: 'flex', flexDirection: 'column',
};

function useIsMobile() {
  const [mobile, setMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return mobile;
}

export default function App() {
  const state    = useAppState();
  const isMobile = useIsMobile();
  const [page,     setPage]     = useState<Page>('dashboard');
  const [dashTab,  setDashTab]  = useState<DashTab>('schedule');

  return (
    <>
      <Sidebar active={page} onNavigate={p => setPage(p as Page)} isMobile={isMobile} />

      <TopBar
        profile={state.profile}
        dayData={state.dayData}
        habits={state.habits}
        effectiveDate={state.effectiveDate}
        isMobile={isMobile}
      />

      {/* Mobile tab bar for dashboard */}
      {isMobile && page === 'dashboard' && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, zIndex: 150,
          background: '#0f172a', borderBottom: '1px solid #1e293b',
          display: 'flex',
        }}>
          {(['schedule', 'quests', 'habits'] as DashTab[]).map(tab => (
            <button
              key={tab}
              onClick={() => setDashTab(tab)}
              style={{
                flex: 1, padding: '10px 0',
                background: 'transparent', border: 'none',
                color: dashTab === tab ? '#f59e0b' : '#64748b',
                fontSize: '0.78rem', fontWeight: dashTab === tab ? 700 : 400,
                cursor: 'pointer',
                borderBottom: `2px solid ${dashTab === tab ? '#f59e0b' : 'transparent'}`,
                textTransform: 'capitalize',
                transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          style={{ height: '100%' }}
        >
          {page === 'dashboard' && (
            <div style={{
              marginLeft: isMobile ? 0 : 200,
              marginTop: isMobile ? 100 : 60,
              height: `calc(100vh - ${isMobile ? 100 : 60}px)`,
              padding: '12px',
              display: 'flex',
              gap: 10,
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}>
              {isMobile ? (
                /* Mobile: single tab */
                <div style={{ ...COL_STYLE, flex: 1 }}>
                  {dashTab === 'schedule' && <ScheduleColumn state={state} />}
                  {dashTab === 'quests'   && <QuestsColumn   state={state} />}
                  {dashTab === 'habits'   && <HabitsColumn   state={state} />}
                </div>
              ) : (
                /* Desktop: three columns */
                <>
                  <div style={COL_STYLE}><ScheduleColumn state={state} /></div>
                  <div style={COL_STYLE}><QuestsColumn   state={state} /></div>
                  <div style={COL_STYLE}><HabitsColumn   state={state} /></div>
                </>
              )}
            </div>
          )}

          {page === 'calendar' && <CalendarPage state={state} isMobile={isMobile} />}
          {page === 'stats'    && <StatsPage    state={state} isMobile={isMobile} />}
          {page === 'settings' && <SettingsPage state={state} isMobile={isMobile} />}
        </motion.div>
      </AnimatePresence>

      {/* Floating overlays */}
      <XPFloatLayer floats={state.xpFloats} />
      <LevelUpOverlay info={state.levelUpInfo} onDismiss={state.dismissLevelUp} />
      <PerfectDayToast visible={state.perfectDayCelebration} />
      <NotificationToast notifications={state.achievementQueue} onDismiss={state.dismissAchievement} />

      {/* Mandatory planning modal */}
      {state.showPlanningModal && (
        <DailyPlanningModal
          effectiveDate={state.effectiveDate}
          profile={state.profile}
          habits={state.habits}
          initialDayData={state.dayData}
          transitionSummaries={state.transitionSummaries}
          onLockIn={state.lockInPlan}
        />
      )}
    </>
  );
}
