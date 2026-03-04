import { useState, useEffect } from 'react';
import { generateId } from '../../utils/helpers';
import { useClientContext } from '../../context/ClientContext';
import type { TimeEntry } from '../../types';

const fmtMins = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

interface TimeEntryModalProps {
  clientId: string;
  taskId: string;
  taskTitle: string;
  entries: TimeEntry[];
  initialTab?: 'log' | 'history';
  onClose: () => void;
}

export function TimeEntryModal({ clientId, taskId, taskTitle, entries, initialTab = 'log', onClose }: TimeEntryModalProps) {
  const { addTimeEntry, updateChecklistItem } = useClientContext();
  const [tab, setTab] = useState<'log' | 'history'>(initialTab);
  const [hours, setHours] = useState('');
  const [mins, setMins] = useState('');
  const [note, setNote] = useState('');
  const [billable, setBillable] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleLog = () => {
    const h = parseInt(hours || '0');
    const m = parseInt(mins || '0');
    const duration = h * 60 + m;
    if (duration <= 0) return;

    const entry: TimeEntry = {
      id: generateId(),
      userId: 'current-user',
      duration,
      note: note.trim() || undefined,
      billable,
      loggedAt: new Date().toISOString(),
    };
    addTimeEntry(clientId, taskId, entry);
    setHours('');
    setMins('');
    setNote('');
    setTab('history');
  };

  const handleDelete = (entryId: string) => {
    // Filter out the entry from timeEntries via updateChecklistItem
    // We need to pass the updated timeEntries array
    const updated = entries.filter(e => e.id !== entryId);
    updateChecklistItem(clientId, taskId, { timeEntries: updated });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10">
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{taskTitle}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Time Tracking</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/20 dark:border-white/10">
          {(['log', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 text-xs font-medium transition-colors capitalize ${
                tab === t
                  ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-500'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t === 'log' ? 'Log Time' : `History (${entries.length})`}
            </button>
          ))}
        </div>

        <div className="p-4">
          {tab === 'log' ? (
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={hours}
                    onChange={e => setHours(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={mins}
                    onChange={e => setMins(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Note (optional)</label>
                <input
                  type="text"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="What did you work on?"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/20 outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={billable}
                  onChange={e => setBillable(e.target.checked)}
                  className="rounded accent-purple-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Billable</span>
              </label>
              <button
                onClick={handleLog}
                disabled={!hours && !mins}
                className="w-full py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                Log Time
              </button>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {entries.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No time entries yet</p>
              ) : (
                entries.slice().reverse().map(entry => (
                  <div key={entry.id} className="flex items-start justify-between gap-2 p-2 glass-subtle rounded-xl">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {fmtMins(entry.duration)}
                        {entry.billable && <span className="ml-1.5 text-[10px] px-1 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded">billable</span>}
                      </p>
                      {entry.note && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{entry.note}</p>}
                      <p className="text-[10px] text-gray-400">{new Date(entry.loggedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1 text-gray-300 hover:text-red-500 dark:hover:text-red-400 transition-colors flex-shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
