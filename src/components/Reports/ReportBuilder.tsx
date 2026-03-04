import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { useClientContext } from '../../context/ClientContext';
import { useReportDashboards } from '../../hooks/useReportDashboards';
import { BuilderWidget } from './BuilderWidget';
import { WidgetLibrary } from './WidgetLibrary';
import { Button } from '../UI/Button';
import type { DashboardWidget, WidgetType } from '../../types/reportBuilder';
import { WIDGET_META, STARTER_DASHBOARDS } from '../../types/reportBuilder';
import { generateId } from '../../utils/helpers';

interface ReportBuilderProps {
  onNavigate?: (v: string) => void;
}

export function ReportBuilder({ onNavigate }: ReportBuilderProps) {
  const { clients } = useClientContext();
  const { dashboards, addDashboard, updateWidgets, deleteDashboard, renameDashboard } = useReportDashboards();

  const [activeDashboardId, setActiveDashboardId] = useState<string | null>(
    dashboards[0]?.id ?? null
  );
  const [showTemplates, setShowTemplates] = useState(false);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const activeDashboard = dashboards.find(d => d.id === activeDashboardId) ?? null;
  const widgets = activeDashboard?.widgets ?? [];

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !activeDashboardId) return;

    const oldIndex = widgets.findIndex(w => w.id === active.id);
    const newIndex = widgets.findIndex(w => w.id === over.id);
    const reordered = arrayMove(widgets, oldIndex, newIndex).map((w, i) => ({ ...w, order: i }));
    updateWidgets(activeDashboardId, reordered);
  }, [widgets, activeDashboardId, updateWidgets]);

  const handleAddWidget = useCallback((type: WidgetType) => {
    if (!activeDashboardId) {
      const d = addDashboard('My Dashboard', []);
      setActiveDashboardId(d.id);
      const widget: DashboardWidget = {
        id: generateId(),
        type,
        title: WIDGET_META[type].label,
        cols: WIDGET_META[type].defaultCols,
        order: 0,
      };
      updateWidgets(d.id, [widget]);
      return;
    }
    const widget: DashboardWidget = {
      id: generateId(),
      type,
      title: WIDGET_META[type].label,
      cols: WIDGET_META[type].defaultCols,
      order: widgets.length,
    };
    updateWidgets(activeDashboardId, [...widgets, widget]);
  }, [activeDashboardId, widgets, addDashboard, updateWidgets]);

  const handleRemoveWidget = useCallback((id: string) => {
    if (!activeDashboardId) return;
    updateWidgets(activeDashboardId, widgets.filter(w => w.id !== id).map((w, i) => ({ ...w, order: i })));
  }, [activeDashboardId, widgets, updateWidgets]);

  const handleNewDashboard = () => {
    const d = addDashboard('New Dashboard', []);
    setActiveDashboardId(d.id);
  };

  const handleLoadTemplate = (index: number) => {
    const tmpl = STARTER_DASHBOARDS[index];
    const d = addDashboard(tmpl.name, tmpl.widgets.map((w, i) => ({ ...w, id: generateId(), order: i })));
    setActiveDashboardId(d.id);
    setShowTemplates(false);
  };

  const handleDeleteDashboard = (id: string) => {
    deleteDashboard(id);
    const remaining = dashboards.filter(d => d.id !== id);
    setActiveDashboardId(remaining[0]?.id ?? null);
  };

  const startRename = (id: string, name: string) => {
    setRenaming(id);
    setRenameValue(name);
  };

  const commitRename = () => {
    if (renaming && renameValue.trim()) {
      renameDashboard(renaming, renameValue.trim());
    }
    setRenaming(null);
  };

  return (
    <div className="flex h-full" style={{ minHeight: '600px' }}>
      {/* Widget Library sidebar */}
      <WidgetLibrary onAdd={handleAddWidget} />

      {/* Main canvas area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dashboard tab bar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex-wrap">
          {dashboards.map(d => (
            <div key={d.id} className="flex items-center gap-1">
              {renaming === d.id ? (
                <input
                  autoFocus
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => { if (e.key === 'Enter') commitRename(); if (e.key === 'Escape') setRenaming(null); }}
                  className="px-2 py-0.5 text-xs border border-violet-400 rounded focus:outline-none"
                />
              ) : (
                <button
                  onClick={() => setActiveDashboardId(d.id)}
                  onDoubleClick={() => startRename(d.id, d.name)}
                  title="Double-click to rename"
                  className={`px-3 py-1 text-xs font-bold rounded-t-md border-b-2 transition-colors ${
                    d.id === activeDashboardId
                      ? 'border-violet-600 text-violet-700 dark:text-violet-300'
                      : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                  }`}
                >
                  {d.name}
                </button>
              )}
              <button
                onClick={() => handleDeleteDashboard(d.id)}
                className="text-zinc-300 hover:text-red-500 transition-colors text-xs"
                title="Delete dashboard"
              >×</button>
            </div>
          ))}
          <button
            onClick={handleNewDashboard}
            className="px-2 py-0.5 text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
          >
            + New
          </button>
          <button
            onClick={() => setShowTemplates(true)}
            className="px-2 py-0.5 text-xs text-violet-600 dark:text-violet-400 hover:underline"
          >
            From template
          </button>
          <div className="flex-1" />
          <button
            onClick={() => window.print()}
            className="px-3 py-1 text-xs font-bold border-2 border-zinc-300 dark:border-zinc-600 rounded-md hover:border-zinc-500 transition-colors"
          >
            Print / PDF
          </button>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-4">
          {!activeDashboard ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
              <p className="text-zinc-500 dark:text-zinc-400">No dashboard selected. Create one or load a template.</p>
              <div className="flex gap-3">
                <Button onClick={handleNewDashboard}>New Dashboard</Button>
                <Button variant="secondary" onClick={() => setShowTemplates(true)}>Load Template</Button>
              </div>
            </div>
          ) : widgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-2 text-center border-2 border-dashed border-zinc-300 dark:border-zinc-600 rounded-xl">
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">Click a widget in the library to add it here.</p>
            </div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-4 gap-4 print:grid-cols-4">
                  {[...widgets]
                    .sort((a, b) => a.order - b.order)
                    .map(widget => (
                      <BuilderWidget
                        key={widget.id}
                        widget={widget}
                        clients={clients}
                        onRemove={handleRemoveWidget}
                        onNavigate={onNavigate}
                      />
                    ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Template picker modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 border-2 border-zinc-900 dark:border-zinc-600 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-black font-display mb-4 text-zinc-900 dark:text-white">Load from Template</h3>
            <div className="space-y-3">
              {STARTER_DASHBOARDS.map((t, i) => (
                <button
                  key={i}
                  onClick={() => handleLoadTemplate(i)}
                  className="w-full text-left p-4 border-2 border-zinc-200 dark:border-zinc-700 rounded-lg hover:border-violet-500 transition-colors"
                >
                  <p className="font-bold text-zinc-800 dark:text-zinc-200">{t.name}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{t.widgets.length} widgets</p>
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-4">
              <Button variant="secondary" onClick={() => setShowTemplates(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
