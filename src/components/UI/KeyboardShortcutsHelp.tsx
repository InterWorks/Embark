import { SHORTCUTS } from '../../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

function KeyDisplay({ shortcut }: { shortcut: { key: string; ctrl?: boolean; shift?: boolean; alt?: boolean } }) {
  const keys = [];
  if (shortcut.ctrl) keys.push('Ctrl');
  if (shortcut.alt) keys.push('Alt');
  if (shortcut.shift) keys.push('Shift');
  keys.push(shortcut.key === ' ' ? 'Space' : shortcut.key);

  return (
    <span className="flex items-center gap-1">
      {keys.map((key, index) => (
        <span key={index}>
          <kbd className="px-2 py-1 text-xs font-black text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-700 border-2 border-zinc-900 dark:border-zinc-500 rounded-[4px] shadow-[2px_2px_0_0_#18181b] dark:shadow-[2px_2px_0_0_#71717a]">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="mx-1 text-zinc-400 font-bold">+</span>}
        </span>
      ))}
    </span>
  );
}

export function KeyboardShortcutsHelp({ isOpen, onClose }: KeyboardShortcutsHelpProps) {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Navigation',
      shortcuts: [
        { ...SHORTCUTS.navDashboard },
        { ...SHORTCUTS.navClients },
        { ...SHORTCUTS.navTasks },
        { ...SHORTCUTS.navPlanner },
        { ...SHORTCUTS.navHallOfHeroes },
        { ...SHORTCUTS.navAutomations },
        { ...SHORTCUTS.navNotes },
        { ...SHORTCUTS.navTeam },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { ...SHORTCUTS.newClient },
        { ...SHORTCUTS.search },
        { ...SHORTCUTS.selectAll },
      ],
    },
    {
      title: 'Views',
      shortcuts: [
        { ...SHORTCUTS.viewCards },
        { ...SHORTCUTS.viewTable },
        { ...SHORTCUTS.viewKanban },
        { ...SHORTCUTS.viewTimeline },
        { ...SHORTCUTS.viewGantt },
        { ...SHORTCUTS.viewCalendar },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { ...SHORTCUTS.escape },
        { ...SHORTCUTS.help },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/80"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-white shadow-[8px_8px_0_0_#18181b] dark:shadow-[8px_8px_0_0_#ffffff] rounded-[4px] p-6 max-w-lg w-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">
              Keyboard Shortcuts
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white rounded-[4px] border border-transparent hover:border-zinc-900 dark:hover:border-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {shortcutGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-sm font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-zinc-100 dark:border-zinc-700 last:border-b-0"
                    >
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                        {shortcut.description}
                      </span>
                      <KeyDisplay shortcut={shortcut} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t-2 border-zinc-200 dark:border-zinc-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center font-medium">
              Press <kbd className="px-1.5 py-0.5 text-xs font-black bg-zinc-100 dark:bg-zinc-700 border-2 border-zinc-900 dark:border-zinc-500 rounded-[4px]">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
