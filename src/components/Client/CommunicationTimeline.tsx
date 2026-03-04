import { useState, type ReactNode } from 'react';
import type { CommunicationLogEntry, CommunicationType, ChecklistItem } from '../../types';
import { useClientContext } from '../../context/ClientContext';

interface CommunicationTimelineProps {
  clientId: string;
  entries?: CommunicationLogEntry[];
  checklist?: ChecklistItem[];
  /** If provided, the quick-log form pre-links to this task */
  preLinkedTaskId?: string;
  onClose?: () => void;
}

const TYPE_CONFIG: Record<CommunicationType, { icon: string; label: string; color: string }> = {
  email: { icon: '📧', label: 'Email', color: 'from-blue-400 to-indigo-500' },
  call: { icon: '📞', label: 'Call', color: 'from-emerald-400 to-green-500' },
  meeting: { icon: '🤝', label: 'Meeting', color: 'from-purple-400 to-pink-500' },
  note: { icon: '📝', label: 'Note', color: 'from-amber-400 to-orange-500' },
};

function groupEntriesByDate(entries: CommunicationLogEntry[]): { label: string; items: CommunicationLogEntry[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: { label: string; items: CommunicationLogEntry[] }[] = [
    { label: 'Today', items: [] },
    { label: 'Yesterday', items: [] },
    { label: 'This Week', items: [] },
    { label: 'Earlier', items: [] },
  ];

  for (const entry of entries) {
    const d = new Date(entry.timestamp);
    d.setHours(0, 0, 0, 0);
    if (d >= today) groups[0].items.push(entry);
    else if (d >= yesterday) groups[1].items.push(entry);
    else if (d >= weekAgo) groups[2].items.push(entry);
    else groups[3].items.push(entry);
  }

  return groups.filter(g => g.items.length > 0);
}

function followUpStatus(followUpDate: string): { label: string; color: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(followUpDate);
  due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return { label: `Overdue follow-up (${Math.abs(diffDays)}d ago)`, color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  if (diffDays === 0) return { label: 'Follow up today', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' };
  if (diffDays === 1) return { label: 'Follow up tomorrow', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
  return { label: `Follow up in ${diffDays} days`, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' };
}

function formatTime(ts: string) {
  return new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

interface QuickLogFormProps {
  clientId: string;
  preLinkedTaskId?: string;
  checklist?: ChecklistItem[];
  onDone: () => void;
}

function QuickLogForm({ clientId, preLinkedTaskId, checklist = [], onDone }: QuickLogFormProps) {
  const { addCommunication } = useClientContext();
  const [type, setType] = useState<CommunicationType>('note');
  const [summary, setSummary] = useState('');
  const [participants, setParticipants] = useState('');
  const [duration, setDuration] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [linkedTaskId, setLinkedTaskId] = useState(preLinkedTaskId ?? '');

  const handleSubmit = () => {
    if (!summary.trim()) return;
    addCommunication(clientId, {
      type,
      subject: summary.trim(),
      content: '',
      participants: participants.trim() ? participants.split(',').map(p => p.trim()) : undefined,
      duration: duration ? parseInt(duration, 10) : undefined,
      followUpDate: followUpDate || undefined,
      linkedTaskId: linkedTaskId || undefined,
    });
    onDone();
  };

  return (
    <div className="glass-subtle rounded-xl p-4 mb-4 border border-white/20 dark:border-white/10">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Log Communication</p>

      {/* Type pills */}
      <div className="flex gap-1.5 flex-wrap mb-3">
        {(Object.entries(TYPE_CONFIG) as [CommunicationType, typeof TYPE_CONFIG[CommunicationType]][]).map(([t, cfg]) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              type === t
                ? `bg-gradient-to-r ${cfg.color} text-white shadow-sm`
                : 'bg-white/50 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-white/80'
            }`}
          >
            {cfg.icon} {cfg.label}
          </button>
        ))}
      </div>

      <input
        value={summary}
        onChange={e => setSummary(e.target.value)}
        placeholder="Summary..."
        className="w-full mb-2 px-3 py-2 rounded-lg text-sm bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50"
        autoFocus
        onKeyDown={e => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onDone(); }}
      />

      <div className="grid grid-cols-2 gap-2 mb-2">
        <input
          value={participants}
          onChange={e => setParticipants(e.target.value)}
          placeholder="Participants (comma-sep)"
          className="px-3 py-1.5 rounded-lg text-xs bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50"
        />
        <input
          type="number"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          placeholder="Duration (min)"
          min="1"
          className="px-3 py-1.5 rounded-lg text-xs bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div>
          <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Follow-up date</label>
          <input
            type="date"
            value={followUpDate}
            onChange={e => setFollowUpDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        {checklist.length > 0 && (
          <div>
            <label className="block text-[10px] text-gray-500 dark:text-gray-400 mb-0.5">Linked task</label>
            <select
              value={linkedTaskId}
              onChange={e => setLinkedTaskId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg text-xs bg-white/50 dark:bg-white/10 border border-white/30 dark:border-white/10 outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              <option value="">None</option>
              {checklist.map(item => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-end">
        <button onClick={onDone} className="px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!summary.trim()}
          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm"
        >
          Log Entry
        </button>
      </div>
    </div>
  );
}

export function CommunicationTimeline({ clientId, entries = [], checklist = [], preLinkedTaskId, onClose }: CommunicationTimelineProps) {
  const { updateCommunication } = useClientContext();
  const [showForm, setShowForm] = useState(!!preLinkedTaskId);

  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  const groups = groupEntriesByDate(sorted);

  const resolveFollowUp = (entry: CommunicationLogEntry) => {
    updateCommunication(clientId, entry.id, { followUpDate: undefined, followUpResolved: true } as Partial<Omit<CommunicationLogEntry, 'id' | 'timestamp'>>);
  };

  const linkedTask = (taskId?: string): ReactNode => {
    if (!taskId) return null;
    const task = checklist.find(i => i.id === taskId);
    if (!task) return null;
    return (
      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        {task.title}
      </span>
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Communication Timeline</h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowForm(v => !v)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-purple-500 hover:bg-white/50 dark:hover:bg-white/10 transition-colors"
            title="Log communication"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          {onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <QuickLogForm
          clientId={clientId}
          preLinkedTaskId={preLinkedTaskId}
          checklist={checklist}
          onDone={() => setShowForm(false)}
        />
      )}

      {entries.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-6">
          No communications logged yet
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map(group => (
            <div key={group.label}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                {group.label}
              </p>
              <div className="space-y-2">
                {group.items.map(entry => {
                  const cfg = TYPE_CONFIG[entry.type];
                  const hasFollowUp = entry.followUpDate && !entry.followUpResolved;
                  const fuStatus = hasFollowUp ? followUpStatus(entry.followUpDate!) : null;

                  return (
                    <div key={entry.id} className="glass-subtle rounded-xl p-3 hover:bg-white/60 dark:hover:bg-white/15 transition-all">
                      <div className="flex items-start gap-2.5">
                        <span className="text-lg flex-shrink-0 mt-0.5">{cfg.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                              {entry.subject}
                            </p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                              {formatTime(entry.timestamp)}
                            </span>
                          </div>
                          {entry.content && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">{entry.content}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-1 mt-1.5">
                            {entry.participants && entry.participants.length > 0 && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                👤 {entry.participants.join(', ')}
                              </span>
                            )}
                            {entry.duration && (
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                                ⏱ {entry.duration}m
                              </span>
                            )}
                            {linkedTask(entry.linkedTaskId)}
                            {fuStatus && (
                              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded ${fuStatus.color}`}>
                                🔔 {fuStatus.label}
                                <button
                                  onClick={() => resolveFollowUp(entry)}
                                  className="ml-0.5 hover:opacity-70"
                                  title="Mark follow-up resolved"
                                >
                                  ✕
                                </button>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
