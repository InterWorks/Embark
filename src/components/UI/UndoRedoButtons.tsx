import { useUndoRedo } from '../../context/UndoRedoContext';

export function UndoRedoButtons() {
  const { undo, redo, canUndo, canRedo } = useUndoRedo();

  return (
    <div className="flex items-center gap-1 glass-subtle rounded-lg p-1">
      <button
        onClick={undo}
        disabled={!canUndo}
        className={`p-1.5 rounded-md transition-all ${
          canUndo
            ? 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-white/10'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
        title="Undo (Ctrl+Z)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
          />
        </svg>
      </button>
      <button
        onClick={redo}
        disabled={!canRedo}
        className={`p-1.5 rounded-md transition-all ${
          canRedo
            ? 'text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-white/50 dark:hover:bg-white/10'
            : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
        }`}
        title="Redo (Ctrl+Shift+Z)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
          />
        </svg>
      </button>
    </div>
  );
}
