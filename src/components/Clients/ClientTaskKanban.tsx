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
import type { Client, TaskStatus, ChecklistItem } from '../../types';
import { useClientContext } from '../../context/ClientContext';
import { getEffectiveStatus } from '../../utils/helpers';

const CLIENT_COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316'];
function clientColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return CLIENT_COLORS[Math.abs(hash) % CLIENT_COLORS.length];
}
import { TaskKanbanColumn } from '../Views/TaskKanbanColumn';
import { TaskKanbanCard } from '../Views/TaskKanbanCard';
import { TaskDrawer } from '../Views/TaskDrawer';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo',        title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'blocked',     title: 'Blocked' },
  { id: 'done',        title: 'Done' },
];

interface ClientTaskKanbanProps {
  client: Client;
}

export function ClientTaskKanban({ client }: ClientTaskKanbanProps) {
  const { updateChecklistItemStatus } = useClientContext();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [drawerItem, setDrawerItem] = useState<ChecklistItem | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, ChecklistItem[]> = { 'todo': [], 'in-progress': [], 'blocked': [], 'done': [] };
    for (const item of client.checklist) {
      const s = getEffectiveStatus(item);
      map[s].push(item);
    }
    return map;
  }, [client.checklist]);

  const activeItem = activeId ? client.checklist.find(i => i.id === activeId) : null;

  const handleDragStart = (e: DragStartEvent) => setActiveId(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;

    const itemId = active.id as string;
    const overId = over.id as string;

    const targetCol = COLUMNS.find(c => c.id === overId);
    if (targetCol) {
      const item = client.checklist.find(i => i.id === itemId);
      if (item && getEffectiveStatus(item) !== targetCol.id) {
        updateChecklistItemStatus(client.id, itemId, targetCol.id);
      }
      return;
    }

    const overItem = client.checklist.find(i => i.id === overId);
    if (overItem) {
      const item = client.checklist.find(i => i.id === itemId);
      const newStatus = getEffectiveStatus(overItem);
      if (item && getEffectiveStatus(item) !== newStatus) {
        updateChecklistItemStatus(client.id, itemId, newStatus);
      }
    }
  };

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map(col => {
            const items = tasksByStatus[col.id];
            return (
              <TaskKanbanColumn key={col.id} id={col.id} title={col.title} itemIds={items.map(i => i.id)}>
                {items.map(item => (
                  <TaskKanbanCard
                    key={item.id}
                    item={item}
                    clientName={client.name}
                    clientColor={clientColor(client.id)}
                    onClick={() => setDrawerItem(item)}
                  />
                ))}
              </TaskKanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeItem ? (
            <TaskKanbanCard
              item={activeItem}
              clientName={client.name}
              clientColor={clientColor(client.id)}
              onClick={() => {}}
              isDragging
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {drawerItem && (
        <TaskDrawer
          item={drawerItem}
          client={client}
          onClose={() => setDrawerItem(null)}
        />
      )}
    </>
  );
}
