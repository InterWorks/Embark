import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Client } from '../../types';
import type { DashboardWidget } from '../../types/reportBuilder';
import { WIDGET_RENDERERS } from './widgetRenderers';

interface BuilderWidgetProps {
  widget: DashboardWidget;
  clients: Client[];
  onRemove: (id: string) => void;
  onNavigate?: (v: string) => void;
}

export function BuilderWidget({ widget, clients, onRemove, onNavigate }: BuilderWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    gridColumn: `span ${widget.cols}`,
  };

  const Renderer = WIDGET_RENDERERS[widget.type];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden"
    >
      {/* Widget header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-0.5"
            aria-label="Drag to reorder"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </button>
          <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{widget.title}</span>
        </div>
        <button
          onClick={() => onRemove(widget.id)}
          className="text-zinc-400 hover:text-red-500 transition-colors p-0.5"
          aria-label={`Remove ${widget.title}`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Widget content */}
      <div className="p-4">
        <Renderer clients={clients} onNavigate={onNavigate} />
      </div>
    </div>
  );
}
