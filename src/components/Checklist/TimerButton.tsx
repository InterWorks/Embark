import { useTimeTracking, getActiveTimer, formatElapsed } from '../../hooks/useTimeTracking';
import { useClientContext } from '../../context/ClientContext';

interface TimerButtonProps {
  clientId: string;
  taskId: string;
  taskTitle: string;
}

export function TimerButton({ clientId, taskId, taskTitle }: TimerButtonProps) {
  const { isRunning, elapsed, startTimer, stopTimer } = useTimeTracking(clientId, taskId);
  const { addTimeEntry } = useClientContext();

  const handleClick = () => {
    if (isRunning) {
      const entry = stopTimer();
      if (entry) addTimeEntry(clientId, taskId, entry);
    } else {
      // Warn if another task's timer is running
      const current = getActiveTimer();
      if (current && (current.clientId !== clientId || current.taskId !== taskId)) {
        if (!window.confirm(`Timer is already running for "${current.taskTitle}". Switch to this task?`)) return;
        // Stop the other timer without saving (user dismissed)
      }
      startTimer(taskTitle);
    }
  };

  return (
    <button
      onClick={handleClick}
      title={isRunning ? `Stop timer (${formatElapsed(elapsed)})` : 'Start timer'}
      className={`
        flex items-center gap-1 text-xs px-1.5 py-0.5 rounded transition-all flex-shrink-0
        ${isRunning
          ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
          : 'text-gray-400 hover:text-green-600 dark:hover:text-green-400 opacity-0 group-hover:opacity-100'}
      `}
    >
      {isRunning ? (
        <>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse inline-block" />
          {formatElapsed(elapsed)}
        </>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
    </button>
  );
}
