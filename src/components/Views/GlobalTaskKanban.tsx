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
import { useState, useMemo } from 'react';
import type { TaskStatus, ChecklistItem, Client } from '../../types';
import { useClientContext } from '../../context/ClientContext';
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Flatten all tasks from all active clients
  const allTasks = useMemo<FlatTask[]>(() => {
    return clients
      .filter(c => c.status !== 'completed' && !c.archived)
      .flatMap(client =>
        client.checklist.map(item => ({ item, client }))
      );
  }, [clients]);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {allTasks.length} tasks across {clients.filter(c => c.status !== 'completed' && !c.archived).length} active clients
          </p>
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
