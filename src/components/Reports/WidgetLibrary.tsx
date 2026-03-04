import { WIDGET_META } from '../../types/reportBuilder';
import type { WidgetType } from '../../types/reportBuilder';

interface WidgetLibraryProps {
  onAdd: (type: WidgetType) => void;
}

export function WidgetLibrary({ onAdd }: WidgetLibraryProps) {
  return (
    <div className="w-56 flex-shrink-0 border-r-2 border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900">
      <div className="p-4 border-b-2 border-zinc-200 dark:border-zinc-700">
        <h3 className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400">Widget Library</h3>
      </div>
      <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: 'calc(100vh - 240px)' }}>
        {(Object.keys(WIDGET_META) as WidgetType[]).map(type => {
          const meta = WIDGET_META[type];
          return (
            <button
              key={type}
              onClick={() => onAdd(type)}
              className="w-full text-left p-3 rounded-lg border-2 border-zinc-200 dark:border-zinc-700 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-white dark:hover:bg-zinc-800 transition-all group"
            >
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 group-hover:text-violet-700 dark:group-hover:text-violet-300">
                {meta.label}
              </p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-snug">
                {meta.description}
              </p>
              <div className="mt-1.5 flex gap-1">
                {([1, 2, 4] as const).map(cols => (
                  <span
                    key={cols}
                    className={`px-1.5 py-0.5 text-xs rounded font-mono ${cols === meta.defaultCols ? 'bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 font-bold' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}
                  >
                    {cols}col
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
