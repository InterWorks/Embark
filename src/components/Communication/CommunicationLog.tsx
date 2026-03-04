import { useState, type ReactNode } from 'react';
import type { CommunicationLogEntry, CommunicationType } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';

interface CommunicationLogProps {
  clientId: string;
  entries?: CommunicationLogEntry[];
}

const typeConfig: Record<CommunicationType, { icon: ReactNode; color: string; label: string }> = {
  email: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    color: 'from-blue-400 to-indigo-500',
    label: 'Email',
  },
  call: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    color: 'from-emerald-400 to-green-500',
    label: 'Call',
  },
  meeting: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    color: 'from-purple-400 to-pink-500',
    label: 'Meeting',
  },
  note: {
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    color: 'from-amber-400 to-orange-500',
    label: 'Note',
  },
};

export function CommunicationLog({ clientId, entries = [] }: CommunicationLogProps) {
  const { addCommunication, updateCommunication, deleteCommunication } = useClientContext();
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CommunicationLogEntry | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<CommunicationType | 'all'>('all');

  // Form state
  const [type, setType] = useState<CommunicationType>('note');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [participants, setParticipants] = useState('');
  const [duration, setDuration] = useState('');

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredEntries =
    filterType === 'all' ? sortedEntries : sortedEntries.filter((e) => e.type === filterType);

  const resetForm = () => {
    setType('note');
    setSubject('');
    setContent('');
    setParticipants('');
    setDuration('');
    setEditingEntry(null);
  };

  const openEditForm = (entry: CommunicationLogEntry) => {
    setEditingEntry(entry);
    setType(entry.type);
    setSubject(entry.subject);
    setContent(entry.content);
    setParticipants(entry.participants?.join(', ') || '');
    setDuration(entry.duration?.toString() || '');
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!subject.trim()) return;

    const entryData = {
      type,
      subject: subject.trim(),
      content: content.trim(),
      participants: participants.trim()
        ? participants.split(',').map((p) => p.trim())
        : undefined,
      duration: duration ? parseInt(duration, 10) : undefined,
    };

    if (editingEntry) {
      updateCommunication(clientId, editingEntry.id, entryData);
    } else {
      addCommunication(clientId, entryData);
    }

    setShowForm(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    deleteCommunication(clientId, id);
    setShowDeleteConfirm(null);
  };

  const formatDate = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'long', hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold gradient-text">Communication Log</h3>
          {entries.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="p-2 text-gray-400 hover:text-purple-500 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors"
          title="Log communication"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Filter tabs */}
      {entries.length > 0 && (
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-all ${
              filterType === 'all'
                ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                : 'glass-subtle text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10'
            }`}
          >
            All
          </button>
          {(Object.keys(typeConfig) as CommunicationType[]).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap transition-all ${
                filterType === t
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                  : 'glass-subtle text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10'
              }`}
            >
              {typeConfig[t].label}
            </button>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <div className="text-center py-6">
          <div className="mx-auto h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-3">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No communications logged yet
          </p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          No {typeConfig[filterType as CommunicationType]?.label.toLowerCase()} entries
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {filteredEntries.map((entry) => {
            const config = typeConfig[entry.type];
            return (
              <div
                key={entry.id}
                className="group glass-subtle p-3 rounded-xl hover:bg-white/60 dark:hover:bg-white/15 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${config.color} shadow-lg flex-shrink-0`}>
                    <div className="text-white">{config.icon}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                          {entry.subject}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(entry.timestamp)}
                          {entry.duration && ` · ${entry.duration} min`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditForm(entry)}
                          className="p-1 text-gray-400 hover:text-purple-500"
                          title="Edit"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(entry.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="Delete"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    {entry.content && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {entry.content}
                      </p>
                    )}
                    {entry.participants && entry.participants.length > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {entry.participants.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          resetForm();
        }}
        title={editingEntry ? 'Edit Entry' : 'Log Communication'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(Object.keys(typeConfig) as CommunicationType[]).map((t) => {
                const config = typeConfig[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${
                      type === t
                        ? `bg-gradient-to-br ${config.color} text-white shadow-lg`
                        : 'glass-subtle text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/10'
                    }`}
                  >
                    {config.icon}
                    <span className="text-xs">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description"
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Details (optional)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
            />
          </div>

          {(type === 'meeting' || type === 'call') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="30"
                  min="1"
                  className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              {type === 'meeting' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Participants (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={participants}
                    onChange={(e) => setParticipants(e.target.value)}
                    placeholder="John, Sarah, Mike"
                    className="w-full px-4 py-2.5 rounded-xl border bg-white/50 dark:bg-white/5 backdrop-blur-sm text-gray-900 dark:text-gray-100 border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!subject.trim()}>
              {editingEntry ? 'Save Changes' : 'Log Entry'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(null)}
          />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative glass-strong rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-white/30 dark:border-white/10">
              <h3 className="text-lg font-semibold gradient-text mb-2">Delete Entry?</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Are you sure you want to delete this communication entry?
              </p>
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)}>
                  Cancel
                </Button>
                <Button variant="danger" onClick={() => handleDelete(showDeleteConfirm)}>
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
