import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { useState, useMemo, useRef, useEffect } from 'react';
import type { TaskStatus, ChecklistItem, Client } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { getEffectiveStatus } from '../../utils/helpers';

const CLIENT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];
function clientColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length];
}
import { TaskKanbanColumn } from './TaskKanbanColumn';
import { TaskKanbanCard } from './TaskKanbanCard';
import { TaskDrawer } from './TaskDrawer';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo',        title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'blocked',     title: 'Blocked' },
  { id: 'done',        title: 'Done' },
];

interface FlatTask {
  item: ChecklistItem;
  client: Client;
}

export default function GlobalTaskKanban() {
  const { clients, updateChecklistItemStatus } = useClientContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawerTask, setDrawerTask] = useState<FlatTask | null>(null);
  const [selectedClientIds, setSelectedClientIds] = useLocalStorage<string[]>('board-client-filter', []);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const activeClients = useMemo(
    () => clients.filter(c => c.status !== 'completed' && !c.archived),
    [clients]
  );

  // Close dropdown on outside click
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

  const toggleClient = (id: string) => {
    setSelectedClientIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Flatten tasks — only from selected clients (or all if none selected)
  const visibleClients = selectedClientIds.length > 0
    ? activeClients.filter(c => selectedClientIds.includes(c.id))
    : activeClients;

  const allTasks = useMemo<FlatTask[]>(() => {
    return visibleClients.flatMap(client =>
      client.checklist.map(item => ({ item, client }))
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clients, selectedClientIds]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, FlatTask[]> = { 'todo': [], 'in-progress': [], 'blocked': [], 'done': [] };
    for (const t of allTasks) {
      const s = getEffectiveStatus(t.item);
      map[s].push(t);
    }
    return map;
  }, [allTasks]);

  const activeTask = activeId ? allTasks.find(t => t.item.id === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column
    const targetCol = COLUMNS.find(c => c.id === overId);
    if (targetCol) {
      const task = allTasks.find(t => t.item.id === taskId);
      if (task && getEffectiveStatus(task.item) !== targetCol.id) {
        updateChecklistItemStatus(task.client.id, taskId, targetCol.id);
      }
      return;
    }

    // Dropped on another card — find its column
    const overTask = allTasks.find(t => t.item.id === overId);
    if (overTask) {
      const task = allTasks.find(t => t.item.id === taskId);
      const newStatus = getEffectiveStatus(overTask.item);
      if (task && getEffectiveStatus(task.item) !== newStatus) {
        updateChecklistItemStatus(task.client.id, taskId, newStatus);
      }
    }
  };

  return (
    <div className="h-full flex flex-col p-6 gap-6 overflow-hidden">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {allTasks.length} tasks
            {selectedClientIds.length > 0
              ? ` across ${visibleClients.length} selected client${visibleClients.length !== 1 ? 's' : ''}`
              : ` across ${activeClients.length} active client${activeClients.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Client filter */}
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(v => !v)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all ${
              selectedClientIds.length > 0
                ? 'bg-violet-100 dark:bg-violet-900/30 border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                : 'glass-subtle border-white/20 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            {selectedClientIds.length > 0 ? `${selectedClientIds.length} client${selectedClientIds.length !== 1 ? 's' : ''}` : 'All clients'}
            {selectedClientIds.length > 0 && (
              <button
                onClick={e => { e.stopPropagation(); setSelectedClientIds([]); }}
                className="ml-1 text-violet-500 hover:text-violet-700 dark:hover:text-violet-300"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 glass-strong rounded-xl shadow-xl border border-white/20 dark:border-white/10 z-20 max-h-72 overflow-y-auto">
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1.5 uppercase tracking-wide">
                  Filter by client
                </p>
                {activeClients.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-2">No active clients</p>
                ) : (
                  activeClients.map(client => {
                    const checked = selectedClientIds.includes(client.id);
                    return (
                      <button
                        key={client.id}
                        onClick={() => toggleClient(client.id)}
                        className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm transition-colors text-left ${
                          checked
                            ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200'
                            : 'hover:bg-white/50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: clientColor(client.id) }}
                        />
                        <span className="truncate flex-1">{client.name}</span>
                        {checked && (
                          <svg className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 overflow-y-auto pb-6">
          {COLUMNS.map(col => {
            const tasks = tasksByStatus[col.id];
            return (
              <TaskKanbanColumn key={col.id} id={col.id} title={col.title} itemIds={tasks.map(t => t.item.id)}>
                {tasks.map(t => (
                  <TaskKanbanCard
                    key={t.item.id}
                    item={t.item}
                    clientName={t.client.name}
                    clientColor={clientColor(t.client.id)}
                    onClick={() => setDrawerTask(t)}
                  />
                ))}
              </TaskKanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <TaskKanbanCard
              item={activeTask.item}
              clientName={activeTask.client.name}
              clientColor={clientColor(activeTask.client.id)}
              onClick={() => {}}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {drawerTask && (
        <TaskDrawer
          item={drawerTask.item}
          client={drawerTask.client}
          onClose={() => setDrawerTask(null)}
        />
      )}
    </div>
  );
}
