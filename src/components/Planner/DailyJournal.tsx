import { useState, useEffect, useRef } from 'react';
import type { DailyEntry } from '../../types';

interface DailyJournalProps {
  date: string;
  entry: DailyEntry | undefined;
  onUpdateJournal: (date: string, content: string) => void;
  onAddGoal: (date: string, title: string) => void;
  onToggleGoal: (date: string, goalId: string) => void;
  onRemoveGoal: (date: string, goalId: string) => void;
}

export function DailyJournal({
  date,
  entry,
  onUpdateJournal,
  onAddGoal,
  onToggleGoal,
  onRemoveGoal,
}: DailyJournalProps) {
  const [journalContent, setJournalContent] = useState(entry?.journalContent || '');
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync journal content when entry changes
  useEffect(() => {
    setJournalContent(entry?.journalContent || '');
  }, [entry?.journalContent, date]);

  // Auto-save journal content with debounce
  const handleJournalChange = (content: string) => {
    setJournalContent(content);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      onUpdateJournal(date, content);
    }, 500);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;
    onAddGoal(date, newGoalTitle.trim());
    setNewGoalTitle('');
  };

  const goals = entry?.dailyGoals || [];
  const completedGoals = goals.filter((g) => g.completed).length;

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="w-full flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="font-medium text-gray-900 dark:text-gray-100">Daily Journal</span>
        </div>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!isCollapsed && (
        <>
          {/* Journal Textarea */}
          <div>
            <textarea
              value={journalContent}
              onChange={(e) => handleJournalChange(e.target.value)}
              placeholder="Write your thoughts, reflections, or notes for today..."
              rows={4}
              className="w-full px-3 py-2 glass-subtle rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-gray-900 dark:text-gray-100 placeholder-gray-400 resize-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Auto-saves as you type</p>
          </div>

          {/* Daily Goals Section */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Daily Goals
                {goals.length > 0 && (
                  <span className="ml-2 text-gray-400">
                    ({completedGoals}/{goals.length})
                  </span>
                )}
              </h4>
            </div>

            {/* Goals List */}
            {goals.length > 0 && (
              <div className="space-y-1 mb-3">
                {goals
                  .sort((a, b) => a.order - b.order)
                  .map((goal) => (
                    <div
                      key={goal.id}
                      className="group flex items-center gap-2 p-2 rounded-lg hover:bg-white/30 dark:hover:bg-white/5 transition-colors"
                    >
                      <button
                        onClick={() => onToggleGoal(date, goal.id)}
                        className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors flex items-center justify-center ${
                          goal.completed
                            ? 'bg-purple-500 border-purple-500'
                            : 'border-gray-300 dark:border-gray-600 hover:border-purple-500'
                        }`}
                      >
                        {goal.completed && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          goal.completed
                            ? 'text-gray-400 line-through'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {goal.title}
                      </span>
                      <button
                        onClick={() => onRemoveGoal(date, goal.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition-all"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
              </div>
            )}

            {/* Add Goal Form */}
            <form onSubmit={handleAddGoal} className="flex items-center gap-2">
              <input
                type="text"
                value={newGoalTitle}
                onChange={(e) => setNewGoalTitle(e.target.value)}
                placeholder="Add a goal for today..."
                className="flex-1 px-3 py-1.5 glass-subtle rounded-lg border border-white/30 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400"
              />
              <button
                type="submit"
                disabled={!newGoalTitle.trim()}
                className="px-3 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Add
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
