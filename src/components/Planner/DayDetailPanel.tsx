import type { TimeBlock, DailyEntry, Client, ChecklistItem } from '../../types';
import { DailyJournal } from './DailyJournal';
import { DayTasks } from './DayTasks';
import { TimeBlockCard } from './TimeBlockCard';

interface DayDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date;
  timeBlocks: TimeBlock[];
  dailyEntry: DailyEntry | undefined;
  clients: Client[];
  onEditTimeBlock: (block: TimeBlock) => void;
  onDeleteTimeBlock: (blockId: string) => void;
  onCreateTimeBlock: () => void;
  onUpdateJournal: (date: string, content: string) => void;
  onAddGoal: (date: string, title: string) => void;
  onToggleGoal: (date: string, goalId: string) => void;
  onRemoveGoal: (date: string, goalId: string) => void;
  onToggleTask: (clientId: string, taskId: string) => void;
  onCreateTimeBlockFromTask: (task: ChecklistItem, client: Client) => void;
}

export function DayDetailPanel({
  isOpen,
  onClose,
  selectedDate,
  timeBlocks,
  dailyEntry,
  clients,
  onEditTimeBlock,
  onDeleteTimeBlock,
  onCreateTimeBlock,
  onUpdateJournal,
  onAddGoal,
  onToggleGoal,
  onRemoveGoal,
  onToggleTask,
  onCreateTimeBlockFromTask,
}: DayDetailPanelProps) {
  const dateString = selectedDate.toISOString().split('T')[0];

  const formatDateHeader = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isToday = selectedDate.toDateString() === new Date().toDateString();

  // Sort time blocks by start time
  const sortedBlocks = [...timeBlocks].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed lg:relative inset-y-0 right-0 w-full max-w-md lg:max-w-none glass-card z-50 lg:z-auto transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full lg:hidden'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                {formatDateHeader(selectedDate)}
              </h2>
              {isToday && (
                <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                  Today
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/50 dark:hover:bg-white/10 rounded-lg transition-colors hidden lg:block"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Daily Journal */}
          <div className="glass-subtle rounded-xl p-4">
            <DailyJournal
              date={dateString}
              entry={dailyEntry}
              onUpdateJournal={onUpdateJournal}
              onAddGoal={onAddGoal}
              onToggleGoal={onToggleGoal}
              onRemoveGoal={onRemoveGoal}
            />
          </div>

          {/* Tasks Due */}
          <div className="glass-subtle rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="font-medium text-gray-900 dark:text-gray-100">Tasks</span>
            </div>
            <DayTasks
              date={dateString}
              clients={clients}
              onToggleTask={onToggleTask}
              onCreateTimeBlockFromTask={onCreateTimeBlockFromTask}
            />
          </div>

          {/* Time Blocks */}
          <div className="glass-subtle rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-gray-100">Time Blocks</span>
                {sortedBlocks.length > 0 && (
                  <span className="text-xs text-gray-400">({sortedBlocks.length})</span>
                )}
              </div>
            </div>

            {sortedBlocks.length === 0 ? (
              <div className="py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                No time blocks scheduled
              </div>
            ) : (
              <div className="space-y-2">
                {sortedBlocks.map((block) => (
                  <TimeBlockCard
                    key={block.id}
                    block={block}
                    clients={clients}
                    onEdit={onEditTimeBlock}
                    onDelete={onDeleteTimeBlock}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Footer */}
        <div className="p-4 border-t border-white/20 dark:border-white/10">
          <div className="flex gap-2">
            <button
              onClick={onCreateTimeBlock}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Time Block
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
