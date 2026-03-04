import { useState } from 'react';
import type { ClientNote } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { formatDate } from '../../utils/helpers';

interface NotesSectionProps {
  clientId: string;
  clientNotes?: ClientNote[];
  notes?: string; // Legacy notes field
}

export function NotesSection({
  clientId,
  clientNotes = [],
  notes = '',
}: NotesSectionProps) {
  const { addClientNote, updateClientNote, deleteClientNote, togglePinNote } = useClientContext();
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Sort notes: pinned first, then by date (newest first)
  const sortedNotes = [...clientNotes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleAddNote = () => {
    if (newNoteContent.trim()) {
      addClientNote(clientId, newNoteContent.trim());
      setNewNoteContent('');
      setIsAddingNote(false);
    }
  };

  const handleStartEdit = (note: ClientNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editingContent.trim()) {
      updateClientNote(clientId, editingNoteId, { content: editingContent.trim() });
    }
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const handleDelete = (noteId: string) => {
    if (confirm('Delete this note?')) {
      deleteClientNote(clientId, noteId);
    }
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Notes
        </h3>
        {!isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Note
          </button>
        )}
      </div>

      {/* Add New Note Form */}
      {isAddingNote && (
        <div className="mb-4 p-3 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Write your note..."
            rows={3}
            className="w-full px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            autoFocus
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => {
                setIsAddingNote(false);
                setNewNoteContent('');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              disabled={!newNoteContent.trim()}
              className="px-3 py-1.5 text-sm font-medium bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {sortedNotes.length === 0 && !notes ? (
        <div className="text-center py-8">
          <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="text-gray-500 dark:text-gray-400 text-sm">No notes yet</p>
          <p className="text-gray-400 dark:text-gray-500 text-xs mt-1">Click "Add Note" to create your first note</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {/* Legacy notes migration notice */}
          {notes && clientNotes.length === 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <p className="text-xs text-amber-700 dark:text-amber-300 mb-2">Legacy notes (add a new note to start using the new format):</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{notes}</p>
            </div>
          )}

          {sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`p-3 rounded-lg border transition-colors ${
                note.isPinned
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-white/50 dark:bg-white/5 border-gray-200 dark:border-gray-700'
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
                      onClick={handleCancelEdit}
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
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      {note.isPinned && (
                        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                      )}
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(note.createdAt)}
                        {note.updatedAt && ' (edited)'}
                      </span>
                      {note.linkedDate && (
                        <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {new Date(note.linkedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => togglePinNote(clientId, note.id)}
                        className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
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
                        className="p-1 text-gray-400 hover:text-violet-500 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        title="Edit"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(note.id)}
                        className="p-1 text-gray-400 hover:text-red-500 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
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
      )}
    </div>
  );
}
