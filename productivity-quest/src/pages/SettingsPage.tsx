import { useState, useRef } from 'react';
import { Download, Upload, Trash2, Save } from 'lucide-react';
import { storage } from '../utils/storage';
import type { AppState } from '../hooks/useAppState';

interface Props {
  state: AppState;
  isMobile?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: i === 0 ? '12:00 AM' : i < 12 ? `${i}:00 AM` : i === 12 ? '12:00 PM' : `${i - 12}:00 PM`,
}));

export function SettingsPage({ state, isMobile }: Props) {
  const { profile, updateProfile } = state;

  const [nameInput,  setNameInput]  = useState(profile.displayName);
  const [nameSaved,  setNameSaved]  = useState(false);
  const [storageErr, setStorageErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Display name save ─────────────────────────────────────────────────────
  const saveName = () => {
    if (!nameInput.trim()) return;
    updateProfile({ displayName: nameInput.trim() });
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  // ── Day reset hour change ─────────────────────────────────────────────────
  const changeResetHour = (hour: number) => {
    if (hour === profile.dayResetHour) return;
    const ok = window.confirm(
      `Change day reset to ${HOURS[hour].label}?\n\nThis adjusts when "today" rolls over. Tasks around midnight may shift to a different day.`
    );
    if (ok) updateProfile({ dayResetHour: hour });
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const exportData = () => {
    try {
      const keys   = storage.keys();
      const data: Record<string, unknown> = {};
      keys.forEach(k => { data[k] = storage.get(k); });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `productivity-quest-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setStorageErr('Export failed. ' + String(e));
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────
  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Invalid format');
        const ok = window.confirm(
          'Import this data? This will overwrite your current data. The page will reload.'
        );
        if (!ok) return;
        // Clear old keys
        storage.keys().forEach(k => storage.remove(k));
        // Write new keys
        Object.entries(parsed).forEach(([k, v]) => storage.set(k, v));
        window.location.reload();
      } catch {
        setStorageErr('Import failed: invalid file format.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Reset ─────────────────────────────────────────────────────────────────
  const resetAll = () => {
    const ok = window.confirm(
      'DANGER: This will permanently delete ALL your data — XP, streaks, achievements, tasks.\n\nThis cannot be undone. Are you sure?'
    );
    if (!ok) return;
    const ok2 = window.confirm('Last chance. Delete everything?');
    if (!ok2) return;
    storage.keys().forEach(k => storage.remove(k));
    window.location.reload();
  };

  return (
    <div style={{
      marginLeft: isMobile ? 0 : 200,
      marginTop: 60,
      height: isMobile ? 'calc(100vh - 60px - 56px)' : 'calc(100vh - 60px)',
      overflowY: 'auto',
      padding: '24px',
    }}>
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
        {storageErr && (
          <div style={{
            background: '#ef444422', border: '1px solid #ef4444',
            borderRadius: 8, padding: '10px 14px',
            color: '#fca5a5', fontSize: '0.8rem',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            {storageErr}
            <button onClick={() => setStorageErr(null)} style={ghostBtn}>✕</button>
          </div>
        )}

        {/* Profile */}
        <Section title="Profile">
          <Label>Display Name</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              style={inp}
            />
            <button onClick={saveName} style={primaryBtn}>
              <Save size={14} /> {nameSaved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </Section>

        {/* Day Reset */}
        <Section title="Day Reset Time">
          <Label>Tasks before this hour count as the previous day.</Label>
          <p style={{ margin: '0 0 8px', fontSize: '0.72rem', color: '#475569', lineHeight: 1.5 }}>
            If you set 5 AM, finishing a task at 2 AM still counts for yesterday.
          </p>
          <select
            value={profile.dayResetHour}
            onChange={e => changeResetHour(Number(e.target.value))}
            style={{ ...inp, width: 'auto' }}
          >
            {HOURS.map(h => (
              <option key={h.value} value={h.value}>{h.label}</option>
            ))}
          </select>
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <Label>Theme</Label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ ...primaryBtn, opacity: 1 }}>Dark</button>
            <button style={{ ...ghostBtnFull, position: 'relative' }} disabled>
              Light
              <span style={{
                position: 'absolute', top: -6, right: -6,
                background: '#334155', color: '#64748b',
                fontSize: '0.55rem', padding: '1px 5px', borderRadius: 4,
                fontWeight: 600,
              }}>SOON</span>
            </button>
          </div>
        </Section>

        {/* Data Management */}
        <Section title="Data Management">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={exportData} style={{ ...primaryBtn, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
                <Download size={14} /> Export Data
              </button>
              <button onClick={() => fileRef.current?.click()} style={{ ...primaryBtn, background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>
                <Upload size={14} /> Import Data
              </button>
              <input ref={fileRef} type="file" accept=".json" onChange={importData} style={{ display: 'none' }} />
            </div>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#475569' }}>
              Export creates a JSON backup of all your data. Import will overwrite current data.
            </p>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 14, marginTop: 4 }}>
              <div style={{ fontSize: '0.72rem', color: '#ef4444', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Danger Zone
              </div>
              <button onClick={resetAll} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', background: '#ef444422',
                border: '1px solid #ef4444', borderRadius: 7,
                color: '#fca5a5', fontSize: '0.8rem', fontWeight: 700,
                cursor: 'pointer',
              }}>
                <Trash2 size={14} /> Reset All Data
              </button>
              <p style={{ margin: '8px 0 0', fontSize: '0.68rem', color: '#475569' }}>
                Permanently deletes everything. Cannot be undone.
              </p>
            </div>
          </div>
        </Section>

        {/* About */}
        <Section title="About">
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#475569', lineHeight: 1.6 }}>
            <strong style={{ color: '#94a3b8' }}>Productivity Quest</strong> — a gamified daily planner.<br />
            XP system inspired by RuneScape. All data is stored locally in your browser.
          </p>
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#0f172a', border: '1px solid #1e293b',
      borderRadius: 12, padding: '16px 20px',
    }}>
      <div style={{
        fontSize: '0.72rem', color: '#64748b',
        fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', marginBottom: 14,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{
      display: 'block', fontSize: '0.72rem', color: '#94a3b8',
      fontWeight: 600, marginBottom: 6,
    }}>
      {children}
    </label>
  );
}

const inp: React.CSSProperties = {
  padding: '8px 12px', background: '#1e293b',
  border: '1px solid #334155', borderRadius: 7,
  color: '#f8fafc', fontSize: '0.85rem',
  outline: 'none', flex: 1,
};
const primaryBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', background: '#f59e0b',
  border: 'none', borderRadius: 7,
  color: '#020617', fontSize: '0.8rem',
  fontWeight: 700, cursor: 'pointer',
  whiteSpace: 'nowrap',
};
const ghostBtn: React.CSSProperties = {
  background: 'none', border: 'none', color: '#64748b', cursor: 'pointer',
};
const ghostBtnFull: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '8px 16px', background: 'transparent',
  border: '1px solid #334155', borderRadius: 7,
  color: '#475569', fontSize: '0.8rem',
  cursor: 'not-allowed', whiteSpace: 'nowrap',
};
