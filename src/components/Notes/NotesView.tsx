import { useState, useMemo } from 'react';
import type { ClientNote } from '../../types';
import { useClientContext } from '../../context/ClientContext';

interface NoteWithClient extends ClientNote {
  clientId: string;
  clientName: string;
}

export function NotesView() {
  const { clients, addClientNote, updateClientNote, deleteClientNote, togglePinNote } = useClientContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'client'>('date');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteClientId, setNewNoteClientId] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  // Get all notes from all clients
  const allNotes: NoteWithClient[] = useMemo(() => {
    const notes: NoteWithClient[] = [];
    clients
      .filter((c) => !c.archived)
      .forEach((client) => {
        (client.clientNotes || []).forEach((note) => {
          notes.push({
            ...note,
            clientId: client.id,
            clientName: client.name,
          });
        });
      });
    return notes;
  }, [clients]);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let notes = [...allNotes];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      notes = notes.filter(
        (note) =>
          note.content.toLowerCase().includes(query) ||
          note.clientName.toLowerCase().includes(query)
      );
    }

    // Filter by selected client
    if (selectedClientId) {
      notes = notes.filter((note) => note.clientId === selectedClientId);
    }

    // Sort
    if (sortBy === 'date') {
      // Pinned first, then by date
      notes.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    } else {
      // Group by client
      notes.sort((a, b) => {
        const clientCompare = a.clientName.localeCompare(b.clientName);
        if (clientCompare !== 0) return clientCompare;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }

    return notes;
  }, [allNotes, searchQuery, selectedClientId, sortBy]);

  // Get unique clients for filter dropdown
  const clientsWithNotes = useMemo(() => {
    const clientIds = new Set(allNotes.map((n) => n.clientId));
    return clients.filter((c) => clientIds.has(c.id) || !c.archived);
  }, [clients, allNotes]);

  const handleAddNote = () => {
    if (newNoteContent.trim() && newNoteClientId) {
      addClientNote(newNoteClientId, newNoteContent.trim());
      setNewNoteContent('');
      setNewNoteClientId('');
      setIsAddingNote(false);
    }
  };

  const handleStartEdit = (note: NoteWithClient) => {
    setEditingNoteId(note.id);
    setEditingClientId(note.clientId);
    setEditingContent(note.content);
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editingClientId && editingContent.trim()) {
      updateClientNote(editingClientId, editingNoteId, { content: editingContent.trim() });
    }
    setEditingNoteId(null);
    setEditingClientId(null);
    setEditingContent('');
  };

  const handleDelete = (clientId: string, noteId: string) => {
    if (confirm('Delete this note?')) {
      deleteClientNote(clientId, noteId);
    }
  };

  // Group notes by date for timeline view
  const notesByDate = useMemo(() => {
    const grouped: Record<string, NoteWithClient[]> = {};
    filteredNotes.forEach((note) => {
      const date = new Date(note.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(note);
    });
    return grouped;
  }, [filteredNotes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">Notes</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            All notes across your clients
          </p>
        </div>
        <button
          onClick={() => setIsAddingNote(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Note
        </button>
      </div>

      {/* Add Note Modal */}
      {isAddingNote && (
        <div className="glass-card p-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Add New Note</h3>
          <div className="space-y-3">
            <select
              value={newNoteClientId}
              onChange={(e) => setNewNoteClientId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
            >
              <option value="">Select a client...</option>
              {clients
                .filter((c) => !c.archived)
                .map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
            </select>
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Write your note..."
              rows={4}
              className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNoteContent('');
                  setNewNoteClientId('');
                }}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddNote}
                disabled={!newNoteContent.trim() || !newNoteClientId}
                className="px-4 py-2 text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border bg-white/50 dark:bg-white/5 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {/* Client Filter */}
          <select
            value={selectedClientId || ''}
            onChange={(e) => setSelectedClientId(e.target.value || null)}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-violet-500"
          >
            <option value="">All Clients</option>
            {clientsWithNotes.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>

          {/* Sort */}
          <div className="flex items-center gap-1 p-1 bg-white/30 dark:bg-white/10 rounded-lg">
            <button
              onClick={() => setSortBy('date')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                sortBy === 'date'
                  ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              By Date
            </button>
            <button
              onClick={() => setSortBy('client')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                sortBy === 'client'
                  ? 'bg-white dark:bg-white/20 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              By Client
            </button>
          </div>
        </div>
      </div>

      {/* Notes List */}
      {filteredNotes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <svg
            className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No notes found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || selectedClientId
              ? 'Try adjusting your filters'
              : 'Create your first note to get started'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(notesByDate).map(([date, notes]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                {date}
              </h3>
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className={`glass-card p-4 group ${
                      note.isPinned ? 'ring-2 ring-amber-400/50' : ''
                    }`}
                  >
                    {editingNoteId === note.id ? (
                      <div>
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditingClientId(null);
                              setEditingContent('');
                            }}
                            className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-3 py-1 text-sm font-medium bg-violet-500 text-white rounded-lg hover:bg-violet-600"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            {note.isPinned && (
                              <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                              </svg>
                            )}
                            <span className="px-2 py-1 text-xs font-medium bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-700 dark:text-violet-300 rounded-lg">
                              {note.clientName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(note.createdAt).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                              {note.updatedAt && ' (edited)'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => togglePinNote(note.clientId, note.id)}
                              className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 ${
                                note.isPinned ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'
                              }`}
                              title={note.isPinned ? 'Unpin' : 'Pin'}
                            >
                              <svg className="w-4 h-4" fill={note.isPinned ? 'currentColor' : 'none'} viewBox="0 0 20 20" stroke="currentColor">
                                <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleStartEdit(note)}
                              className="p-1.5 text-gray-400 hover:text-violet-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Edit"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(note.clientId, note.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                              title="Delete"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        {filteredNotes.length} note{filteredNotes.length !== 1 ? 's' : ''} total
        {selectedClientId && ` for ${clients.find((c) => c.id === selectedClientId)?.name}`}
      </div>
    </div>
  );
}
