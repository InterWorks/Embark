import { useState } from 'react';
import type { TimeEntry } from '../../types';
import { TimeEntryModal } from './TimeEntryModal';

const fmtMins = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
};

interface TimeEntryChipProps {
  clientId: string;
  taskId: string;
  taskTitle: string;
  entries: TimeEntry[];
}

export function TimeEntryChip({ clientId, taskId, taskTitle, entries }: TimeEntryChipProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (entries.length === 0) return null;

  const total = entries.reduce((s, e) => s + e.duration, 0);
  const billable = entries.filter(e => e.billable).reduce((s, e) => s + e.duration, 0);

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors flex-shrink-0"
        title="View time entries"
      >
        ⏱ {fmtMins(total)}{billable < total ? ` (${fmtMins(billable)} billable)` : ''}
      </button>
      {modalOpen && (
        <TimeEntryModal
          clientId={clientId}
          taskId={taskId}
          taskTitle={taskTitle}
          entries={entries}
          initialTab="history"
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
