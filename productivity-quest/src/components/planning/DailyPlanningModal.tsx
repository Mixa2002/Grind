import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, SkipForward, Lock } from 'lucide-react';
import { DifficultySelector } from '../shared/DifficultySelector';
import { calcScheduledTaskXP, calcFlexibleTaskXP, calcHabitXP } from '../../utils/xp';
import type { DayData, DailyHabit, UserProfile, ScheduledTask, FlexibleTask, Difficulty } from '../../types';
import type { DayTransitionSummary } from '../../utils/dayTransition';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(dateStr: string) {
  return format(new Date(dateStr + 'T12:00:00'), 'EEEE, MMM d');
}

function getMotivation(xp: number): string {
  if (xp < 200)  return 'A light day. Every bit counts.';
  if (xp < 500)  return "Solid plan. Let's execute.";
  if (xp < 1000) return "Ambitious. You've got this.";
  return "Legendary day incoming. Don't hold back.";
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  effectiveDate: string;
  profile: UserProfile;
  habits: DailyHabit[];
  initialDayData: DayData;
  transitionSummaries: DayTransitionSummary[];
  onLockIn: (dayData: DayData) => void;
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '7px 10px', background: '#1e293b',
  border: '1px solid #334155', borderRadius: 6, color: '#f8fafc',
  fontSize: '0.8rem', outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.62rem', color: '#64748b',
  marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em',
};

const COLORS = ['#f59e0b', '#3b82f6', '#34d399', '#a78bfa', '#f43f5e', '#06b6d4'];

// ─── Component ────────────────────────────────────────────────────────────────

export function DailyPlanningModal({
  effectiveDate, profile, habits, initialDayData, transitionSummaries, onLockIn,
}: Props) {
  const hasYesterdayReview = transitionSummaries.length > 0;
  const firstStep = hasYesterdayReview ? 0 : 1;
  const [step, setStep] = useState(firstStep);
  const [planData, setPlanData] = useState<DayData>({ ...initialDayData });

  const totalSteps = hasYesterdayReview ? 3 : 2;
  const displayStep = hasYesterdayReview ? step + 1 : step; // steps for the indicator

  const totalSummaries = useMemo(() => ({
    xpLost: transitionSummaries.reduce((s, x) => s + x.xpLost, 0),
    daysProcessed: transitionSummaries.length,
  }), [transitionSummaries]);

  const latestSummary = transitionSummaries[transitionSummaries.length - 1] ?? null;

  const totalPotentialXP = useMemo(() => {
    const scheduledXP = planData.scheduledTasks.reduce((s, t) => s + t.xpValue, 0);
    const flexibleXP  = planData.flexibleTasks.reduce((s, t) => s + t.xpValue, 0);
    const habitXP     = habits.reduce((s, h) => s + calcHabitXP(h.difficulty, h.currentStreak), 0);
    return scheduledXP + flexibleXP + habitXP;
  }, [planData, habits]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9500,
      background: 'rgba(2,6,23,0.92)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflowY: 'auto',
      padding: '20px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          width: '100%', maxWidth: 580,
          background: '#0f172a',
          border: '1px solid #334155',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #1e293b',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{
            fontFamily: "'Orbitron', sans-serif", fontSize: '0.75rem',
            color: '#f59e0b', fontWeight: 700, letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}>
            Daily Planning
          </div>
          {/* Step indicator */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {Array.from({ length: totalSteps }, (_, i) => {
              const stepIdx = hasYesterdayReview ? i : i + 1;
              const isActive = step === stepIdx;
              const isDone   = step > stepIdx;
              return (
                <div key={i} style={{
                  width: isActive ? 24 : 8, height: 8, borderRadius: 4,
                  background: isDone ? '#34d399' : isActive ? '#f59e0b' : '#334155',
                  transition: 'all 0.3s',
                }} />
              );
            })}
            <span style={{ fontSize: '0.65rem', color: '#64748b', marginLeft: 4 }}>
              Step {displayStep} of {totalSteps}
            </span>
          </div>
        </div>

        {/* ── Steps ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 0 && (
              <YesterdayReview
                latestSummary={latestSummary}
                totalSummaries={totalSummaries}
                onContinue={() => setStep(1)}
              />
            )}
            {step === 1 && (
              <PlanToday
                effectiveDate={effectiveDate}
                profile={profile}
                habits={habits}
                planData={planData}
                onPlanDataChange={setPlanData}
                onContinue={() => setStep(2)}
                totalPotentialXP={totalPotentialXP}
              />
            )}
            {step === 2 && (
              <ConfirmStep
                planData={planData}
                habits={habits}
                totalPotentialXP={totalPotentialXP}
                onLockIn={() => onLockIn(planData)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ─── Step 1: Yesterday Review ─────────────────────────────────────────────────

function YesterdayReview({
  latestSummary,
  totalSummaries,
  onContinue,
}: {
  latestSummary: DayTransitionSummary | null;
  totalSummaries: { xpLost: number; daysProcessed: number };
  onContinue: () => void;
}) {
  if (!latestSummary) {
    return (
      <div style={{ padding: '32px 24px' }}>
        <p style={{ color: '#64748b', marginBottom: 24 }}>No data to review.</p>
        <ContinueButton onClick={onContinue} />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      {/* Date header */}
      <p style={{ margin: '0 0 4px', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Yesterday
      </p>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
        {fmtDate(latestSummary.date)}
      </h2>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <StatChip label="Completed" value={`${latestSummary.completedCount}/${latestSummary.totalCount}`} />
        <StatChip label="XP Earned" value={`+${latestSummary.xpGained}`} color="#34d399" />
        {latestSummary.xpLost > 0 && (
          <StatChip label="XP Lost" value={`-${latestSummary.xpLost}`} color="#f43f5e" />
        )}
      </div>

      {/* Multiple missed days */}
      {totalSummaries.daysProcessed > 1 && (
        <div style={{
          background: '#f43f5e14', border: '1px solid #f43f5e44', borderRadius: 8,
          padding: '10px 14px', marginBottom: 16, fontSize: '0.8rem', color: '#f43f5e',
        }}>
          ⚠ You missed {totalSummaries.daysProcessed} day{totalSummaries.daysProcessed > 1 ? 's' : ''}.
          Total lost: <strong>-{totalSummaries.xpLost} XP</strong>
        </div>
      )}

      {/* Perfect day */}
      {latestSummary.perfectDay && (
        <div style={{
          background: '#f59e0b22', border: '1px solid #f59e0b', borderRadius: 8,
          padding: '10px 14px', marginBottom: 16,
          textAlign: 'center', fontWeight: 700, color: '#f59e0b',
        }}>
          ⭐ Perfect Day!
        </div>
      )}

      {/* Broken streaks */}
      {latestSummary.brokenStreaks.length > 0 && (
        <div style={{
          background: '#f43f5e14', border: '1px solid #f43f5e33', borderRadius: 8,
          padding: '10px 14px', marginBottom: 16,
        }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.72rem', color: '#f43f5e', fontWeight: 700 }}>
            Broken Streaks
          </p>
          {latestSummary.brokenStreaks.map((s, i) => (
            <p key={i} style={{ margin: '2px 0', fontSize: '0.8rem', color: '#f8fafc' }}>
              💔 {s.title} — {s.oldStreak}-day streak lost
            </p>
          ))}
        </div>
      )}

      {/* XP loss summary */}
      {latestSummary.xpLost > 0 && latestSummary.brokenStreaks.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 16 }}>
          You lost <span style={{ color: '#f43f5e' }}>{latestSummary.xpLost} XP</span> from missed tasks.
        </p>
      )}

      <ContinueButton onClick={onContinue} />
    </div>
  );
}

function StatChip({ label, value, color = '#f8fafc' }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      flex: 1, background: '#1e293b', border: '1px solid #334155',
      borderRadius: 8, padding: '8px 12px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.6rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontFamily: "'Orbitron', sans-serif", fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

// ─── Step 2: Plan Today ───────────────────────────────────────────────────────

function PlanToday({
  effectiveDate, habits, planData, onPlanDataChange, onContinue, totalPotentialXP,
}: {
  effectiveDate: string;
  profile?: UserProfile;
  habits: DailyHabit[];
  planData: DayData;
  onPlanDataChange: (d: DayData) => void;
  onContinue: () => void;
  totalPotentialXP: number;
}) {
  const [showAddScheduled, setShowAddScheduled] = useState(false);
  const [showAddQuest,     setShowAddQuest]     = useState(false);

  // Add scheduled form state
  const [sTitle, setSTitle]     = useState('');
  const [sStart, setSStart]     = useState('09:00');
  const [sEnd,   setSEnd]       = useState('10:00');
  const [sDiff,  setSDiff]      = useState<Difficulty>(2);
  const [sColor, setSColor]     = useState('#f59e0b');

  // Add quest form state
  const [qTitle, setQTitle] = useState('');
  const [qDiff,  setQDiff]  = useState<Difficulty>(2);

  const addScheduled = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sTitle.trim() || sEnd <= sStart) return;
    const xpValue = calcScheduledTaskXP(sDiff, sStart, sEnd, false);
    const task: ScheduledTask = {
      id: crypto.randomUUID(), title: sTitle.trim(), date: effectiveDate,
      startTime: sStart, endTime: sEnd, difficulty: sDiff, completed: false,
      xpValue, color: sColor, addedLate: false,
    };
    onPlanDataChange({ ...planData, scheduledTasks: [...planData.scheduledTasks, task] });
    setSTitle(''); setSStart('09:00'); setSEnd('10:00'); setSDiff(2);
    setShowAddScheduled(false);
  };

  const addQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qTitle.trim()) return;
    const xpValue = calcFlexibleTaskXP(qDiff, false);
    const task: FlexibleTask = {
      id: crypto.randomUUID(), title: qTitle.trim(), date: effectiveDate,
      difficulty: qDiff, completed: false, xpValue, addedLate: false,
    };
    onPlanDataChange({ ...planData, flexibleTasks: [...planData.flexibleTasks, task] });
    setQTitle(''); setQDiff(2);
    setShowAddQuest(false);
  };

  const skipScheduled = (id: string) => {
    onPlanDataChange({ ...planData, scheduledTasks: planData.scheduledTasks.filter(t => t.id !== id) });
  };

  const skipQuest = (id: string) => {
    onPlanDataChange({ ...planData, flexibleTasks: planData.flexibleTasks.filter(t => t.id !== id) });
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* Date header */}
      <p style={{ margin: '0 0 4px', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Today
      </p>
      <h2 style={{ margin: '0 0 20px', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
        {fmtDate(effectiveDate)}
      </h2>

      {/* Scheduled tasks section */}
      <SectionLabel>Scheduled Tasks</SectionLabel>
      {planData.scheduledTasks.length === 0 ? (
        <EmptyHint>No scheduled tasks yet.</EmptyHint>
      ) : (
        planData.scheduledTasks.map(task => (
          <PlanTaskRow key={task.id} title={task.title} sub={`${task.startTime}–${task.endTime} · ${task.xpValue} XP`} onRemove={() => skipScheduled(task.id)} />
        ))
      )}

      {/* Add scheduled form */}
      {showAddScheduled ? (
        <form onSubmit={addScheduled} style={{ background: '#1e293b', borderRadius: 8, padding: '12px', marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input autoFocus type="text" placeholder="Task title..." value={sTitle} onChange={e => setSTitle(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1 }}><label style={labelStyle}>Start</label><input type="time" value={sStart} onChange={e => setSStart(e.target.value)} style={inputStyle} /></div>
              <div style={{ flex: 1 }}><label style={labelStyle}>End</label><input type="time" value={sEnd} onChange={e => setSEnd(e.target.value)} style={inputStyle} /></div>
            </div>
            <DifficultySelector value={sDiff} onChange={setSDiff} size="sm" />
            <div style={{ display: 'flex', gap: 5 }}>
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setSColor(c)} style={{ width: 18, height: 18, borderRadius: '50%', background: c, border: sColor === c ? '2px solid #fff' : '2px solid transparent', cursor: 'pointer' }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', fontFamily: "'Orbitron', sans-serif", color: '#f59e0b', fontWeight: 700 }}>
                {calcScheduledTaskXP(sDiff, sStart, sEnd, false)} XP
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => setShowAddScheduled(false)} style={cancelBtnStyle}>Cancel</button>
                <button type="submit" disabled={!sTitle.trim() || sEnd <= sStart} style={addBtnStyle}>Add</button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <AddButton onClick={() => setShowAddScheduled(true)} label="Add Scheduled Task" />
      )}

      <div style={{ height: 16 }} />

      {/* Quests section */}
      <SectionLabel>Quests</SectionLabel>
      {planData.flexibleTasks.length === 0 ? (
        <EmptyHint>No quests yet.</EmptyHint>
      ) : (
        planData.flexibleTasks.map(task => (
          <PlanTaskRow key={task.id} title={task.title} sub={`${task.xpValue} XP`} onRemove={() => skipQuest(task.id)} />
        ))
      )}

      {showAddQuest ? (
        <form onSubmit={addQuest} style={{ background: '#1e293b', borderRadius: 8, padding: '12px', marginTop: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input autoFocus type="text" placeholder="Quest title..." value={qTitle} onChange={e => setQTitle(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <DifficultySelector value={qDiff} onChange={setQDiff} size="sm" />
              <span style={{ fontSize: '0.7rem', fontFamily: "'Orbitron', sans-serif", color: '#f59e0b', fontWeight: 700 }}>
                {calcFlexibleTaskXP(qDiff, false)} XP
              </span>
            </div>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowAddQuest(false)} style={cancelBtnStyle}>Cancel</button>
              <button type="submit" disabled={!qTitle.trim()} style={addBtnStyle}>Add</button>
            </div>
          </div>
        </form>
      ) : (
        <AddButton onClick={() => setShowAddQuest(true)} label="Add Quest" />
      )}

      <div style={{ height: 16 }} />

      {/* Habits preview */}
      {habits.length > 0 && (
        <>
          <SectionLabel>Active Habits ({habits.length})</SectionLabel>
          <div style={{ background: '#1e293b', borderRadius: 8, padding: '8px 12px', marginBottom: 4 }}>
            {habits.map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.8rem', color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                <span>{h.title}</span>
                <span style={{ color: h.currentStreak > 0 ? '#f59e0b' : '#475569' }}>
                  {h.currentStreak > 0 ? `🔥 ${h.currentStreak}` : '–'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* No tasks notice */}
      {planData.scheduledTasks.length === 0 && planData.flexibleTasks.length === 0 && habits.length === 0 && (
        <div style={{ background: '#1e293b', borderRadius: 8, padding: '12px', marginBottom: 16, fontSize: '0.8rem', color: '#64748b', textAlign: 'center' }}>
          No tasks planned. You can add them throughout the day (at 75% XP).
        </div>
      )}

      <div style={{ height: 20 }} />

      {/* Running total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Today's potential XP</span>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: '1rem', fontWeight: 700, color: '#f59e0b' }}>
          {totalPotentialXP.toLocaleString()}
        </span>
      </div>

      <ContinueButton onClick={onContinue} label="Review Plan →" />
    </div>
  );
}

// ─── Step 3: Confirm ──────────────────────────────────────────────────────────

function ConfirmStep({
  planData, habits, totalPotentialXP, onLockIn,
}: {
  planData: DayData;
  habits: DailyHabit[];
  totalPotentialXP: number;
  onLockIn: () => void;
}) {
  const scheduledCount = planData.scheduledTasks.length;
  const questCount     = planData.flexibleTasks.length;
  const habitCount     = habits.length;

  const isEmpty = scheduledCount === 0 && questCount === 0 && habitCount === 0;

  return (
    <div style={{ padding: '24px', textAlign: 'center' }}>
      <p style={{ margin: '0 0 4px', fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        You're all set
      </p>
      <h2 style={{ margin: '0 0 24px', fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
        Lock in your plan
      </h2>

      {/* Summary counts */}
      {!isEmpty ? (
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: 24 }}>
          {scheduledCount > 0 && <><strong style={{ color: '#f8fafc' }}>{scheduledCount}</strong> scheduled task{scheduledCount !== 1 ? 's' : ''}</>}
          {scheduledCount > 0 && (questCount > 0 || habitCount > 0) && ', '}
          {questCount > 0 && <><strong style={{ color: '#f8fafc' }}>{questCount}</strong> quest{questCount !== 1 ? 's' : ''}</>}
          {(scheduledCount > 0 || questCount > 0) && habitCount > 0 && ', '}
          {habitCount > 0 && <><strong style={{ color: '#f8fafc' }}>{habitCount}</strong> habit{habitCount !== 1 ? 's' : ''}</>}
          {' '}lined up
        </p>
      ) : (
        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 24 }}>
          No tasks planned. You can add them throughout the day (at 75% XP).
        </p>
      )}

      {/* Big XP number */}
      {totalPotentialXP > 0 && (
        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '3rem', fontWeight: 900, color: '#f59e0b',
          textShadow: '0 0 24px #f59e0b88',
          marginBottom: 8,
        }}>
          {totalPotentialXP.toLocaleString()}
        </div>
      )}
      {totalPotentialXP > 0 && (
        <p style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>potential XP</p>
      )}

      {/* Motivational text */}
      <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', marginBottom: 32 }}>
        "{getMotivation(totalPotentialXP)}"
      </p>

      {/* Lock In button */}
      <motion.button
        onClick={onLockIn}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        animate={{ boxShadow: ['0 0 12px #f59e0b44', '0 0 24px #f59e0b88', '0 0 12px #f59e0b44'] }}
        transition={{ repeat: Infinity, duration: 2 }}
        style={{
          padding: '14px 40px',
          background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
          border: 'none', borderRadius: 10,
          color: '#020617', fontSize: '1rem', fontWeight: 800,
          fontFamily: "'Outfit', sans-serif",
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}
      >
        <Lock size={16} /> Lock In
      </motion.button>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ margin: '0 0 6px', fontSize: '0.65rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </p>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: '0.75rem', color: '#334155', marginBottom: 6 }}>{children}</p>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 12px', background: 'transparent',
        border: '1px dashed #334155', borderRadius: 6,
        color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', marginTop: 4,
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#f59e0b'; e.currentTarget.style.color = '#f59e0b'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#64748b'; }}
    >
      <Plus size={13} /> {label}
    </button>
  );
}

function PlanTaskRow({
  title, sub, onRemove,
}: { title: string; sub: string; onRemove: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '7px 10px', background: '#1e293b', borderRadius: 6, marginBottom: 4,
    }}>
      <div>
        <div style={{ fontSize: '0.82rem', color: '#f8fafc', fontWeight: 500 }}>{title}</div>
        <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{sub}</div>
      </div>
      <button
        onClick={onRemove}
        style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.65rem' }}
        onMouseEnter={e => e.currentTarget.style.color = '#f43f5e'}
        onMouseLeave={e => e.currentTarget.style.color = '#475569'}
      >
        <SkipForward size={12} /> Skip
      </button>
    </div>
  );
}

function ContinueButton({ onClick, label = 'Continue →' }: { onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', padding: '11px', background: '#f59e0b',
        border: 'none', borderRadius: 8, color: '#020617',
        fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer',
      }}
    >
      {label}
    </button>
  );
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '4px 10px', background: 'transparent', border: '1px solid #334155',
  borderRadius: 5, color: '#64748b', fontSize: '0.7rem', cursor: 'pointer',
};

const addBtnStyle: React.CSSProperties = {
  padding: '4px 12px', background: '#f59e0b', border: 'none',
  borderRadius: 5, color: '#020617', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
};
